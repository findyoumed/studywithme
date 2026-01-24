import { translations } from "./i18n-data.js";

export class I18nManager {
    constructor() {
        this.translations = translations;

        let lang = "ko";
        try {
            lang = localStorage.getItem("studywithme_lang") || "ko";
        } catch (e) {
            console.warn("I18nManager: localStorage unavailable", e);
        }

        const normalizedLang = this._normalizeLanguage(lang);
        const resolvedLang = this._resolveLanguage(normalizedLang);
        this.currentLang = resolvedLang;
        this._persistLanguage(lang, resolvedLang);
        this.init();
    }

    init() {
        // Set initial language on document
        document.documentElement.lang = this.currentLang;
    }

    setLanguage(lang) {
        const normalizedLang = this._normalizeLanguage(lang);
        if (!normalizedLang || !this.translations[normalizedLang]) {
            console.warn(`Language ${lang} not supported.`);
            return false;
        }

        this.currentLang = normalizedLang;
        try {
            localStorage.setItem("studywithme_lang", normalizedLang);
        } catch (e) {
            console.warn("I18nManager: Failed to persist language", e);
        }
        document.documentElement.lang = normalizedLang;
        this.updatePage();
        return true;
    }

    getTranslation(key) {
        const t = this._getTranslationsFor(this.currentLang);
        return t[key] || key;
    }

    updatePage() {
        const t = this._getTranslationsFor(this.currentLang);

        // Update elements with data-i18n
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) el.textContent = t[key];
        });

        // Update titles
        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            const key = el.dataset.i18nTitle;
            if (t[key]) el.title = t[key];
        });

        // Update aria-labels
        document.querySelectorAll("[data-i18n-label]").forEach(el => {
            const key = el.dataset.i18nLabel;
            if (t[key]) el.setAttribute("aria-label", t[key]);
        });

        // Update placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key]) el.placeholder = t[key];
        });

        // Special handling for specific elements
        this.updateSpecificElements(t);

        // Update toggle buttons state
        this.updateToggleButtons();
    }

    _normalizeLanguage(lang) {
        if (typeof lang !== "string") return null;
        const trimmed = lang.trim().toLowerCase();
        if (!trimmed) return null;
        return trimmed.split(/[-_]/)[0];
    }

    _resolveLanguage(lang) {
        if (lang && this.translations[lang]) return lang;
        return this._getFallbackLanguage();
    }

    _getFallbackLanguage() {
        if (this.translations.ko) return "ko";
        if (this.translations.en) return "en";
        const keys = Object.keys(this.translations || {});
        return keys.length > 0 ? keys[0] : "ko";
    }

    _getTranslationsFor(lang) {
        const normalizedLang = this._normalizeLanguage(lang);
        if (normalizedLang && this.translations[normalizedLang]) {
            return this.translations[normalizedLang];
        }
        const fallbackLang = this._getFallbackLanguage();
        return this.translations[fallbackLang] || {};
    }

    _persistLanguage(originalLang, resolvedLang) {
        if (!resolvedLang || originalLang === resolvedLang) return;
        try {
            localStorage.setItem("studywithme_lang", resolvedLang);
        } catch (e) {
            console.warn("I18nManager: Failed to persist language", e);
        }
    }

    updateSpecificElements(t) {
        // Score reconstruction logic removed as it conflicts with HH:MM:SS format
        // and is now handled by MotionManager.
        
        // Camera placeholder
        const placeholderEl = document.getElementById("placeholder");
        if (placeholderEl) {
            placeholderEl.textContent = t.camera_connecting;
        }
    }

    updateToggleButtons() {
        const koBtn = document.getElementById("langKoBtn");
        const enBtn = document.getElementById("langEnBtn");

        if (koBtn && enBtn) {
            if (this.currentLang === "ko") {
                koBtn.classList.add("active");
                koBtn.style.color = "white";
                enBtn.classList.remove("active");
                enBtn.style.color = "#666";
            } else {
                enBtn.classList.add("active");
                enBtn.style.color = "white";
                koBtn.classList.remove("active");
                koBtn.style.color = "#666";
            }
        }

        // Also update Intro Modal buttons if they exist
        const introKoBtn = document.querySelector('.intro-modal-card .lang-btn[data-lang="ko"]');
        const introEnBtn = document.querySelector('.intro-modal-card .lang-btn[data-lang="en"]');
        if (introKoBtn && introEnBtn) {
            if (this.currentLang === "ko") {
                introKoBtn.classList.add("active");
                introEnBtn.classList.remove("active");
            } else {
                introEnBtn.classList.add("active");
                introKoBtn.classList.remove("active");
            }
        }
    }
}
