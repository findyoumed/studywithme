/**
 * Score Sharing Module
 * Generates shareable images with score using Canvas API
 */

export class ShareScore {
  constructor(ui) {
    this.ui = ui;
  }

  /**
   * Generate score image and copy to clipboard or download
   */
  /**
   * Generate score image and copy to clipboard or download
   */
  async generateScoreImage(score, time, medal = "🥉", medalName = "Novice Focus") {
    // Trigger PMF Survey immediately
    if (window.pmfManager) {
      window.pmfManager.tryOpenAuto();
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630; // OG Image size
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, "#0a0e27");
    gradient.addColorStop(1, "#1a1f3a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    const t =
      this.ui && this.ui.i18nManager
        ? this.ui.i18nManager.translations[this.ui.currentLang]
        : {};

    // Title
    ctx.fillStyle = "#f4eee2";
    ctx.font = "bold 48px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.share_title || "StudyWithMe - AI Study Coach", 600, 100);

    // Score (Format as HH:MM:SS)
    const totalSeconds = Math.floor(score);
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    const formattedScore = `${hrs}:${mins}:${secs}`;

    // Layout calculation for Medal + Score
    ctx.font = "bold 120px Inter, sans-serif";
    const scoreWidth = ctx.measureText(formattedScore).width;
    const medalSize = 100;
    const gap = 30;
    const totalWidth = medalSize + gap + scoreWidth;
    const startX = (1200 - totalWidth) / 2;

    // Draw Medal
    ctx.font = `${medalSize}px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(medal, startX, 280);

    // Draw Score
    ctx.fillStyle = "#FDB927";
    ctx.font = "bold 120px Inter, sans-serif";
    ctx.fillText(formattedScore, startX + medalSize + gap, 280);

    // Draw Medal Name (Meaning)
    if (medalName && medalName.trim() !== "") {
      ctx.textAlign = "center";
      ctx.fillStyle = "#FDB927";
      ctx.font = "italic 42px Inter, sans-serif";
      ctx.fillText(`"${medalName}"`, 600, 340);
      
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "36px Inter, sans-serif";
      ctx.fillText(t.score || "SCORE", 600, 390);
    } else {
      // If no name, center the SCORE label a bit higher
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "36px Inter, sans-serif";
      ctx.fillText(t.score || "SCORE", 600, 360);
    }

    // Time
    if (time) {
      ctx.fillStyle = "#aaa";
      ctx.font = "28px Inter, sans-serif";
      ctx.fillText(`${t.share_time || "Time"}: ${time}`, 600, 440);
    }

    // Call to action
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillText(t.share_cta || "Can you beat my score?", 600, 500);

    // Site Title
    ctx.fillStyle = "#f4eee2";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText("StudyWithMe - AI Study Coach", 600, 540);

    // Watermark
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "24px Inter, sans-serif";
    ctx.fillText(t.share_watermark || "Made with StudyWithMe", 600, 590);

    return canvas;
  }

  async shareScore(score, time, medal, medalName, allowDownload = true) {
    const canvas = await this.generateScoreImage(score, time, medal, medalName);

    // Try to copy image to clipboard (modern browsers)
    if (navigator.clipboard && canvas.toBlob) {
      try {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        const t =
          this.ui && this.ui.i18nManager
            ? this.ui.i18nManager.translations[this.ui.currentLang]
            : {};
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        this.ui.showSplash(
          t.score_copied || "Score image copied to clipboard! 📋",
        );
        return true; // SUCCESS - Done
      } catch (err) {
        console.warn("Clipboard write failed", err);
        // Fallback to download below if allowed
      }
    }

    // Fallback or explicitly allowed download
    if (allowDownload) {
      this.downloadImage(canvas, score);
    }
    return true;
  }

  downloadImage(canvas, score) {
    const t =
      this.ui && this.ui.i18nManager
        ? this.ui.i18nManager.translations[this.ui.currentLang]
        : {};
    const link = document.createElement("a");
    link.download = `studywithme-score-${score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    this.ui.showSplash(t.score_downloaded || "Score image downloaded! 📥");
  }
}
