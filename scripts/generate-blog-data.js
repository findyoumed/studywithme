import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../public/posts');
const OUTPUT_DIR = path.join(__dirname, '../public/posts/data');
const CONTENT_DIR = path.join(OUTPUT_DIR, 'content');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });

// Helper to strip HTML tags for search index
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

// Improved YAML-like parser for the specific format used
function parseFrontmatter(raw) {
    const data = {};
    let currentKey = null;
    let buffer = [];

    const lines = raw.split('\n');
    for (let line of lines) {
        const keyMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
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

function main() {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const metaList = [];
    const searchIndex = [];

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
            content: contentKo // Korean content is in the body
        };

        // 1. Meta Data (For List)
        metaList.push({
            id: postData.id,
            title: postData.title,
            category: postData.category,
            readTime: postData.readTime,
            image: postData.image,
            excerpt: postData.excerpt,
            title_en: postData.title_en,
            excerpt_en: postData.excerpt_en,
            category_en: postData.category_en
        });

        // 2. Search Data (For Search)
        searchIndex.push({
            id: postData.id,
            title: postData.title,
            category: postData.category,
            excerpt: postData.excerpt,
            content: stripHtml(postData.content), // Strip HTML
            title_en: postData.title_en,
            excerpt_en: postData.excerpt_en,
            content_en: stripHtml(postData.content_en) // Strip HTML
        });

        // 3. Full Content (For Detail)
        fs.writeFileSync(
            path.join(CONTENT_DIR, `${id}.json`),
            JSON.stringify(postData, null, 2)
        );
    });

    // Sort by ID descending
    metaList.sort((a, b) => b.id - a.id);

    // Write aggregate files
    fs.writeFileSync(path.join(OUTPUT_DIR, 'meta.json'), JSON.stringify(metaList, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'search.json'), JSON.stringify(searchIndex, null, 2));

    console.log("Blog data generation complete!");
    console.log(`- Meta: ${metaList.length} items`);
    console.log(`- Search Index: ${searchIndex.length} items`);
    console.log(`- Content Files: ${files.length} files`);
}

main();
