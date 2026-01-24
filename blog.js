import { translations } from './js/blog-i18n.js?v=2';
import { renderBlogPosts, updatePostCount } from './js/blog-renderer.js?v=2';
import { parsePost } from './js/blog-parser.js?v=2';
import { localizePost, localizePosts } from './js/blog-localize.js?v=2';
import { togglePost, updateUI, updateLoadMoreButton, bindSearchInput } from './js/blog-ui.js?v=2';

let blogPosts = [];
let currentLang = (() => { try { return localStorage.getItem("studywithme_lang") || "ko"; } catch (e) { return "ko"; } })();

function searchPosts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        renderCurrentState();
        updateLoadMoreButton(blogPosts.length, allFileNames.length);
        return;
    }

    // Search across ALL posts data
    const filtered = allPostsData.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.category.toLowerCase().includes(searchTerm)
    ).map(p => localizePost(p, currentLang));

    renderBlogPosts(filtered, translations, currentLang);
    updateLoadMoreButton(blogPosts.length, allFileNames.length); // Will hide the button during search
}

const POSTS_PER_PAGE = 6;
let allFileNames = [];
let currentPage = 0;
let allPostsData = []; // Store all posts for global search

async function loadBlogPosts() {
    try {
        const indexResponse = await fetch('posts/index.json');
        allFileNames = await indexResponse.json();
        updatePostCount(allFileNames.length);

        // Load all posts in background for global search
        loadAllPostsData();

        blogPosts = [];
        currentPage = 0;
        await loadNextBatch();
    } catch (error) {
        console.error('Failed to load post index', error);
    }
}

async function loadAllPostsData() {
    try {
        const bundleResponse = await fetch('posts/all-posts.json');
        if (bundleResponse.ok) {
            allPostsData = await bundleResponse.json();
        } else {
            // Fallback: load all individually if bundle missing
            const postPromises = allFileNames.map(async (file, index) => {
                const res = await fetch(`posts/${file}`);
                const md = await res.text();
                const post = parsePost(md);
                post.id = index + 1;
                return post;
            });
            allPostsData = (await Promise.all(postPromises)).filter(p => p !== null);
        }
    } catch (err) {
        console.error('Failed to load all posts data', err);
    }
}

async function loadNextBatch() {
    const start = currentPage * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const batchFiles = allFileNames.slice(start, end);

    if (batchFiles.length === 0) return;

    try {
        const postPromises = batchFiles.map(async (file, index) => {
            try {
                const postResponse = await fetch(`posts/${file}`);
                const md = await postResponse.text();
                const post = parsePost(md);
                post.id = start + index + 1;
                return post;
            } catch (err) {
                console.error(`Failed to load post: ${file}`, err);
                return null;
            }
        });

        const newPosts = (await Promise.all(postPromises)).filter(p => p !== null);
        blogPosts = [...blogPosts, ...newPosts];

        currentPage++;

        renderCurrentState();
        updateLoadMoreButton(blogPosts.length, allFileNames.length);
    } catch (error) {
        console.error('Failed to load post batch', error);
    }
}

function renderCurrentState() {
    const localizedPosts = localizePosts(blogPosts, currentLang);
    renderBlogPosts(localizedPosts, translations, currentLang);
}

async function loadMorePosts() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span>';
        await loadNextBatch();
        btn.disabled = false;
        btn.innerHTML = originalContent;
    } else {
        await loadNextBatch();
    }
}

function setLanguage(lang) {
    currentLang = lang;
    try { localStorage.setItem("studywithme_lang", lang); } catch (e) { /* ignore */ }
    updateUI(translations, currentLang);

    renderCurrentState();
}

bindSearchInput(searchPosts);

// Expose to window
window.changeLanguage = setLanguage;
window.searchPosts = searchPosts;
window.togglePost = (event, postId) => togglePost(event, postId, translations, currentLang);
window.loadMorePosts = loadMorePosts;

// Initial load
updateUI(translations, currentLang);
loadBlogPosts();
