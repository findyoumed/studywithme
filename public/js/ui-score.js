/**
 * UI Score Module
 * Handles interaction with the Score element (click to share)
 */

export function bindScoreAPI(motionManager, ui) {
    // Bind Score Click Event
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
        scoreElement.style.cursor = "pointer";
        try {
            const t =
                ui && ui.i18nManager
                    ? ui.i18nManager.translations[ui.currentLang]
                    : null;
            scoreElement.title =
                t && t.share_score_title ? t.share_score_title : "Click to share score";
        } catch (_) {
            scoreElement.title = "Click to share score";
        }
        scoreElement.onclick = () => {
            try {
                const t =
                    ui && ui.i18nManager
                        ? ui.i18nManager.translations[ui.currentLang]
                        : null;
                ui.showSplash(
                    t && t.share_generating
                        ? t.share_generating
                        : "Generating score image... 📸",
                );
            } catch (_) {
                ui.showSplash("Generating score image... 📸");
            }
            // Small delay to allow splash to render before heavy canvas work
            setTimeout(() => {
                const score = motionManager ? motionManager.getScore() : 0;
                const timerEl = document.getElementById("exerciseTimer");
                const time = timerEl ? timerEl.textContent : "";
                if (window.shareScore) {
                    window.shareScore.shareScore(score, time);
                } else {
                    console.error("ShareScore instance not found");
                    try {
                        const t =
                            ui && ui.i18nManager
                                ? ui.i18nManager.translations[ui.currentLang]
                                : null;
                        ui.showSplash(
                            t && t.share_error
                                ? t.share_error
                                : "Error: Share feature not ready",
                        );
                    } catch (_) {
                        ui.showSplash("Error: Share feature not ready");
                    }
                }
            }, 50);
        };
    }
}
