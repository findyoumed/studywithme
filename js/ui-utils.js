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

    async copyToClipboard(currentLang) {
        // 1. Auto Go Live if Host and not live
        const urlParams = new URLSearchParams(window.location.search);
        const isHost = urlParams.get('host') === 'true' || urlParams.get('host') === '1';
        
        if (isHost && typeof window.startBroadcasting === 'function') {
            // Check if not live (using both local flag and UI indicator for safety)
            const liveIndicator = document.getElementById('liveStatus');
            const isCurrentlyLive = window.isLive || (liveIndicator && liveIndicator.style.display !== 'none');
            
            if (!isCurrentlyLive) {
                console.log("[UIUtils] Auto-starting broadcast on share...");
                try {
                    await window.startBroadcasting();
                } catch (e) {
                    console.error("[UIUtils] Failed to start broadcast:", e);
                }
            }
        }

        // 2. Clear Copy Link (Ensure it's the viewer link)
        const url = new URL(window.location.href);
        url.searchParams.delete('host');
        url.searchParams.set('mode', 'viewer');
        const shareUrl = url.toString();

        const t = this.i18nManager.translations[currentLang];
        navigator.clipboard.writeText(shareUrl).then(() => {
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
