export function togglePost(event, postId, translations, currentLang) {
    if (event && typeof event.preventDefault === 'function') {
        // event.preventDefault();
    }
    console.log('togglePost called for postId:', postId);

    const fullContentDiv = document.getElementById(`full-content-${postId}`);
    const btn = document.getElementById(`btn-${postId}`);
    const introDiv = document.getElementById(`intro-${postId}`);
    const wrapper = document.getElementById(`post-content-${postId}`);

    if (!fullContentDiv || !btn) {
        console.error('Missing elements!');
        return;
    }

    const isHidden = fullContentDiv.classList.contains('hidden');
    console.log('Is full content hidden?', isHidden);

    if (isHidden) {
        console.log('Expanding to Full');
        fullContentDiv.classList.remove('hidden');
        if (introDiv) introDiv.classList.add('hidden');
        if (wrapper) wrapper.classList.add('active');

        const t = translations[currentLang];
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">expand_less</span> ${t.fold}`;
    } else {
        console.log('Collapsing to Hidden');
        fullContentDiv.classList.add('hidden');
        if (introDiv) introDiv.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('active');

        const t = translations[currentLang];
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">expand_more</span> ${t.read_more}`;

        if (event && event.target && event.target.closest && event.target.closest(`#btn-${postId}`)) {
            const card = btn.closest('article');
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

export function updateUI(translations, currentLang) {
    const t = translations[currentLang];
    document.documentElement.lang = currentLang;

    // Update page title and meta description
    if (t.page_title) {
        document.title = t.page_title;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && t.page_description) {
        metaDescription.setAttribute('content', t.page_description);
    }

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.innerHTML = t[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key]) el.placeholder = t[key];
    });

    const koBtn = document.getElementById("langKoBtn");
    const enBtn = document.getElementById("langEnBtn");
    if (koBtn && enBtn) {
        if (currentLang === "ko") {
            koBtn.classList.add("active");
            koBtn.style.color = "white";
            enBtn.classList.remove("active");
            enBtn.style.color = "#666";
        } else {
            enBtn.classList.add("active");
            enBtn.style.color = "white";
            koBtn.classList.remove("active");
            koBtn.style.color = "#666";
        }
    }
}

export function updateLoadMoreButton(blogPostsLength, totalPosts) {
    const container = document.getElementById('load-more-container');
    if (!container) return;

    // Hide button if searching or if all posts loaded
    const isSearching = document.getElementById('searchInput')?.value.trim() !== "";
    if (isSearching || blogPostsLength >= totalPosts) {
        container.classList.add('hidden');
    } else {
        container.classList.remove('hidden');
    }
}

export function bindSearchInput(onSearch) {
    document.getElementById('searchInput')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            onSearch();
        }
    });
}
