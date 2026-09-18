// Strips HTML/markdown-ish markup and collapses whitespace so long rich-text
// fields (blog content, course/product descriptions) can be used as a meta
// description, which must be plain text and roughly 155-160 chars.
export function toMetaDescription(source: string, maxLength = 155): string {
    const text = source
        .replace(/<[^>]*>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // markdown images - drop entirely
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links - keep the label
        .replace(/[#*_`>]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
