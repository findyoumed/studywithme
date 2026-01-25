import { PlayerStateHandler } from "./player-state-handler.js";
import { YouTubeApiLoader } from "./youtube-api-loader.js";
import { PlayerUiHandler } from "./player-ui-handler.js";

export class PlayerController {
  constructor(
    ui,
    storage,
    playlistManager,
    exerciseTimer,
    autoPlayEnabled = true,
  ) {
    this.ui = ui;
    this.storage = storage;
    this.playlistManager = playlistManager;
    this.exerciseTimer = exerciseTimer;
    this.autoPlayEnabled = autoPlayEnabled;

    this.player = null;
    this.currentIndex = 0;
    this.isFlipped = false;
    this.playbackSpeed = 1.0;
    this.stateHandler = null;
    this.apiLoader = new YouTubeApiLoader(ui);
    this.uiHandler = new PlayerUiHandler(this, ui);
  }

  init() {
    this.currentIndex = parseInt(this.storage.get("lastVideoIndex", 0));
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => this.createPlayer();
    }
    this.apiLoader.load(
      () => this.createPlayer(),
      () => this.handleAPILoadFailure(),
    );
    this.uiHandler.setupSpeedControls();
  }

  handleAPILoadFailure() {
    const t =
      this.ui && this.ui.i18nManager
        ? this.ui.i18nManager.translations[this.ui.currentLang]
        : null;
    const msg = t && t.api_load_error ? t.api_load_error : "YouTube API load failed.";
    this.ui.showSplash(msg);

    // Show visual placeholder if UI handler supports it
    if (this.uiHandler && this.uiHandler.showErrorPlaceholder) {
      this.uiHandler.showErrorPlaceholder(msg);
    }
  }

  createPlayer() {
    if (this.player) return;
    const video = this.playlistManager.get(this.currentIndex);
    const videoId = video ? video.id : "372ByJedKsY";

    try {
      this.player = new YT.Player("player", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          controls: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: (e) => this.onPlayerReady(e),
          onStateChange: (e) => this.onPlayerStateChange(e),
          onError: (e) => this.onPlayerError(e),
        },
      });
      this.stateHandler = new PlayerStateHandler(
        this.player,
        this.storage,
        this.ui,
        this.exerciseTimer,
      );
    } catch (e) {
      const t =
        this.ui && this.ui.i18nManager
          ? this.ui.i18nManager.translations[this.ui.currentLang]
          : null;
      this.ui.showSplash(
        t && t.player_create_error
          ? t.player_create_error
          : "Failed to create player.",
      );
    }
  }

  onPlayerReady(event) {
    // Mute by default for libraries/quiet environments
    if (this.player && typeof this.player.mute === "function") {
      this.player.mute();
    }

    this.stateHandler.onPlayerReady(
      event,
      this.autoPlayEnabled,
      this.playbackSpeed,
      this.isFlipped,
    );
    this.setSpeed(this.playbackSpeed);
    this.setFlip(this.isFlipped);
    this.updateNextUI();

    if (this.autoPlayEnabled) {
      setTimeout(() => {
        const state = this.player.getPlayerState();
        if (
          state === YT.PlayerState.UNSTARTED ||
          state === YT.PlayerState.CUED
        ) {
          this.uiHandler.showAutoplayOverlay(this.player, () => { });
        }
      }, 1000);
    }
  }

  onPlayerStateChange(event) {
    this.stateHandler.onPlayerStateChange(event, () => this.playNext());
  }

  onPlayerError(event) {
    if (event.data === 150 || event.data === 101) {
      const t =
        this.ui && this.ui.i18nManager
          ? this.ui.i18nManager.translations[this.ui.currentLang]
          : null;
      this.ui.showSplash(
        t && t.video_unavailable_skip
          ? t.video_unavailable_skip
          : "Video unavailable.",
      );
      setTimeout(() => this.playNext(), 2000);
    }
  }

  loadVideo(index) {
    if (index < 0 || index >= this.playlistManager.getCount()) return;
    this.currentIndex = index;
    const video = this.playlistManager.get(index);
    this.storage.set("lastVideoIndex", index);
    this.storage.set("lastVideoTime", 0);
    if (this.player && this.player.loadVideoById)
      this.player.loadVideoById(video.id);

    // Re-render playlist to update active item highlighting
    if (this.playlistManager) this.playlistManager.render();

    this.updateNextUI();
  }

  playNext() {
    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.playlistManager.getCount()) nextIndex = 0;
    this.loadVideo(nextIndex);
  }

  playPrevious() {
    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) prevIndex = this.playlistManager.getCount() - 1;
    this.loadVideo(prevIndex);
  }

  play() {
    if (this.player && typeof this.player.playVideo === "function") {
      this.player.playVideo();
    }
  }

  togglePlay() {
    if (!this.player || typeof this.player.getPlayerState !== "function")
      return;
    const state = this.player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) this.player.pauseVideo();
    else this.player.playVideo();
  }

  /*
  seek(seconds) {
    if (!this.player || !this.player.getCurrentTime) return;
    this.player.seekTo(this.player.getCurrentTime() + seconds);
  }
  */

  setSpeed(speed) {
    this.playbackSpeed = speed;
    if (this.player && this.player.setPlaybackRate)
      this.player.setPlaybackRate(speed);
    this.uiHandler.updateSpeedUI(speed);
  }

  setFlip(flipped) {
    this.isFlipped = flipped;
    const playerEl = document.getElementById("player");
    if (playerEl)
      playerEl.style.transform = flipped ? "scaleX(-1)" : "scaleX(1)";
    this.uiHandler.updateFlipUI(flipped);
  }

  updateNextUI() {
    if (this.playlistManager && this.playlistManager.updateNextVideoUI) {
      this.playlistManager.updateNextVideoUI();
    }
  }

  isPlaying() {
    if (!this.player || typeof this.player.getPlayerState !== "function")
      return false;
    return this.player.getPlayerState() === YT.PlayerState.PLAYING;
  }
}
