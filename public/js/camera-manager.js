/**
 * Camera Manager
 * Handles camera access, mirroring, and opacity.
 */

export class CameraManager {
    constructor(ui) {
        this.ui = ui; // Dependency on UI for alerts
        this.videoElement = document.getElementById("camera");
        this.canvasElement = document.getElementById("output_canvas");
        this.placeholder = document.getElementById("placeholder");
        this.stream = null;
        this.isFlipped = true; // Default
        this.isPaused = false;
        this.motionManager = null;
    }

    async start() {
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.ui.showSplash(t.camera_not_supported || "This browser does not support camera.");
            return;
        }

        // If already running, don't start again
        if (this.stream && this.stream.active) {
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                },
                audio: false,
            });

            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;

                // Wait for video to be ready with timeout
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error("Camera initialization timed out"));
                    }, 10000); // 10s timeout

                    this.videoElement.onloadedmetadata = () => {
                        clearTimeout(timeoutId);
                        this.videoElement.play();
                        // Show Video & Canvas (Remove display: none)
                        this.videoElement.style.display = "block";
                        if (this.canvasElement) this.canvasElement.style.display = "block";

                        if (this.placeholder) this.placeholder.style.display = "none";
                        resolve();
                    };
                });
            }
        } catch (err) {
            console.error("CameraManager: Error", err);
            const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
            let msg = t.check_camera_permission || "Please check camera permissions.";
            if (err.message && err.message.includes("timed out")) {
                msg = t.camera_timeout || "Camera timed out. Please refresh or check if another app is using it.";
            }
            this.ui.showSplash(msg);
            if (this.placeholder) {
                this.placeholder.textContent = msg;
            }
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement.style.display = "none";
        }
        if (this.canvasElement) {
            this.canvasElement.style.display = "none";
        }
        if (this.placeholder) {
            this.placeholder.style.display = "flex";
        }
    }

    getVideoTrack() {
        if (this.stream) {
            return this.stream.getVideoTracks()[0];
        }
        return null;
    }

    setMotionManager(motionManager) {
        this.motionManager = motionManager;
    }

    togglePause() {
        if (!this.stream) return;

        if (this.isPaused) {
            this.videoElement.play();
            this.isPaused = false;

            // Resume live broadcast video track if broadcasting
            if (window.isLive && window.localTracks && window.localTracks.videoTrack) {
                try {
                    window.localTracks.videoTrack.setEnabled(true);
                    console.log('Live broadcast video track resumed');
                } catch (e) {
                    console.warn('Failed to resume broadcast video track:', e);
                }
            }
        } else {
            this.videoElement.pause();
            this.isPaused = true;

            // Pause live broadcast video track if broadcasting
            if (window.isLive && window.localTracks && window.localTracks.videoTrack) {
                try {
                    window.localTracks.videoTrack.setEnabled(false);
                    console.log('Live broadcast video track paused');
                } catch (e) {
                    console.warn('Failed to pause broadcast video track:', e);
                }
            }
        }

        const cameraPanel = document.querySelector('.camera-panel');
        if (cameraPanel) {
            cameraPanel.classList.toggle('paused', this.isPaused);
        }

        if (this.motionManager) {
            this.motionManager.togglePause();
        }
        console.log(`Camera paused state: ${this.isPaused}`);
    }

    async toggle() {
        if (this.stream && this.stream.active) {
            this.stop();
            return false; // Camera is now OFF
        } else {
            await this.start();
            return true; // Camera is now ON
        }
    }

    setFlip(flipped) {
        this.isFlipped = flipped;
        const scale = flipped ? "scaleX(-1)" : "scaleX(1)";

        if (this.videoElement) this.videoElement.style.transform = scale;
        if (this.canvasElement) this.canvasElement.style.transform = scale;

        const btn = document.getElementById("flipCameraBtn");
        if (btn) {
            btn.classList.toggle("active", flipped);
        }
    }

    setOpacity(value) {
        // value is 0 to 1
        const brightness = value === 0 ? 0 : 1;
        const finalOpacity = value === 0 ? 1.0 : value;

        if (this.canvasElement) {
            this.canvasElement.style.opacity = finalOpacity;
            this.canvasElement.style.filter = `brightness(${brightness})`;
        }
        if (this.videoElement) {
            this.videoElement.style.opacity = finalOpacity;
            this.videoElement.style.filter = `brightness(${brightness})`;
        }

        // Update slider UI if not updated by valid event
        const slider = document.getElementById("opacitySlider");
        if (slider && slider.value != value) {
            slider.value = value;
        }
    }
}
