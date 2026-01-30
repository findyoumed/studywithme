/**
 * Player State Handler
 * Manages YouTube player state changes and progress saving
 */

export class PlayerStateHandler {
    constructor(player, storage, ui, exerciseTimer) {
        this.player = player;
        this.storage = storage;
        this.ui = ui;
        this.exerciseTimer = exerciseTimer;
    }

    onPlayerReady(event, autoPlayEnabled, playbackSpeed, isFlipped) {
        // Restore settings
        if (this.player.setPlaybackRate) {
            this.player.setPlaybackRate(playbackSpeed);
        }

        // Apply flip if needed
        const iframe = this.player.getIframe();
        if (iframe && isFlipped) {
            iframe.style.transform = "scaleX(-1)";
        }

        // Do not restore last playback time; always start from the beginning.

        // Auto-play attempt if enabled
        if (autoPlayEnabled) {
            this.player.playVideo();
        } else {
            // Explicitly ensure it's paused if auto-play is disabled
            if (typeof this.player.pauseVideo === 'function') {
                this.player.pauseVideo();
            }
        }
    }

    onPlayerStateChange(event, playNext) {
        const playIcon = document.getElementById("playIcon");

        if (event.data === YT.PlayerState.PLAYING) {
            if (playIcon) playIcon.textContent = "pause";

            if (this.exerciseTimer) this.exerciseTimer.start();

        } else if (event.data === YT.PlayerState.PAUSED) {
            if (playIcon) playIcon.textContent = "play_arrow";
            
            // Check if broadcasting - if so, keep timer running
            const isLive = window.liveManager && typeof window.liveManager.isLive === 'function' && window.liveManager.isLive();
            
            if (!isLive && this.exerciseTimer) {
                this.exerciseTimer.stop();
            } else if (isLive) {
                console.log("Broadcasting active, keeping timer running.");
            }
        } else if (event.data === YT.PlayerState.ENDED) {
            playNext();
        }
    }

}
