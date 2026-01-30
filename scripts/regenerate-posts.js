import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../public/posts');

// Helper to strip HTML tags for search index (optional, but good for meta description if needed)
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

// Improved YAML-like parser for the specific format used
function parseFrontmatter(raw) {
    const data = {};
    let currentKey = null;
    let buffer = [];

    const lines = raw.split(/\r?\n/);
    for (let line of lines) {
        const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*(.*)$/);
        if (keyMatch) {
            // Save previous
            if (currentKey) {
                data[currentKey] = buffer.join('\n');
            }
            currentKey = keyMatch[1];
            buffer = [keyMatch[2]];
        } else if (currentKey) {
            // Continuation
            buffer.push(line);
        }
    }
    // Save last
    if (currentKey) {
        data[currentKey] = buffer.join('\n');
    }

    // Clean up values (remove quotes)
    for (const key in data) {
        let val = data[key].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            // Handle escaped quotes inside
            val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
        data[key] = val;
    }

    return data;
}

import { generateHtml } from './blog-template.js';

function main() {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} posts.`);

    files.forEach(file => {
        const rawContent = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
        const match = rawContent.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);

        if (!match) {
            console.warn(`Skipping ${file}: Invalid format`);
            return;
        }

        const frontmatter = parseFrontmatter(match[1]);
        const contentKo = match[2].trim();

        // Ensure ID is a number
        const id = parseInt(frontmatter.id, 10);

        const postData = {
            ...frontmatter,
            id: id,
            content: contentKo
        };

        const html = generateHtml(postData);
        const outputFilename = file.replace('.md', '.html');
        const outputPath = path.join(POSTS_DIR, outputFilename);

        fs.writeFileSync(outputPath, html, 'utf-8');
        console.log(`Generated ${outputFilename}`);
    });

    console.log("All posts regenerated successfully!");
}

main();
