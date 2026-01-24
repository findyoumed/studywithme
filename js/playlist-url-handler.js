/**
 * Playlist URL Handler
 * Handles YouTube URL parsing and playlist import functionality
 */

export class PlaylistUrlHandler {
    constructor(playlistManager, ui, youtubeHelper) {
        this.playlistManager = playlistManager;
        this.ui = ui;
        this.youtubeHelper = youtubeHelper;
    }

    async searchYouTube(query) {
        return await this.youtubeHelper.searchYouTube(query);
    }

    async addVideoFromUrl(url, manualTitle = null) {
        if (!url) return false;
        const trimmedUrl = url.trim();
        console.log("PlaylistUrlHandler: Processing URL:", trimmedUrl);

        // 1. Try to extract Video ID using a comprehensive regex
        // This regex handles: watch?v=, embed/, v/, youtu.be/, and shorts/
        const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = trimmedUrl.match(videoIdRegex);

        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};

        if (match && match[1]) {
            const videoId = match[1];
            console.log("PlaylistUrlHandler: Found video ID:", videoId);

            // Determine title: manual > API > default
            let title = manualTitle || "New Video";

            // Try to fetch actual title from API if no manual title provided
            if (!manualTitle && this.youtubeHelper) {
                const apiTitle = await this.youtubeHelper.getVideoTitle(videoId);
                if (apiTitle) title = apiTitle;
            }

            this.playlistManager.addVideo(videoId, title);
            return true;
        }

        // 2. Fallback: Check for playlist ID if no single video ID found
        const listMatch = trimmedUrl.match(/[?&]list=([^#&?]+)/);
        if (listMatch) {
            const playlistId = listMatch[1];
            console.log("PlaylistUrlHandler: Importing playlist ID:", playlistId);
            await this.importPlaylist(playlistId);
            return true;
        }

        // 3. Last resort: If it looks like a YouTube URL but regex failed, try to find any 11-char ID
        if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
            const parts = trimmedUrl.split(/[\/\?&]/);
            for (const part of parts) {
                if (part.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(part)) {
                    console.log("PlaylistUrlHandler: Fallback found video ID:", part);
                    let title = manualTitle || "New Video";
                    if (!manualTitle && this.youtubeHelper) {
                        const apiTitle = await this.youtubeHelper.getVideoTitle(part);
                        if (apiTitle) title = apiTitle;
                    }
                    this.playlistManager.addVideo(part, title);
                    return true;
                }
            }
        }

        console.warn("PlaylistUrlHandler: Invalid URL format:", trimmedUrl);
        this.ui.showSplash(t.invalid_url || "Invalid YouTube URL.");
        return false;
    }

    async importPlaylist(playlistId) {
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
        this.ui.showSplash(t.loading_playlist || "Loading playlist...");
        const items = await this._fetchPlaylistItems(playlistId);
        if (items && items.length > 0) {
            let count = 0;
            items.forEach(item => {
                const title = item.snippet.title;
                this.playlistManager.playlist.push({
                    id: item.snippet.resourceId.videoId,
                    title: { ko: title, en: title } // Default to same title for imported
                });
                count++;
            });

            this.playlistManager.savePlaylist();
            this.playlistManager.updateNextVideoUI();
            this.ui.showSplash(`${count} ${t.videos_imported || "videos imported."}`);
        } else {
            this.ui.showSplash(t.playlist_load_fail || "Failed to load playlist.");
        }
    }

    async _fetchPlaylistItems(playlistId) {
        return await this.youtubeHelper.fetchPlaylistItems(playlistId);
    }
}
