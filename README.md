This VS Code extension converts Markdown to the HTML accepted by [AnkiWeb](https://ankiweb.net/).
It's intended for use by Anki add-on developers to make it easier to prepare an AnkiWeb description from an existing GitHub README.md.

The extension provides the "Convert to AnkiWeb HTML" command that converts selected Markdown (or the whole file if there is no selection) to HTML and writes the result to the clipboard. If run in a Git repository, it'll try to use the remote URL and current branch to rewrite relative links so that they work without changes if pasted to AnkiWeb.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
