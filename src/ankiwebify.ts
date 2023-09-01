import { marked } from "marked";
import { JSDOM } from "jsdom";
const path = require("node:path");

const allowedTags = ["img", "a", "b", "i", "code", "ul", "ol", "li", "div", "p", "br"];

function isRelativeLink(url: string): boolean {
    return !(
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("mailto:")
    );
}

// Remove things like . from a relative path and convert to POSIX format
function normalizeRelativeLink(rootDir: string, src: string): string {
    return path
        .relative(rootDir, path.resolve(path.join(rootDir, src)))
        .replaceAll("\\", "/");
}

export default function ankiwebify(
    markdown: string,
    rootDir: string,
    githubRepo?: string,
    branch: string = "master"
) {
    const parsedHtml = marked(markdown, { mangle: false, headerIds: false });
    const doc = new JSDOM(parsedHtml).window.document;

    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((tag) => {
        const b = doc.createElement("b");
        b.innerHTML = tag.innerHTML;
        tag.replaceWith(b);
        b.insertAdjacentText("beforebegin", "\n");
        b.insertAdjacentText("afterend", "\n");
    });

    doc.querySelectorAll("em").forEach((tag) => {
        const i = doc.createElement("i");
        i.innerHTML = tag.innerHTML;
        tag.replaceWith(i);
    });

    doc.querySelectorAll("strong").forEach((tag) => {
        const b = doc.createElement("b");
        b.innerHTML = tag.innerHTML;
        tag.replaceWith(b);
    });

    if (githubRepo) {
        doc.querySelectorAll("img, video").forEach((tag) => {
            let src = tag.getAttribute("src");
            if (src && isRelativeLink(src)) {
                src = normalizeRelativeLink(rootDir, src);
                tag.setAttribute(
                    "src",
                    `https://raw.githubusercontent.com/${githubRepo}/${branch}/${src}`
                );
            }
        });

        doc.querySelectorAll("a").forEach((tag) => {
            let href = tag.getAttribute("href");
            if (href && isRelativeLink(href)) {
                href = normalizeRelativeLink(rootDir, href);
                tag.setAttribute(
                    "href",
                    `https://github.com/${githubRepo}/blob/${branch}/${href}`
                );
            }
        });
    }

    doc.body.querySelectorAll("*").forEach((tag) => {
        if (!allowedTags.includes(tag.tagName.toLowerCase())) {
            tag.replaceWith(...tag.childNodes);
        }
    });

    return doc.body.innerHTML;
}
