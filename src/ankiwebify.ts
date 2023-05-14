import { marked } from "marked";
import { JSDOM } from "jsdom";

const allowedTags = ["img", "a", "b", "i", "code", "ul", "ol", "li", "div"];

function isRelativeLink(url: string): boolean {
    return !(url.startsWith("http://") || url.startsWith("https://") || url.startsWith('mailto:'));
}

export default function ankiwebify(
    markdown: string,
    githubRepo?: string,
    branch: string = "master"
) {
    const parsedHtml = marked(markdown, {mangle: false, headerIds: false});
    const doc = new JSDOM(parsedHtml).window.document;
    doc.querySelectorAll("p").forEach((tag) => {
        tag.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
                child.textContent = (child.textContent ?? "").replace(
                    "\n",
                    " "
                );
            }
            if (child.nodeName === "BR") {
                child.replaceWith("\n");
            }
        });
    });

    doc.querySelectorAll("ul, ol").forEach((tag) => {
        tag.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
                child.textContent = (child.textContent ?? "").replace("\n", "");
            }
        });
    });

    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((tag) => {
        const b = doc.createElement("b");
        b.innerHTML = tag.innerHTML;
        tag.replaceWith(b);
        b.insertAdjacentText("beforebegin", "\n");
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
            const src = tag.getAttribute("src");
            if (src && isRelativeLink(src)) {
                // FIXME: handle src starting with './'
                tag.setAttribute(
                    "src",
                    `https://raw.githubusercontent.com/${githubRepo}/${branch}/${src}`
                );
            }
        });

        doc.querySelectorAll("a").forEach((tag) => {
            const href = tag.getAttribute("href");
            if (href && isRelativeLink(href)) {
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
