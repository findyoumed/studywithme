export function exposeGlobals({ ui, storage, STORAGE_KEYS, cameraManager, motionManager, playerController, playlistManager, exerciseTimer }) {
    window.playNext = () => playerController.playNext();
    window.playPrevious = () => playerController.playPrevious();
    window.togglePlay = () => playerController.togglePlay();
    window.seek = (sec) => playerController.seek(sec);

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
    window.copyToClipboard = () => ui.copyToClipboard();
    window.changeLanguage = (lang) => ui.setLanguage(lang);

    // Bind Score Click Event
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
        scoreElement.style.cursor = "pointer";
        scoreElement.title = "Click to share score";
        scoreElement.onclick = () => {
            ui.showSplash("Generating score image... 📸");
            // Small delay to allow splash to render before heavy canvas work
            setTimeout(() => {
                const scoreText = scoreElement.textContent.split(":")[1] || "0";
                const score = parseInt(scoreText.trim());
                const timerEl = document.getElementById("exerciseTimer");
                const time = timerEl ? timerEl.textContent : "";
                if (window.shareScore) {
                    window.shareScore.shareScore(score, time);
                } else {
                    console.error("ShareScore instance not found");
                    ui.showSplash("Error: Share feature not ready");
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

            results.forEach(video => {
                const rawTitle = video.title || "Untitled";
                const safeTitle = escapeHtml(rawTitle);
                const safeChannel = escapeHtml(video.channel || "");
                const safeTitleForAttr = String(rawTitle).replace(/'/g, "\\'");
                const safeThumb = video.thumbnail || "icon-192.png";
                const el = document.createElement("div");
                el.className = "search-item-card";
                el.innerHTML = `
                    <img class="search-item-thumb" src="${safeThumb}" alt="${safeTitle}">
                    <div class="search-item-info">
                        <div class="search-item-title" title="${safeTitle}">${safeTitle}</div>
                        <div class="search-item-channel">${safeChannel}</div>
                        <button class="search-add-btn" onclick="window.addVideoFromResult('${video.id}', '${safeTitleForAttr}')">
                            + ${t.add || "Add"}
                        </button>
                    </div>
                `;
                container.appendChild(el);
            });

        } catch (e) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff5555;">${t.error || "Error occurred"}</div>`;
            console.error(e);
        }
    };

    window.addVideoFromResult = (id, title) => {
        playlistManager.addVideo(id, title);
    };

    window.addVideo = () => {
        const urlInput = document.getElementById("urlInput");
        if (urlInput) playlistManager.addVideoFromUrl(urlInput.value);
    };

    window.handleSearchKeyPress = (e) => {
        if (e.key === "Enter") window.searchVideos();
    };

    window.moveUp = (index) => playlistManager.moveUp(index);
    window.moveDown = (index) => playlistManager.moveDown(index);

    // Speed Buttons logic
    document.querySelectorAll(".speed-btn[data-speed]").forEach(btn => {
        btn.onclick = () => {
            const speed = parseFloat(btn.dataset.speed);
            playerController.setSpeed(speed);
        };
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
