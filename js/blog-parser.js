export function parseFrontMatter(raw) {
    const data = {};
    raw.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const idx = trimmed.indexOf(':');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (value === 'null') {
            value = null;
        } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        data[key] = value;
    });
    return data;
}

export function parsePost(md) {
    const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) {
        throw new Error('Invalid post format');
    }
    const data = parseFrontMatter(match[1]);
    const bodyContent = match[2].trim();

    // Use body content as default 'content' only if not specified in frontmatter
    // This preserves content_en from frontmatter while using body as Korean content
    if (!Object.prototype.hasOwnProperty.call(data, 'content')) {
        data.content = bodyContent;
    }
    return data;
}
