/**
 * Study Timer Module
 * Tracks total study time and persists it to storage.
 */

import { STORAGE_KEYS } from "./storage-manager.js";

export class ExerciseTimer {
  constructor(storage) {
    this.storage = storage;
    this.totalSeconds = 0;
    this.timerInterval = null;
    this.timerElement = document.getElementById("exerciseTimer");
  }

  init() {
    // Load saved time
    const savedTime = this.storage.get(STORAGE_KEYS.EXERCISE_TIME);
    if (savedTime) {
      this.totalSeconds = parseInt(savedTime, 10);
      if (isNaN(this.totalSeconds)) this.totalSeconds = 0;
    }

    this._updateDisplay();
    this._setupResetListener();
  }

  start() {
    if (this.timerInterval) return; // Already running

    this.timerInterval = setInterval(() => {
      this.totalSeconds++;
      this._updateDisplay();

      // Save every 10 seconds to avoid excessive writes
      if (this.totalSeconds % 10 === 0) {
        this.storage.set(STORAGE_KEYS.EXERCISE_TIME, this.totalSeconds);
      }
    }, 1000);
  }

  stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      // Save immediately on stop
      this.storage.set(STORAGE_KEYS.EXERCISE_TIME, this.totalSeconds);
    }
  }

  reset() {
    this.totalSeconds = 0;
    this.storage.set(STORAGE_KEYS.EXERCISE_TIME, 0);
    this._updateDisplay();
  }

  _updateDisplay() {
    if (!this.timerElement) return;

    const h = Math.floor(this.totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((this.totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (this.totalSeconds % 60).toString().padStart(2, "0");

    this.timerElement.textContent = `${h}:${m}:${s}`;
  }

  _setupResetListener() {
    if (!this.timerElement) return;

    // Prevent adding multiple listeners if init is called multiple times
    if (this.timerElement.dataset.listenerAdded) return;

    this.timerElement.style.cursor = "pointer";
    this.timerElement.title = "Click to reset study timer";

    this.timerElement.addEventListener("click", () => {
      const lang = window.ui?.currentLang || 'ko';
      const t = window.ui?.i18nManager?.translations?.[lang] || {};
      const confirmMsg = t.timer_reset_confirm || "Do you want to reset the study time to 0?";
      if (confirm(confirmMsg)) {
        this.reset();
      }
    });

    this.timerElement.dataset.listenerAdded = "true";
  }
}
