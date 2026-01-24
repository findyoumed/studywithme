/**
 * MediaPipe Pose Landmarker initialization and execution.
 */
export class PoseDetector {
    constructor() {
        this.poseLandmarker = undefined;
        this.runningMode = "VIDEO";
    }

    async initialize() {
        try {
            const initPromise = (async () => {
                const visionModule = await import(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"
                );
                const { PoseLandmarker, FilesetResolver } = visionModule;
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                        delegate: "GPU",
                    },
                    runningMode: this.runningMode,
                    numPoses: 1,
                });
                return true;
            })();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("PoseDetector initialization timed out")), 15000)
            );

            return await Promise.race([initPromise, timeoutPromise]);
        } catch (e) {
            console.error("PoseDetector init failed:", e);
            return false;
        }
    }

    detect(videoElement, timeMs, callback) {
        if (!this.poseLandmarker) return;

        const result = this.poseLandmarker.detectForVideo(videoElement, timeMs);
        if (typeof callback === "function") {
            callback(result);
        }
    }
}
// Force Update Trigger
