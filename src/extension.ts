import * as vscode from "vscode";
import ankiwebify from "./ankiwebify";
const path = require("node:path");

function getSelectedText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        return;
    }
    return editor.document.getText(selection);
}

function getDocumentText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    return editor.document.getText();
}

interface GithubContext {
    readonly repo?: string;
    readonly branch?: string;
}

async function getGithubContext(
    rootUri: vscode.Uri | undefined
): Promise<GithubContext> {
    let repo;
    let branch;
    const gitExtension = vscode.extensions.getExtension("vscode.git")!!.exports;
    const gitApi = gitExtension.getAPI(1);
    let repository;
    for (const repo of gitApi.repositories) {
        if (repo.rootUri.fsPath === rootUri?.fsPath) {
            repository = repo;
        }
    }

    if (repository) {
        const url = repository.state.remotes[0]?.fetchUrl;
        if (url) {
            const match =
                /https:\/\/.*?\/(?<repo>(?<username>.*?)\/(?<project>.*?))((\.git)$|\/|$)/.exec(
                    url
                );
            repo = match?.groups?.repo;
        }
        branch = repository.state.HEAD?.name;
    }
    if (typeof repo === "undefined") {
        repo = await vscode.window.showInputBox({ prompt: "GitHub repo" });
    }
    if (typeof branch === "undefined") {
        branch = await vscode.window.showInputBox({
            value: "master",
            prompt: "GitHub branch",
        });
    }
    return {
        repo,
        branch,
    };
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        "ankiwebify.convert",
        () => {
            const text = getSelectedText() ?? getDocumentText();
            if (!text) {
                return;
            }
            getGithubContext(
                vscode.workspace.workspaceFolders
                    ? vscode.workspace.workspaceFolders[0].uri
                    : undefined
            ).then((githubContext) => {
                const editor = vscode.window.activeTextEditor;
                const converted = ankiwebify(
                    text,
                    path.dirname(editor!!.document.fileName),
                    githubContext.repo,
                    githubContext.branch
                );
                vscode.env.clipboard.writeText(converted);
                vscode.window.setStatusBarMessage(
                    "Copied AnkiWeb HTML to clipboard",
                    2000
                );
            });
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
