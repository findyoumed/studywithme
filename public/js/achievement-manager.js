/**
 * Achievement Manager
 * Handles the logic for determining medals and rank names based on score.
 */
export class AchievementManager {
    getMedalForScore(score) {
        const s = Math.floor(score);

        // High-Hour Tiers (11h-24h)
        if (s >= 86400) return "🌍"; // 24h: Earth Conqueror
        if (s >= 82800) return "🌈"; // 23h: Seven-Colored Dream
        if (s >= 79200) return "❤️‍🔥"; // 22h: Single-Minded Devotion
        if (s >= 75600) return "💖"; // 21h: Resonance of Love
        if (s >= 72000) return "💓"; // 20h: Beating Heart
        if (s >= 68400) return "💞"; // 19h: Warm Eternity
        if (s >= 64800) return "💗"; // 18h: Pink Flutter
        if (s >= 61200) return "💜"; // 17h: Purple Scent
        if (s >= 57600) return "💙"; // 16h: Blue Heart
        if (s >= 54000) return "🩵"; // 15h: Sky's Wish
        if (s >= 50400) return "💚"; // 14h: Green Peace
        if (s >= 46800) return "💛"; // 13h: Golden Training
        if (s >= 43200) return "🧡"; // 12h: Orange Enthusiasm
        if (s >= 39600) return "❤️"; // 11h: Red Passion

        // Mid-Hour Tiers (1h-10h)
        if (s >= 35400) return "👑"; // 10h-ish: Legendary Crown
        if (s >= 34800) return "🎖️"; // ...
        if (s >= 34200) return "🎯";
        if (s >= 33600) return "⚔️";
        if (s >= 33000) return "💎";
        if (s >= 32400) return "🌃";
        if (s >= 31800) return "🌌";
        if (s >= 31200) return "🌠";
        if (s >= 30600) return "☄️";
        if (s >= 30000) return "🛰️";
        if (s >= 29400) return "🛸";
        if (s >= 28800) return "✨";
        if (s >= 28200) return "🔮";
        if (s >= 27600) return "👁️";
        if (s >= 27000) return "⏳";
        if (s >= 26400) return "⚱️";
        if (s >= 25800) return "🌬️";
        if (s >= 25200) return "🌟";
        if (s >= 24600) return "📜";
        if (s >= 24000) return "💰";
        if (s >= 23400) return "🤑";
        if (s >= 22800) return "🍀";
        if (s >= 22200) return "🔥";
        if (s >= 21600) return "⚡";
        if (s >= 21000) return "💥";
        if (s >= 20400) return "💫";
        if (s >= 19800) return "🚀";
        if (s >= 19200) return "💯";
        if (s >= 18600) return "🧑‍🏫";
        if (s >= 18000) return "🏆"; // 5h: Top Immersion
        if (s >= 17400) return "🧗";
        if (s >= 16800) return "🦅";
        if (s >= 16200) return "🔥";
        if (s >= 15600) return "🌬️";
        if (s >= 15000) return "☁️";
        if (s >= 14400) return "🧑‍🎓";
        if (s >= 13800) return "👻";
        if (s >= 13200) return "💪";
        if (s >= 12600) return "🥇";
        if (s >= 12000) return "🏅";
        if (s >= 11400) return "🕊️";
        if (s >= 10800) return "🧐"; // 3h: Knowledge Seeker
        if (s >= 10200) return "🗿";
        if (s >= 9600) return "💪";
        if (s >= 9000) return "☕";
        if (s >= 8400) return "🌿";
        if (s >= 7800) return "🌱";
        if (s >= 7200) return "🧱";
        if (s >= 6600) return "🏃";
        if (s >= 6000) return "✈️";
        if (s >= 5400) return "🚶";
        if (s >= 4800) return "🏄";
        if (s >= 4200) return "🌊";
        if (s >= 3600) return "🧘"; // 1h: Study Challenger
        if (s >= 3000) return "🧘";
        if (s >= 2400) return "🦢";

        // Low-Hour Tiers (0-30m)
        if (s >= 1800) return "🐥"; // 30m: First Steps
        if (s >= 1200) return "🐣"; // 20m: Peeking Out
        if (s >= 600) return "🥚";  // 10m: Dreaming Egg

        return "🥉"; // Initial (0-10m)
    }

