/**
 * YouTube API Helper
 * Handles all YouTube API interactions (search, playlist import)
 */

export class YouTubeAPIHelper {
    constructor(ui) {
        this.ui = ui;
    }

    async searchYouTube(query) {
        if (!query) return [];

        let results = [];

        // 1. Try Vercel Serverless Function (Preferred)
        try {
            console.log("Attempting server-side search...");
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                results = this._mapYouTubeItems(data.items);
                return results;
            } else {
                console.warn("Server search failed, falling back to client-side.");
            }
        } catch (e) {
            console.warn("API endpoint not reachable (likely local), falling back to client-side.");
        }

        // 2. Client-side Fallback (Localhost)
        return await this._clientSideSearch(query);
    }

    async _clientSideSearch(query) {
        // Priority 1: Check localStorage (fastest, already saved)
        let apiKey = this._safeGetLocal("youtube_api_key");

        // Priority 2: Check .env file via server endpoint
        if (!apiKey) {
            apiKey = await this._getAPIKeyFromServer();
        }

        // Priority 3: Ask user via prompt
        if (!apiKey) {
            const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
            apiKey = prompt(
                t.enter_api_key || "Enter your YouTube Data API Key.\n\n💡 Tip: Set YOUTUBE_API_KEY in your .env file to avoid entering it every time.\n(Required for search when running locally)"
            );
            if (apiKey) {
                this._safeSetLocal("youtube_api_key", apiKey.trim());
            } else {
                return [];
            }
        }

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=30&q=${encodeURIComponent(query)}&key=${apiKey}`; // Ensuring 30 results

        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
                if (resp.status === 400 || resp.status === 403) {
                    alert(t.api_key_invalid || "API key is invalid or expired. Please reset it.");
                    this._safeRemoveLocal("youtube_api_key");
                }
                throw new Error(`HTTP ${resp.status}`);
            }
            const data = await resp.json();
            return this._mapYouTubeItems(data.items);
        } catch (e) {
            console.error("Client search failed", e);
            const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
            this.ui.showSplash(t.search_fail || "Search failed.");
            return [];
        }
    }

    async fetchPlaylistItems(playlistId) {
        let apiKey = this._safeGetLocal("youtube_api_key");
        if (!apiKey) {
            apiKey = await this._getAPIKeyFromServer();
        }

        if (!apiKey) {
            const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
            apiKey = prompt(t.enter_api_key_playlist || "Enter YouTube API Key for Playlist Import:");
            if (apiKey) this._safeSetLocal("youtube_api_key", apiKey);
            else return [];
        }

        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            return data.items;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async getVideoTitle(videoId) {
        let apiKey = this._safeGetLocal("youtube_api_key");
        if (!apiKey) {
            apiKey = await this._getAPIKeyFromServer();
        }

        if (!apiKey) return null;

        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                return this._decodeHtml(data.items[0].snippet.title);
            }
        } catch (e) {
            console.error("YouTubeAPIHelper: Failed to fetch video title", e);
        }
        return null;
    }

    async _getAPIKeyFromServer() {
        try {
            const response = await fetch('/api/get-api-key');
            if (response.ok) {
                const data = await response.json();
                if (data.apiKey) {
                    this._safeSetLocal("youtube_api_key", data.apiKey);
                    console.log("API key loaded from .env file");
                    return data.apiKey;
                }
            }
        } catch (e) {
            console.warn("Could not fetch API key from server:", e);
        }
        return null;
    }

    _mapYouTubeItems(items) {
        if (!items || !items.length) return [];
        return items.map(item => ({
            id: item.id.videoId,
            title: this._decodeHtml(item.snippet.title),
            thumbnail: item.snippet.thumbnails?.default?.url,
            channel: this._decodeHtml(item.snippet.channelTitle)
        }));
    }

    _decodeHtml(html) {
        if (!html) return "";
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    _safeGetLocal(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("LocalStorage get failed", e);
            return null;
        }
    }

    _safeSetLocal(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("LocalStorage set failed", e);
        }
    }

    _safeRemoveLocal(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn("LocalStorage remove failed", e);
        }
    }
}
