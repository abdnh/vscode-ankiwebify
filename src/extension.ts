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

async function getGithubContext(): Promise<GithubContext> {
    let repo;
    let branch;
    const gitExtension = vscode.extensions.getExtension("vscode.git")!!.exports;
    const gitApi = gitExtension.getAPI(1);
    if (gitApi.repositories[0]) {
        const url = gitApi.repositories[0].state.remotes[0]?.fetchUrl;
        if (url) {
            const match =
                /https:\/\/.*?\/(?<repo>(?<username>.*?)\/(?<project>.*?))((\.git)$|\/|$)/.exec(
                    url
                );
            repo = match?.groups?.repo;
        }
        branch = gitApi.repositories[0].state.HEAD?.name;
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
            getGithubContext().then((githubContext) => {
                const editor = vscode.window.activeTextEditor;
                const converted = ankiwebify(
                    text,
                    path.dirname(editor!!.document.fileName),
                    githubContext.repo,
                    githubContext.branch
                );
                vscode.env.clipboard.writeText(converted);
                vscode.window.showInformationMessage(
                    "Copied AnkiWeb HTML to clipboard"
                );
            });
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
