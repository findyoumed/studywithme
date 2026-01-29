/**
 * Visibility Manager
 * Handles Page Visibility API to save battery when app is in background.
 * 
 * When app goes to background:
 * - Stops Motion Detection loop (saves GPU/CPU)
 * - Pauses timers (saves CPU wake-ups)
 * - Optionally pauses YouTube (saves video/audio decoding)
 */

export class VisibilityManager {
    constructor(motionManager, exerciseTimer, playerController) {
        this.motionManager = motionManager;
        this.exerciseTimer = exerciseTimer;
        this.playerController = playerController;
        
        // Track if YouTube was playing before going to background
        this.wasPlayingBeforeBackground = false;
        
        this.init();
    }

    init() {
        // Check if Page Visibility API is supported
        if (typeof document.hidden === 'undefined') {
            console.warn('Page Visibility API not supported in this browser');
            return;
        }

        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onBackground();
            } else {
                this.onForeground();
            }
        });

        console.log('VisibilityManager: Initialized');
    }

    onBackground() {
        console.log('🌙 App going to background - pausing activities to save battery');

        // 1. Stop Motion Detection loop (highest priority)
        if (this.motionManager) {
            this.motionManager.stopLoop();
            console.log('  ✓ Motion detection paused');
        }

        // 2. Pause Study Timer
        if (this.exerciseTimer) {
            this.exerciseTimer.stop();
            console.log('  ✓ Study timer paused');
        }

        // 3. Pause YouTube (optional but recommended)
        if (this.playerController && this.playerController.player) {
            try {
                const state = this.playerController.player.getPlayerState();
                
                // Only pause if currently playing
                if (state === YT.PlayerState.PLAYING) {
                    this.wasPlayingBeforeBackground = true;
                    this.playerController.player.pauseVideo();
                    console.log('  ✓ YouTube paused');
                } else {
                    this.wasPlayingBeforeBackground = false;
                }
            } catch (e) {
                console.warn('  ⚠ Could not pause YouTube:', e);
            }
        }

        console.log('💤 Background mode active - battery saving enabled');
    }

    onForeground() {
        console.log('☀️ App returning to foreground - resuming activities');

        // 1. Restart Motion Detection loop
        if (this.motionManager) {
            this.motionManager.startLoop();
            console.log('  ✓ Motion detection resumed');
        }

        // 2. Restart Study Timer (only if YouTube is playing)
        // This ensures timer only runs when the session is active
        if (this.exerciseTimer && this.playerController) {
            try {
                const state = this.playerController.player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    this.exerciseTimer.start();
                    console.log('  ✓ Study timer resumed');
                }
            } catch (e) {
                // Player might not be ready yet, that's ok
            }
        }

        // 3. Resume YouTube playback (optional - user preference)
        // Note: We DON'T automatically resume YouTube to avoid annoying users
        // They can manually press play if they want to continue
        if (this.wasPlayingBeforeBackground && this.playerController && this.playerController.player) {
            try {
                // Commented out: Let user manually resume
                // this.playerController.player.playVideo();
                console.log('  ℹ YouTube was playing (user can resume manually)');
            } catch (e) {
                console.warn('  ⚠ Could not resume YouTube:', e);
            }
        }

        this.wasPlayingBeforeBackground = false;
        console.log('✨ Foreground mode active');
    }
}
