import { YouTubeAPIHelper } from './youtube-api-helper.js';
import { PlaylistUrlHandler } from './playlist-url-handler.js';
import { PlaylistDragHandler } from './playlist-drag-handler.js';
import { PlaylistRenderer } from './playlist-renderer.js';

export class PlaylistManager {
    constructor(storage, ui, playerController) {
        this.storage = storage;
        this.ui = ui;
        this.player = playerController;
        this.youtubeHelper = new YouTubeAPIHelper(ui);
        this.urlHandler = new PlaylistUrlHandler(this, ui, this.youtubeHelper);
        this.dragHandler = new PlaylistDragHandler(this);
        this.renderer = new PlaylistRenderer(this, ui);

        this.playlist = [];
        this._setupEventDelegation();
    }

    _setupEventDelegation() {
        const modal = document.getElementById("playlistModal");
        if (!modal) return;

        modal.onclick = (e) => {
            const item = e.target.closest(".playlist-item");
            if (!item) return;

            const index = parseInt(item.dataset.index);
            const actionBtn = e.target.closest("button");
            const infoArea = e.target.closest(".item-info");

            if (actionBtn) {
                if (actionBtn.classList.contains("move-up")) this.moveUp(index);
                else if (actionBtn.classList.contains("move-down")) this.moveDown(index);
                else if (actionBtn.classList.contains("delete-btn")) this.deleteVideo(index);
            } else if (infoArea) {
                if (window.playVideo) window.playVideo(index);
            }
        };
    }

    load() {
        this.playlist = this.storage.getJSON("playlist", []);
        if (this.playlist.length === 0) {
            fetch("playlist.txt")
                .then(res => res.text())
                .then(text => {
                    const lines = text.split('\n');
                    this.playlist = [];
                    lines.forEach(line => {
                        const parts = line.split('|');
                        if (parts.length >= 2) {
                            const id = parts[0].trim();
                            const titleKo = parts[1].trim();
                            const titleEn = parts[2] ? parts[2].trim() : titleKo;
                            this.playlist.push({ id, title: { ko: titleKo, en: titleEn } });
                        }
                    });
                    if (this.playlist.length === 0) {
                        this.playlist = [{ id: "372ByJedKsY", title: { ko: "집중력 향상 스터디", en: "Focus Improvement Study Session" } }];
                    }
                    this.savePlaylist();
                })
                .catch(err => {
                    console.warn("Failed to load playlist.txt", err);
                    this.playlist = [{ id: "372ByJedKsY", title: { ko: "집중력 향상 스터디", en: "Focus Improvement Study Session" } }];
                    this.savePlaylist();
                });
        } else {
            if (this.playlist.length > 0 && typeof this.playlist[0].title === 'string') {
                this.playlist = this.playlist.map(item => ({ ...item, title: { ko: item.title, en: item.title } }));
                this.savePlaylist();
            }
            this.render();
        }
    }

    addVideo(id, title) {
        if (!id) return;
        const titleObj = typeof title === 'object' ? title : { ko: title || "New Video", en: title || "New Video" };
        this.playlist.unshift({ id, title: titleObj });
        this.savePlaylist();
        this.updateNextVideoUI();
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : null;
        this.ui.showSplash(t && t.video_added ? t.video_added : "Video added.");
    }

    deleteVideo(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.playlist.splice(index, 1);
        this.savePlaylist();
        this.updateNextVideoUI();

        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : null;
        this.ui.showSplash(t && t.video_deleted ? t.video_deleted : "Video deleted.");
    }

    moveUp(index) {
        if (index <= 0) return;
        [this.playlist[index], this.playlist[index - 1]] = [this.playlist[index - 1], this.playlist[index]];
        this.savePlaylist();
        this.updateNextVideoUI();
    }

    moveDown(index) {
        if (index >= this.playlist.length - 1) return;
        [this.playlist[index], this.playlist[index + 1]] = [this.playlist[index + 1], this.playlist[index]];
        this.savePlaylist();
        this.updateNextVideoUI();
    }

    moveItem(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.playlist.length) return;
        const item = this.playlist.splice(fromIndex, 1)[0];
        this.playlist.splice(toIndex, 0, item);
        this.savePlaylist();
        this.updateNextVideoUI();
    }

    savePlaylist() {
        this.storage.set("playlist", JSON.stringify(this.playlist));
        this.render();
    }

    get(index) { return this.playlist[index]; }
    getCount() { return this.playlist.length; }

    updateNextVideoUI() {
        const nextTitleEl = document.getElementById("nextTitle");
        if (!nextTitleEl) return;
        if (this.playlist.length === 0) {
            nextTitleEl.textContent = "-";
            return;
        }
        const currentIdx = (this.player && typeof this.player.currentIndex === 'number') ? this.player.currentIndex : 0;
        const nextIdx = (currentIdx + 1) % this.playlist.length;
        const nextItem = this.playlist[nextIdx];
        if (nextItem) {
            const lang = this.ui.currentLang || 'ko';
            nextTitleEl.textContent = this._getTitle(nextItem, lang);
        } else {
            nextTitleEl.textContent = "-";
        }
    }

    render() {
        this.renderer.render(this.playlist, this.player ? this.player.currentIndex : -1);
        this.updateNextVideoUI();
    }

    async searchYouTube(query) { return await this.urlHandler.searchYouTube(query); }
    async addVideoFromUrl(url, title) { return await this.urlHandler.addVideoFromUrl(url, title); }
    async importPlaylist(playlistId) { return await this.urlHandler.importPlaylist(playlistId); }

    _getTitle(video, lang) {
        if (!video) return "Untitled";
        const title = video.title;
        if (!title) return "Untitled";
        if (typeof title === "string") return title;
        if (typeof title === "object") {
            return title[lang] || title.ko || title.en || "Untitled";
        }
        return "Untitled";
    }
}
