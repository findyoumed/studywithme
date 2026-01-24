/**
 * YouTube API Loader
 * Handles script injection and API ready callbacks.
 */
export class YouTubeApiLoader {
    constructor(ui) {
        this.ui = ui;
    }

    load(onReady, onFailure) {
        if (window.YT && window.YT.Player) {
            onReady();
            return;
        }

        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            this._waitForAPI(onReady, onFailure);
            return;
        }

        this._injectScript();
        this._waitForAPI(onReady, onFailure);
    }

    _injectScript() {
        console.log("YouTubeApiLoader: Injecting YouTube API script");
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onerror = () => console.error("YouTubeApiLoader: Failed to load script");
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag) firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        else document.head.appendChild(tag);
    }

    _waitForAPI(onReady, onFailure, retryCount = 0) {
        setTimeout(() => {
            if (window.YT && window.YT.Player) {
                onReady();
            } else if (retryCount < 10) { // 5 seconds total
                this._waitForAPI(onReady, onFailure, retryCount + 1);
            } else {
                onFailure();
            }
        }, 500);
    }
}
