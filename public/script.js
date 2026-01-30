/**
 * Main Application Entry Point
 * 
 * Orchestrates:
 * - Storage
 * - UI
 * - Camera
 * - Playlist
 * - Player
 * - Motion Analysis
 */

import { initConsoleFilter } from "./js/console-filter.js";
import { exposeGlobals } from "./js/global-api.js";
import { storage, STORAGE_KEYS } from "./js/storage-manager.js";
import { ui } from "./js/ui-controls.js";
import { CameraManager } from "./js/camera-manager.js";
import { PlaylistManager } from "./js/playlist-manager.js";
import { PlayerController } from "./js/player-controller.js";
import { ExerciseTimer } from "./js/exercise-timer.js";
import { MotionManager } from "./js/motion-manager.js";
import { AppLifecycleManager } from "./js/app-lifecycle-manager.js";
import { ShareScore } from "./js/share-score.js";
import { IntroModal } from "./js/intro-modal.js";
import { PMFManager } from "./js/pmf-manager.js";

// Initialize Console Filter
initConsoleFilter();

/* Global Instances */
const cameraManager = new CameraManager(ui);
window.cameraManager = cameraManager; // Expose globally
let playerController; // Initialized later
let playlistManager; // Initialized later
let motionManager;
let exerciseTimer;
let appLifecycleManager;

/* Initialization */
document.addEventListener("DOMContentLoaded", async () => {
    // 0. Check Viewer Mode Early
    const urlParams = new URLSearchParams(window.location.search);
    const isViewerMode = urlParams.get('mode') === 'viewer' || window.location.pathname.includes('viewer.html');

    console.log("App Initializing... Viewer Mode:", isViewerMode);

    if (isViewerMode) {
        // If we are on index.html but have mode=viewer, we MUST redirect to viewer.html
        // because Vercel static hosting won't serve viewer.html for '/' automatically.
        if (!window.location.pathname.includes('viewer.html')) {
            window.location.href = `viewer.html${window.location.search}`;
            return;
        }

        // In viewer mode, we only need basic UI (for shared score maybe?) and LiveManager (handled by its own script)
        // We SKIP Player, Playlist, Motion, Timer, etc.
        return;
    }

    // 0. Initialize UI Helpers Immediately (for static onclick handlers)
    const shareScore = new ShareScore(ui);
    window.shareScore = shareScore;

    const pmfManager = new PMFManager(ui);
    window.pmfManager = pmfManager;

    // Provide a safe global handler for index.html onclick="shareMyScore()"
    window.shareMyScore = () => {
        try {
            const scoreVal = window.motionManager ? window.motionManager.getScore() : 0;
            const time = document.getElementById("exerciseTimer")?.textContent || "00:00:00";
            const medal = document.getElementById("scoreMedal")?.textContent || "🥉";
            const medalName = window.motionManager ? window.motionManager.getMedalName(scoreVal) : "Novice Focus";

            if (window.shareScore) {
                window.shareScore.shareScore(scoreVal, time, medal, medalName);
            }
        } catch (e) {
            console.warn(e);
            ui.showSplash("Share not ready yet.");
        }
    };

    // 1. Storage & Settings Loading
    const savedLayout = storage.get(STORAGE_KEYS.LAYOUT_MODE);
    // Only toggle if user explicitly saved 'split'. Default remains overlay.
    if (savedLayout === "split") ui.toggleLayout();

    // Check Intro Status Early
    let hasSeenIntro = false;
    try {
        hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
    } catch (e) {
        console.warn("App: localStorage unavailable", e);
    }

    // 2. Initialize Managers
    // Need to perform circular dependency injection manually

    // Create PlaylistManager first with null player
    playlistManager = new PlaylistManager(storage, ui, null);
    playlistManager.load();

    // Create ExerciseTimer
    exerciseTimer = new ExerciseTimer(storage);
    exerciseTimer.init();

    // Create PlayerController
    // Pass hasSeenIntro as autoPlayEnabled (if seen, auto-play; if not, wait)
    playerController = new PlayerController(ui, storage, playlistManager, exerciseTimer, hasSeenIntro);
    playerController.init(); // Starts YT API load

    // Back-link Player to PlaylistManager
    playlistManager.player = playerController;

    // Ensure UI is updated after linking
    playlistManager.updateNextVideoUI();

    // 9. Intro Modal (First Visit) - Initialize HERE before await calls
    // Pass playerController so it can start video on dismiss
    const introModal = new IntroModal(playerController);
    introModal.init();


    // 3. Motion Manager (create early so global bindings exist)
    motionManager = new MotionManager(storage);

    // 4. Expose Global Functions for UI Bindings (onClick=...)
    exposeGlobals(playerController, playlistManager, ui, storage, cameraManager, motionManager, exerciseTimer);

    // [LOG: 20260130_1400] Unified camera click listener on cameraBody only.
    // This avoids conflicts where individual targets (video, canvas) triggered pause
    // even when clicking control buttons.
    const cameraBody = document.getElementById('cameraBody');
    if (cameraBody) {
        cameraBody.addEventListener('click', (e) => {
            // [LOG: 20260130_1400] STRICT CHECK: Ignore any interaction intended for buttons or controls
            if (e.target.closest('button, a, .copy-btn, .live-btn-icon, .live-controls, .camera-header')) {
                return;
            }

            // Prevent bubbling to avoid any parent listeners
            e.stopPropagation();

            if (cameraManager) {
                cameraManager.togglePause();
            }
        });
    }

    // 5 & 6. Camera & Motion Detection (Parallelized for immediate scoring)
    const savedCameraFlip = storage.get(STORAGE_KEYS.CAMERA_FLIP, "true") === "true";
    cameraManager.setFlip(savedCameraFlip);
    const savedOpacity = storage.get(STORAGE_KEYS.OPACITY, 0.5);
    cameraManager.setOpacity(savedOpacity);

    if (!isViewerMode) {
        console.log("Starting Camera & Motion Detection in parallel...");
        await Promise.all([
            cameraManager.start(),
            motionManager.init()
        ]);

        // 7. Lifecycle Management (Battery Saving) - ONLY for studs
        appLifecycleManager = new AppLifecycleManager(
            cameraManager,
            motionManager,
            playerController,
            exerciseTimer
        );
        appLifecycleManager.init();

        // 8. Link Managers
        if (cameraManager && motionManager) {
            cameraManager.setMotionManager(motionManager);
        }
        if (motionManager && playerController) {
            motionManager.setPlayer(playerController);
        }
    } else {
        console.log("Viewer Mode: Skipping Camera & Motion Init");
        if (document.getElementById("placeholder")) {
            document.getElementById("placeholder").style.display = "none";
        }
    }
});
