/**
 * Global API Exposure
 * Exposes functions to window for HTML event handlers (onClick, etc.)
 */

import { STORAGE_KEYS } from "./storage-manager.js";

export function exposeGlobals(
  playerController,
  playlistManager,
  ui,
  storage,
  cameraManager,
  motionManager,
  exerciseTimer,
) {
  // Core Player & Playlist
  window.playVideo = (index) => playerController.loadVideo(index);
  window.deleteVideo = (index) => playlistManager.deleteVideo(index);
  window.resetTimer = () => exerciseTimer.reset();
  window.playerController = playerController;
  window.playlistManager = playlistManager;
  window.motionManager = motionManager;
  window.ui = ui;
  window.storage = storage;
  window.cameraManager = cameraManager;

  window.playNext = () => playerController.playNext();
  window.playPrevious = () => playerController.playPrevious();
  window.togglePlay = () => playerController.togglePlay();
  // window.seek = (sec) => playerController.seek(sec);

  window.toggleLayout = () => {
    const mode = ui.toggleLayout();
    storage.set(STORAGE_KEYS.LAYOUT_MODE, mode ? "overlay" : "split");

    // Refresh camera brightness (split mode = full brightness, overlay mode = slider value)
    const savedOpacity = storage.get(STORAGE_KEYS.OPACITY, 0.5);
    cameraManager.setOpacity(savedOpacity);
  };

  window.togglePlaylist = () => ui.togglePlaylist();
  window.toggleSpeedMenu = () => ui.toggleSpeedMenu();
  window.toggleAbout = (tab) => ui.toggleAbout(tab);
  window.copyToClipboard = () => ui.copyToClipboard();
  window.changeLanguage = (lang) => ui.setLanguage(lang);

  // Bind Score Click Event
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.style.cursor = "pointer";
    try {
      const t =
        ui && ui.i18nManager
          ? ui.i18nManager.translations[ui.currentLang]
          : null;
      scoreElement.title =
        t && t.share_score_title ? t.share_score_title : "Click to share score";
    } catch (_) {
      scoreElement.title = "Click to share score";
    }
    scoreElement.onclick = () => {
      try {
        const t =
          ui && ui.i18nManager
            ? ui.i18nManager.translations[ui.currentLang]
            : null;
        ui.showSplash(
          t && t.share_generating
            ? t.share_generating
            : "Generating score image... 📸",
        );
      } catch (_) {
        ui.showSplash("Generating score image... 📸");
      }
      // Small delay to allow splash to render before heavy canvas work
      setTimeout(() => {
        const score = motionManager ? motionManager.getScore() : 0;
        const timerEl = document.getElementById("exerciseTimer");
        const time = timerEl ? timerEl.textContent : "";
        if (window.shareScore) {
          window.shareScore.shareScore(score, time);
        } else {
          console.error("ShareScore instance not found");
          try {
            const t =
              ui && ui.i18nManager
                ? ui.i18nManager.translations[ui.currentLang]
                : null;
            ui.showSplash(
              t && t.share_error
                ? t.share_error
                : "Error: Share feature not ready",
            );
          } catch (_) {
            ui.showSplash("Error: Share feature not ready");
          }
        }
      }, 50);
    };
  }

  window.toggleCameraFlip = () => {
    cameraManager.setFlip(!cameraManager.isFlipped);
    storage.set(STORAGE_KEYS.CAMERA_FLIP, cameraManager.isFlipped);
  };

  window.toggleYoutubeFlip = () => {
    playerController.setFlip(!playerController.isFlipped);
    storage.set(STORAGE_KEYS.YOUTUBE_FLIP, playerController.isFlipped);
  };

  window.updateOpacityFromSlider = (val) => {
    cameraManager.setOpacity(val);
    storage.set(STORAGE_KEYS.OPACITY, val);
  };

  window.updateSensitivityFromSlider = (val) => {
    storage.set(STORAGE_KEYS.SENSITIVITY, val);
    if (motionManager) {
      motionManager.updateSensitivity(val);
    }
  };

  // Playlist & Search UI Bindings
  window.searchVideos = async () => {
    const input = document.getElementById("searchInput");
    const container = document.getElementById("searchResults");

    if (!input || !container) return;

    const query = input.value.trim();
    const t = ui.i18nManager ? ui.i18nManager.translations[ui.currentLang] : {};
    if (!query) {
      ui.showSplash(t.search_empty || "Please enter a search term.");
      return;
    }

    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #aaa;">${t.searching || "Searching..."}</div>`;

    try {
      const results = await playlistManager.searchYouTube(query);

      container.innerHTML = ""; // Clear

      if (results.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #aaa;">${t.no_results || "No results found."}</div>`;
        return;
      }

      results.forEach((video) => {
        const rawTitle = video.title || "Untitled";
        const safeTitle = escapeHtml(rawTitle);
        const safeChannel = escapeHtml(video.channel || "");
        const safeThumb = video.thumbnail || "icon-192.png";
        const el = document.createElement("div");
        el.className = "search-item-card";
        el.innerHTML = `
                    <img class="search-item-thumb" src="${safeThumb}" alt="${safeTitle}">
                    <div class="search-item-info">
                        <div class="search-item-title" title="${safeTitle}">${safeTitle}</div>
                        <div class="search-item-channel">${safeChannel}</div>
                        <button class="search-add-btn" data-id="${video.id}" data-title="${safeTitle}">
                            + ${t.add || "Add"}
                        </button>
                    </div>
                `;
        container.appendChild(el);
      });

      // Add event delegation for the "Add" buttons
      container.onclick = (e) => {
        const btn = e.target.closest(".search-add-btn");
        if (btn) {
          const id = btn.dataset.id;
          const title = btn.dataset.title;
          if (id) window.addVideoFromResult(id, title);
        }
      };
    } catch (e) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff5555;">${t.error || "Error occurred"}</div>`;
      console.error(e);
    }
  };

  window.addVideoFromResult = (id, title) => {
    playlistManager.addVideo(id, title);
  };

  window.addVideo = async () => {
    const urlInput = document.getElementById("urlInput");
    const titleInput = document.getElementById("titleInput");
    if (urlInput && urlInput.value.trim()) {
      const url = urlInput.value.trim();
      const title = titleInput ? titleInput.value.trim() : null;
      const success = await playlistManager.addVideoFromUrl(url, title);
      if (success) {
        urlInput.value = "";
        if (titleInput) titleInput.value = "";
      }
    }
  };

  window.handleSearchKeyPress = (e) => {
    if (e.key === "Enter") window.searchVideos();
  };

  window.moveUp = (index) => playlistManager.moveUp(index);
  window.moveDown = (index) => playlistManager.moveDown(index);

    // Speed Buttons logic
    document.querySelectorAll(".speed-btn[data-speed]").forEach(btn => {
        const speed = btn.dataset.speed;
        btn.setAttribute("aria-label", `Set playback speed to ${speed}x`);
        btn.onclick = () => {
            const speedVal = parseFloat(speed);
            playerController.setSpeed(speedVal);
            // Update aria-pressed for all speed buttons
            document.querySelectorAll(".speed-btn[data-speed]").forEach(b => {
                b.setAttribute("aria-pressed", b === btn ? "true" : "false");
            });
        };
    });

    // Redundant click listeners removed. 
    // Consolidated into script.js with proper event delegation and control-ignoring logic.
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
