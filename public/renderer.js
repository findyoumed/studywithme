export class Renderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext("2d");
        this.prevLandmarks = [];
        this.poseConnections = null;
        this._ensurePoseConnections();
    }

    resize(width, height) {
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(landmarks) {
        // Frame skipping for less busy visual update (e.g. update visual every 2nd or 3rd frame)
        // Note: For smoothness, high FPS is good, but for "less distracting", maybe smoother is better?
        // Let's rely on heavy smoothing instead of frame dropping.
        const smoothed = this._smoothLandmarks(landmarks);
        this._drawConnections(smoothed);
        this._drawLandmarks(smoothed);
    }
    
    _drawConnections(landmarks) {
        if (!this.poseConnections) return;

        this.ctx.save();
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        // Soft Pink tint for connections, lower opacity
        this.ctx.strokeStyle = "rgba(255, 182, 193, 0.4)"; 
        this.ctx.lineWidth = 2; // Thinner lines

        for (const connection of this.poseConnections) {
            const start = landmarks[connection.start];
            const end = landmarks[connection.end];

            if (!start || start.visibility < 0.5 || !end || end.visibility < 0.5) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
            this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    _drawLandmarks(landmarks) {
        this.ctx.save();
        for (const landmark of landmarks) {
            if (landmark.visibility < 0.5) continue;

            const cx = landmark.x * this.canvas.width;
            const cy = landmark.y * this.canvas.height;

            // Outer circle - Soft Pink
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 3, 0, 2 * Math.PI); // Smaller radius (4 -> 3)
            this.ctx.fillStyle = "rgba(255, 105, 180, 0.6)"; // HotPink with transparency
            this.ctx.fill();

            // Inner dot - White
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 1.5, 0, 2 * Math.PI); // Smaller inner dot
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    _smoothLandmarks(newLandmarks) {
        // Simple smoothing
        if (!this.prevLandmarks || this.prevLandmarks.length === 0) {
            this.prevLandmarks = newLandmarks;
            return newLandmarks;
        }

        const smoothed = newLandmarks.map((point, i) => {
            const prev = this.prevLandmarks[i];
            if (!prev) return point;

            // Balance: 0.6 provides fast tracking without excessive jitter
            const alpha = 0.6; 
            return {
                x: prev.x * (1 - alpha) + point.x * alpha,
                y: prev.y * (1 - alpha) + point.y * alpha,
                z: prev.z * (1 - alpha) + point.z * alpha,
                visibility: point.visibility
            };
        });

        this.prevLandmarks = smoothed;
        return smoothed;
    }

    _ensurePoseConnections() {
        import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0")
            .then((module) => {
                this.poseConnections = module.PoseLandmarker?.POSE_CONNECTIONS || null;
            })
            .catch(e => console.error("Failed to load POSE_CONNECTIONS", e));
    }
}
// Force Update Trigger
