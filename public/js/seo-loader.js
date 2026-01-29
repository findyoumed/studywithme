
// SEO and Meta Loader
// Dynamically loads JSON-LD and heavy meta tags to keep index.html lightweight

const loadJsonLd = () => {
    fetch('/partials/json-ld.html')
        .then(response => response.text())
        .then(html => {
             // Extract script tags content and inject
             const parser = new DOMParser();
             const doc = parser.parseFromString(html, 'text/html');
             const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
             scripts.forEach(script => {
                 const newScript = document.createElement('script');
                 newScript.type = "application/ld+json";
                 newScript.textContent = script.textContent;
                 document.head.appendChild(newScript);
             });
        })
        .catch(err => console.warn('JSON-LD load failed', err));
};

const loadMetaTags = () => {
    fetch('/partials/meta-tags.html')
        .then(response => response.text())
        .then(html => {
            // Append to head
            const range = document.createRange();
            const fragment = range.createContextualFragment(html);
            document.head.appendChild(fragment);
        })
        .catch(err => console.warn('Meta tags load failed', err));
};

// Defer loading to prioritize FCP
if (requestIdleCallback) {
    requestIdleCallback(() => {
        loadJsonLd();
        loadMetaTags();
    });
} else {
    setTimeout(() => {
        loadJsonLd();
        loadMetaTags();
    }, 1000);
}
