/**
 * Blog Post Renderer
 * Handles DOM rendering and content extraction
 */

export function extractIntro(htmlContent) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;

    const firstHeader = temp.querySelector('h2, h3');

    if (!firstHeader) {
        const text = temp.textContent || temp.innerText || "";
        if (text.length <= 200) return htmlContent;
        return text.substring(0, 200) + "...";
    }

    const introDiv = document.createElement('div');
    let currentNode = temp.firstChild;

    while (currentNode && currentNode !== firstHeader) {
        introDiv.appendChild(currentNode.cloneNode(true));
        currentNode = currentNode.nextSibling;
    }

    const introHtml = introDiv.innerHTML;
    return introHtml || htmlContent;
}

export function renderBlogPosts(posts, translations, currentLang) {
    const container = document.getElementById('blog-posts-grid');
    if (!container) return;
    container.innerHTML = '';

    const t = translations[currentLang];

    if (posts.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500">${t.no_results}</div>`;
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('article');
        card.className = 'group';

        const introContent = extractIntro(post.content);

        card.innerHTML = `
            <div class="relative aspect-[16/10] rounded-xl overflow-hidden mb-5 cursor-pointer blog-clickable" data-post-id="${post.id}">
                ${post.image ? `
                    <img src="${post.image}" alt="${post.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.parentNode.innerHTML='<div class=\\'absolute inset-0 bg-gradient-to-br from-primary/20 to-amber-200/20\\'></div>'">
                ` : `
                    <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-amber-200/20"></div>
                `}
                <div class="absolute top-4 left-4 bg-primary text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    ${post.category}
                </div>
            </div>
            <p class="text-primary text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                ${post.readTime}${t.read_time}
            </p>
            <h3 class="serif-title text-2xl mb-3 group-hover:text-primary transition-colors leading-tight cursor-pointer blog-clickable" data-post-id="${post.id}">${post.title}</h3>
            <p class="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-2 cursor-pointer blog-clickable" data-post-id="${post.id}">
                ${post.excerpt}
            </p>
            
            <div id="post-content-${post.id}" class="blog-post-content">
                <div id="intro-${post.id}" class="hidden cursor-pointer mt-4 pt-4 border-t border-white/10 blog-clickable" data-post-id="${post.id}">
                    ${introContent}
                </div>
                <div id="full-content-${post.id}" class="hidden cursor-pointer mt-4 pt-4 border-t border-white/10 blog-clickable" data-post-id="${post.id}">
                    ${post.content}
                </div>
            </div>
            
            <div class="mt-1 text-center flex items-center justify-center gap-2">
                 <button id="btn-${post.id}" data-post-id="${post.id}" class="blog-clickable bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">expand_more</span> ${t.read_more}
                </button>
                <a href="posts/post-${String(post.id).padStart(3, '0')}.html" class="text-slate-500 hover:text-white text-xs flex items-center gap-1" target="_blank">
                     <span class="material-symbols-outlined text-[14px]">open_in_new</span> ${t.open_new_window}
                </a>
            </div>

        `;

        container.appendChild(card);
    });

    // Add event delegation
    container.onclick = (e) => {
        const clickable = e.target.closest('.blog-clickable');
        if (clickable && window.togglePost) {
            const postId = clickable.dataset.postId;
            window.togglePost(e, parseInt(postId));
        }
    };
}

export function updatePostCount(count) {
    const countEl = document.getElementById('post-count');
    if (countEl) {
        countEl.textContent = String(count);
    }
}
