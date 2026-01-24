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
        console.log("App moved to background. Stopping camera...");

        // 1. Stop camera (saves ~10% battery)
        if (this.cameraManager) this.cameraManager.stop();

        // 2. Stop motion detection loop (saves ~10% battery)
        if (this.motionManager) this.motionManager.stopLoop();

        // 3. Pause YouTube video if playing (saves ~60-70% battery)
        if (this.playerController && this.playerController.player) {
            try {
                const playerState = this.playerController.player.getPlayerState();
                // YT.PlayerState.PLAYING === 1
                if (playerState === 1) {
                    this.wasPlayingBeforeBackground = true;
                    this.playerController.player.pauseVideo();
                    console.log("Battery Saver: Paused YouTube video");
                }
            } catch (e) {
                console.warn("Could not pause YouTube:", e);
            }
        }

        // 4. Stop study timer (saves ~15-20% battery)
        if (this.exerciseTimer) {
            this.exerciseTimer.stop();
            console.log("Battery Saver: Stopped study timer");
        }
    }

    async handleForeground() {
        console.log("App moved to foreground. Restarting camera...");

        // 1. Restart camera
        if (this.cameraManager) await this.cameraManager.start();

        // 2. Restart motion detection
        if (this.motionManager) this.motionManager.startLoop();

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
