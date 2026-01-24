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
        const smoothed = this._smoothLandmarks(landmarks);
        this._drawConnections(smoothed);
        this._drawLandmarks(smoothed);
    }

    _drawConnections(landmarks) {
        if (!this.poseConnections) return;

        this.ctx.save();
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        this.ctx.lineWidth = 3;

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

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#FF0000";
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#FFFFFF";
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

            const alpha = 0.5; // Smoothing factor
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