    getMedalName(score) {
        const s = Math.floor(score);
        let key = "ach_0";

        // High-Hour Tiers (11h-24h)
        if (s >= 86400) key = "ach_86400";
        else if (s >= 82800) key = "ach_82800";
        else if (s >= 79200) key = "ach_79200";
        else if (s >= 75600) key = "ach_75600";
        else if (s >= 72000) key = "ach_72000";
        else if (s >= 68400) key = "ach_68400";
        else if (s >= 64800) key = "ach_64800";
        else if (s >= 61200) key = "ach_61200";
        else if (s >= 57600) key = "ach_57600";
        else if (s >= 54000) key = "ach_54000";
        else if (s >= 50400) key = "ach_50400";
        else if (s >= 46800) key = "ach_46800";
        else if (s >= 43200) key = "ach_43200";
        else if (s >= 39600) key = "ach_39600";
        // Mid-Hour Tiers (1h-10h)
        else if (s >= 35400) key = "ach_35400";
        else if (s >= 34800) key = "ach_34800";
        else if (s >= 34200) key = "ach_34200";
        else if (s >= 33600) key = "ach_33600";
        else if (s >= 33000) key = "ach_33000";
        else if (s >= 32400) key = "ach_32400";
        else if (s >= 31800) key = "ach_31800";
        else if (s >= 31200) key = "ach_31200";
        else if (s >= 30600) key = "ach_30600";
        else if (s >= 30000) key = "ach_30000";
        else if (s >= 29400) key = "ach_29400";
        else if (s >= 28800) key = "ach_28800";
        else if (s >= 28200) key = "ach_28200";
        else if (s >= 27600) key = "ach_27600";
        else if (s >= 27000) key = "ach_27000";
        else if (s >= 26400) key = "ach_26400";
        else if (s >= 25800) key = "ach_25800";
        else if (s >= 25200) key = "ach_25200";
        else if (s >= 24600) key = "ach_24600";
        else if (s >= 24000) key = "ach_24000";
        else if (s >= 23400) key = "ach_23400";
        else if (s >= 22800) key = "ach_22800";
        else if (s >= 22200) key = "ach_22200";
        else if (s >= 21600) key = "ach_21600";
        else if (s >= 21000) key = "ach_21000";
        else if (s >= 20400) key = "ach_20400";
        else if (s >= 19800) key = "ach_19800";
        else if (s >= 19200) key = "ach_19200";
        else if (s >= 18600) key = "ach_18600";
        else if (s >= 18000) key = "ach_18000";
        else if (s >= 17400) key = "ach_17400";
        else if (s >= 16800) key = "ach_16800";
        else if (s >= 16200) key = "ach_16200";
        else if (s >= 15600) key = "ach_15600";
        else if (s >= 15000) key = "ach_15000";
        else if (s >= 14400) key = "ach_14400";
        else if (s >= 13800) key = "ach_13800";
        else if (s >= 13200) key = "ach_13200";
        else if (s >= 12600) key = "ach_12600";
        else if (s >= 12000) key = "ach_12000";
        else if (s >= 11400) key = "ach_11400";
        else if (s >= 10800) key = "ach_10800";
        else if (s >= 10200) key = "ach_10200";
        else if (s >= 9600) key = "ach_9600";
        else if (s >= 9000) key = "ach_9000";
        else if (s >= 8400) key = "ach_8400";
        else if (s >= 7800) key = "ach_7800";
        else if (s >= 7200) key = "ach_7200";
        else if (s >= 6600) key = "ach_6600";
        else if (s >= 6000) key = "ach_6000";
        else if (s >= 5400) key = "ach_5400";
        else if (s >= 4800) key = "ach_4800";
        else if (s >= 4200) key = "ach_4200";
        else if (s >= 3600) key = "ach_3600";
        else if (s >= 3000) key = "ach_3000";
        else if (s >= 2400) key = "ach_2400";
        // Low-Hour Tiers (0-30m)
        else if (s >= 1800) key = "ach_1800";
        else if (s >= 1200) key = "ach_1200";
        else if (s >= 600) key = "ach_600";

        return key;
    }
}
