/**
 * Viewer Score Display
 * Displays host score on viewer screen using HTTP polling
 * [LOG: 20260130_1031]
 */

// [LOG: 20260130_1031] Get room ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || 'default';

// [LOG: 20260130_1031] Poll score every 3 seconds
setInterval(async () => {
    try {
        const res = await fetch(`/api/room/${roomId}/score`);
        const data = await res.json();

        if (data.score > 0) {
            updateViewerScore(data.score);
        }
    } catch (e) {
        // Silent fail
    }
}, 3000);

// [LOG: 20260130_1031] Global handler for score updates
window.updateViewerScore = function (score) {
    const display = document.getElementById('hostScoreDisplay');
    const medal = document.getElementById('hostScoreMedal');
    const value = document.getElementById('hostScoreValue');

    if (!display || !medal || !value) return;

    // Format time
    const totalSeconds = Math.floor(score);
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');

    // Determine medal
    let medalEmoji = '🥉'; // Bronze
    if (score >= 7200) medalEmoji = '🏆'; // Trophy (2h)
    else if (score >= 5400) medalEmoji = '🥇'; // Gold (1.5h)
    else if (score >= 3600) medalEmoji = '🥈'; // Silver (1h)

    // Update UI
    display.style.display = 'flex';
    medal.textContent = medalEmoji;
    value.textContent = `${hrs}:${mins}:${secs}`;

    console.log('[ViewerScore] Updated:', `${hrs}:${mins}:${secs}`, medalEmoji);
};
