/**
 * UI Utils
 * Handles general UI utilities like toasts and clipboard interactions.
 */

export class UIUtils {
    constructor(i18nManager) {
        this.i18nManager = i18nManager;
    }

    showSplash(text) {
        const splash = document.createElement("div");
        splash.className = "splash-toast";
        splash.textContent = text;
        document.body.appendChild(splash);

        setTimeout(() => splash.classList.add("show"), 10);
        setTimeout(() => {
            splash.classList.remove("show");
            setTimeout(() => splash.remove(), 500);
        }, 3000);
    }

    copyToClipboard(currentLang) {
        const url = window.location.href;
        const t = this.i18nManager.translations[currentLang];
        navigator.clipboard.writeText(url).then(() => {
            this.showSplash(t.copy_success);
            if (window.pmfManager) window.pmfManager.tryOpenAuto();
        }).catch(err => {
            console.error('Could not copy text: ', err);
            this.showSplash(t.copy_fail);
        });
    }

    showLoading(id, show = true) {
        let loader = document.getElementById(`loader-${id}`);
        if (show) {
            if (!loader) {
                loader = document.createElement("div");
                loader.id = `loader-${id}`;
                loader.className = "loading-spinner-overlay";
                loader.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loader);
            }
            loader.classList.add("active");
        } else if (loader) {
            loader.classList.remove("active");
            setTimeout(() => loader.remove(), 300);
        }
    }
}
