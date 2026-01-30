/**
 * App Lifecycle Manager
 * Handles application-level events like visibility changes (background/foreground).
 * Manages battery-saving features by pausing heavy operations when app is hidden.
 */
export class AppLifecycleManager {
    constructor(cameraManager, motionManager, playerController, exerciseTimer) {
        this.cameraManager = cameraManager;
        this.motionManager = motionManager;
        this.playerController = playerController;
        this.exerciseTimer = exerciseTimer;

        // Track if video was playing before background switch
        this.wasPlayingBeforeBackground = false;
    }

    init() {
        document.addEventListener("visibilitychange", async () => {
            if (document.visibilityState === "hidden") {
                this.handleBackground();
            } else {
                await this.handleForeground();
            }
        });
    }

    handleBackground() {
        console.log("App moved to background.");

        const isLive = window.isLive || (window.liveManager && typeof window.liveManager.isLive === 'function' && window.liveManager.isLive());

        // 1. Stop camera ONLY if not live
        if (this.cameraManager && !isLive) {
            this.cameraManager.stop();
            console.log("Battery Saver: Stopped camera (not live)");
        } else {
            console.log("Live mode: Camera stays active in background");
        }

        // 2. Stop motion detection loop ONLY if not live
        if (this.motionManager && !isLive) {
            this.motionManager.stopLoop();
            console.log("Battery Saver: Stopped motion loop");
        } else if (this.motionManager && isLive) {
            console.log("Live mode: Switching to background loop (Interval)");
            // Force restart to switch from RAF to Interval
            this.motionManager.stopLoop();
            this.motionManager.startLoop();
        }

        // 3. Pause YouTube video if playing (saves ~60-70% battery)
        // We always pause YouTube in background to save local resources
        if (this.playerController && this.playerController.player) {
            try {
                const playerState = this.playerController.player.getPlayerState();
                if (playerState === 1) { // YT.PlayerState.PLAYING
                    this.wasPlayingBeforeBackground = true;
                    this.playerController.player.pauseVideo();
                    console.log("Battery Saver: Paused YouTube video");
                }
            } catch (e) {
                console.warn("Could not pause YouTube:", e);
            }
        }

        // 4. Stop study timer ONLY if not live
        if (this.exerciseTimer && !isLive) {
            this.exerciseTimer.stop();
            console.log("Battery Saver: Stopped study timer");
        } else if (this.exerciseTimer && isLive) {
            console.log("Live mode: Timer continues running");
        }
    }

    async handleForeground() {
        console.log("App moved to foreground. Restarting camera...");

        // 1. Restart camera ONLY if not live (live mode keeps camera active)
        if (this.cameraManager && !window.isLive) {
            await this.cameraManager.start();
            console.log("Battery Saver: Restarted camera");

            // Check if user manually paused scoring before backgrounding
            if (this.motionManager && this.motionManager.isScoringPaused) {
                console.log("AppLifecycle: Restoring manual pause state (freezing camera)");
                // Force pause the video element again to respect manual pause
                // Small timeout to override any auto-play behaviors from browser or start()
                setTimeout(() => {
                    if (this.motionManager.videoElement) {
                        this.motionManager.videoElement.pause();
                    }
                }, 100);
            }
        } else if (window.isLive) {
            console.log("Live mode: Camera already active");
        }

        // 2. Restart motion detection (Force switch from Interval to RAF)
        if (this.motionManager) {
            this.motionManager.stopLoop();
            this.motionManager.startLoop();
        }

        // 3. Resume YouTube video if it was playing
        if (this.playerController && this.playerController.player && this.wasPlayingBeforeBackground) {
            try {
                this.playerController.player.playVideo();
                this.wasPlayingBeforeBackground = false;
                console.log("Battery Saver: Resumed YouTube video");
            } catch (e) {
                console.warn("Could not resume YouTube:", e);
            }
        }

        // 4. Restart study timer if player is now playing
        if (this.exerciseTimer && this.playerController && this.playerController.player) {
            try {
                const playerState = this.playerController.player.getPlayerState();
                if (playerState === 1) {
                    this.exerciseTimer.start();
                    console.log("Battery Saver: Restarted study timer");
                }
            } catch (e) {
                console.warn("Could not restart timer:", e);
            }
        }
    }
}
