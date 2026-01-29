
export class ScoreUIManager {
    constructor(achievementManager) {
        this.scoreValueElement = document.getElementById("scoreValue");
        this.medalElement = document.getElementById("scoreMedal");
        this.achievementManager = achievementManager;
    }

    update(score) {
        const totalSeconds = Math.floor(score);
        const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
        const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");

        if (this.scoreValueElement) {
            this.scoreValueElement.textContent = `SCORE: ${hrs}:${mins}:${secs}`;
        }

        if (this.medalElement) {
            const currentMedal = this.achievementManager.getMedalForScore(score);
            if (this.medalElement.textContent !== currentMedal) {
                this.medalElement.textContent = currentMedal;
                this.medalElement.title = this.achievementManager.getMedalName(score);
                this.medalElement.style.transform = "scale(1.3)";
                setTimeout(() => {
                    this.medalElement.style.transform = "scale(1)";
                }, 300);
            }
        }
    }

    reset() {
        if (this.scoreValueElement) {
            this.scoreValueElement.textContent = "SCORE: 00:00:00";
        }
        if (this.medalElement) {
            this.medalElement.textContent = "🥉";
            if (this.achievementManager) {
                 this.medalElement.title = this.achievementManager.getMedalName(0);
            }
        }
    }
}
