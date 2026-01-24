export function localizePost(post, currentLang) {
    const isEn = currentLang === 'en';
    return {
        ...post,
        title: (isEn && post.title_en) ? post.title_en : post.title,
        excerpt: (isEn && post.excerpt_en) ? post.excerpt_en : post.excerpt,
        category: (isEn && post.category_en) ? post.category_en : post.category,
        content: (isEn && post.content_en) ? post.content_en : post.content
    };
}

export function localizePosts(posts, currentLang) {
    return posts.map(post => localizePost(post, currentLang));
}
