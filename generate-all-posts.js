import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parsePost(mdContent, id) {
    // Extract front matter and content
    const frontMatterEnd = mdContent.indexOf('---', 3);
    if (frontMatterEnd === -1) return null;
    
    const frontMatter = mdContent.slice(3, frontMatterEnd).trim();
    const content = mdContent.slice(frontMatterEnd + 3).trim();
    
    // Parse front matter
    const frontMatterObj = {};
    frontMatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            frontMatterObj[key] = value;
        }
    });
    
    // Extract content for both languages
    const koContent = content.includes('class="ko"') ? 
        content.match(/<div[^>]*class=["']ko["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]?.trim() || '' : '';
    const enContent = content.includes('class="en"') ? 
        content.match(/<div[^>]*class=["']en["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]?.trim() || '' : '';
    
    return {
        id: parseInt(frontMatterObj.id) || id,
        title: frontMatterObj.title || `Post ${id}`,
        title_en: frontMatterObj.title_en || frontMatterObj.title || `Post ${id}`,
        category: frontMatterObj.category || '기타',
        category_en: frontMatterObj.category_en || frontMatterObj.category || 'Etc',
        readTime: frontMatterObj.readTime ? `${frontMatterObj.readTime} min read` : '5 min read',
        image: frontMatterObj.image || '',
        excerpt: frontMatterObj.excerpt || '',
        excerpt_en: frontMatterObj.excerpt_en || frontMatterObj.excerpt || '',
        date: frontMatterObj.date || new Date().toISOString().split('T')[0],
        content: koContent,
        content_en: enContent
    };
}

async function generateAllPosts() {
    const postsDir = path.join(__dirname, 'public', 'posts');
    const mdFiles = fs.readdirSync(postsDir)
        .filter(file => file.endsWith('.md') && file.startsWith('post-'))
        .sort();
    
    const allPosts = [];
    
    for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const post = parsePost(content, i + 1);
        if (post) {
            allPosts.push(post);
        }
    }
    
    const outputPath = path.join(postsDir, 'all-posts.json');
    fs.writeFileSync(outputPath, JSON.stringify(allPosts, null, 2));
    console.log(`Generated ${allPosts.length} posts in ${outputPath}`);
}

generateAllPosts().catch(console.error);
