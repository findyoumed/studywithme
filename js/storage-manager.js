/**
 * Storage Manager
 * Handles all LocalStorage operations with robust error handling.
 */

export const STORAGE_KEYS = {
    PLAYLIST: "playlist",
    LAYOUT_MODE: "layoutMode",
    OPACITY: "cameraBrightness",
    LAST_INDEX: "lastVideoIndex",
    LAST_TIME: "lastVideoTime",
    EXERCISE_TIME: "totalExerciseTime",
    SENSITIVITY: "motionSensitivity",
    YOUTUBE_FLIP: "isYoutubeFlipped",
    CAMERA_FLIP: "isCameraFlipped"
};

export class StorageManager {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        try {
            const test = "__storage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn("StorageManager: LocalStorage is not available.", e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            console.error(`StorageManager: Failed to get key "${key}"`, e);
            return defaultValue;
        }
    }

    set(key, value) {
        if (!this.isAvailable) return;
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`StorageManager: Failed to set key "${key}"`, e);
        }
    }

    remove(key) {
        if (!this.isAvailable) return;
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`StorageManager: Failed to remove key "${key}"`, e);
        }
    }

    // Helper: Parse JSON safely
    getJSON(key, defaultValue = []) {
        const raw = this.get(key);
        if (!raw) return defaultValue;
        try {
            const parsed = JSON.parse(raw);
            // Additional check for null (JSON.parse("null") returns null)
            return parsed !== null ? parsed : defaultValue;
        } catch (e) {
            console.error(`StorageManager: Failed to parse JSON for key "${key}". Data might be corrupted.`, e);
            // If data is corrupted, we might want to clear it to prevent repeated errors
            // but for now, just returning default is safer.
            return defaultValue;
        }
    }
}

export const storage = new StorageManager();
