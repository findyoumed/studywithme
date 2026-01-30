

export class ScoreUIManager {
    constructor(achievementManager) {
        this.achievementManager = achievementManager;
        // Don't cache elements - they will be looked up dynamically
    }

    update(score) {
        // Lazy-load elements each time (handles dynamic HTML loading)
        const scoreValueElement = document.getElementById("scoreValue");
        const medalElement = document.getElementById("scoreMedal");

        const totalSeconds = Math.floor(score);
        const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
        const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");

        if (scoreValueElement) {
            scoreValueElement.textContent = `SCORE: ${hrs}:${mins}:${secs}`;
        }

        if (medalElement) {
            const currentMedal = this.achievementManager.getMedalForScore(score);
            if (medalElement.textContent !== currentMedal) {
                medalElement.textContent = currentMedal;
                medalElement.title = this.achievementManager.getMedalName(score);
                medalElement.style.transform = "scale(1.3)";
                setTimeout(() => {
                    medalElement.style.transform = "scale(1)";
                }, 300);
            }
        }
    }

    reset() {
        const scoreValueElement = document.getElementById("scoreValue");
        const medalElement = document.getElementById("scoreMedal");

        if (scoreValueElement) {
            scoreValueElement.textContent = "SCORE: 00:00:00";
        }
        if (medalElement) {
            medalElement.textContent = "🥉";
            if (this.achievementManager) {
                medalElement.title = this.achievementManager.getMedalName(0);
            }
        }
    }
}
