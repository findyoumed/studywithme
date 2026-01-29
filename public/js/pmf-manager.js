/**
 * PMF Manager
 * Handles Product-Market Fit survey logic
 */
export class PMFManager {
    constructor(ui) {
        this.ui = ui;
        this.modalId = 'pmfModal';
        this.storageKey = 'studywithme_pmf_submitted_v2'; // v2 to force reset for beta users
    }

    /**
     * Try to open the survey automatically (e.g. after sharing score)
     * Respects the one-time submission policy.
     */
    async tryOpenAuto() {
        if (this._hasSubmitted()) {
            return;
        }

        // Delay slightly for better UX
        setTimeout(() => {
            this.open();
        }, 1500);
    }

    /**
     * Open the survey manually (e.g. from Info menu)
     * Always opens, even if already submitted.
     */
    async openManually() {
        await this.open();
    }

    async open() {
        await this._ensureModalLoaded();
        this.selectedScore = null; // Reset selection
        const modal = document.getElementById(this.modalId);
        if (modal) {
            // Refresh translations to ensure newly injected modal content is localized
            try {
                if (this.ui && this.ui.i18nManager) {
                    this.ui.i18nManager.updatePage();
                    // Fallback: if question is still empty, set it directly
                    const h3 = modal.querySelector('[data-i18n="pmf_question"]');
                    if (h3 && (!h3.textContent || h3.textContent.trim().length < 5)) { // Check for short/empty text
                        const t = this.ui.i18nManager._getTranslationsFor(this.ui.i18nManager.currentLang);
                        if (t && t.pmf_question) h3.textContent = t.pmf_question;
                    }
                }
            } catch (_) {
                console.error("Error during PMF translation refresh", _);
            }

            // Reset UI state
            document.querySelectorAll('.pmf-btn').forEach(btn => {
                btn.classList.remove('selected');
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            });
            const submitBtn = document.getElementById('pmfSubmitBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }

            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

            this._setupEscListener();
            this._logEvent('pmf_impressed');
        }
    }

    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        // Remove ESC listener
        if (this._escHandler) {
            window.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    }

    _setupEscListener() {
        if (this._escHandler) return;
        this._escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        window.addEventListener('keydown', this._escHandler);
    }

    selectScore(score) {
        this.selectedScore = score;

        // Update UI
        document.querySelectorAll('.pmf-btn').forEach(btn => {
            const isSelected = btn.getAttribute('onclick').includes(score);
            if (isSelected) {
                btn.classList.add('selected');
                btn.style.background = 'rgba(129, 140, 248, 0.2)'; // Highlight color
                btn.style.borderColor = '#818cf8';
            } else {
                btn.classList.remove('selected');
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            }
        });

        // Enable Submit Button
        const submitBtn = document.getElementById('pmfSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }

    submit(scoreArg = null) {
        try {
            // Priority: Argument > Selection > Null
            const score = scoreArg || this.selectedScore;
            const feedbackInput = document.getElementById('pmfFeedback');
            const feedback = feedbackInput?.value?.trim() || '';

            // Case 1: Close (No score, no text)
            if (!score && !feedback) {
                this.close();
                return;
            }

            // Case 2: Submit
            // Effective score is passed score (Emoji) or 'skipped' (Text only)
            const effectiveScore = score || 'skipped';

            // Log to GA
            this._logEvent('pmf_submitted', {
                'event_label': effectiveScore,
                'feedback_length': feedback.length,
                'has_text': !!feedback
            });

            // Save to LocalStorage
            this._setSubmitted(effectiveScore);

            // Show thanks (Splash)
            try {
                const lang = this.ui?.currentLang || 'ko';
                const t = this.ui?.i18nManager?.translations?.[lang] || {};

                if (this.ui && typeof this.ui.showSplash === 'function') {
                    this.ui.showSplash(t.survey_thanks || "Thank you for your feedback!");
                } else {
                    console.log("Survey submitted");
                }
            } catch (splashError) {
                console.warn("Splash error", splashError);
            }
        } catch (e) {
            console.error("Submit error", e);
        } finally {
            // Always close
            this.close();
        }
    }

    async _ensureModalLoaded() {
        const existing = document.getElementById(this.modalId);
        const needsReload = existing
            && (!existing.querySelector('[data-i18n="pmf_question"]')
                || !existing.querySelector(".pmf-close-btn"));
        if (existing && !needsReload) {
            // Even if exists, re-bind events to be safe
            this._bindGlobalEvents();
            return;
        }
        if (existing && needsReload) {
            existing.remove();
        }

        try {
            const cacheBust = `?v=${new Date().getTime()}`;
            const response = await fetch(`/components/pmf_modal.html${cacheBust}`, { cache: "no-store" });
            if (response.ok) {
                const html = await response.text();
                const container = document.getElementById('pmfModalContainer') || document.body;
                container.insertAdjacentHTML('beforeend', html);

                // Trigger translation update for the newly added modal
                if (this.ui && this.ui.i18nManager) {
                    this.ui.i18nManager.updatePage();
                }
            }
        } catch (e) {
            console.error("PMFManager: Failed to load modal component", e);
        }

        this._bindGlobalEvents();
    }

    _bindGlobalEvents() {
        // 1. Global Window Bindings (for HTML onclick)
        window.closePMFModal = () => this.close();
        window.selectPMFScore = (score) => this.selectScore(score);
        window.submitPMF = (score) => this.submit(score);

        // 2. Direct Element Bindings (More Robust)
        const submitBtn = document.getElementById('pmfSubmitBtn');
        if (submitBtn) {
            submitBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.submit();
            };
        }

        // 3. Close button binding (ensure it works even if globals are overridden)
        const closeBtn = document.querySelector(`#${this.modalId} .pmf-close-btn`);
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = 'true'; // Prevent re-binding
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        }
    }

    _hasSubmitted() {
        return localStorage.getItem(this.storageKey) === 'true';
    }

    _setSubmitted(score) {
        try {
            localStorage.setItem(this.storageKey, 'true');
            localStorage.setItem('studywithme_pmf_score', score);
        } catch (e) {
            console.warn("PMFManager: LocalStorage access failed", e);
        }
    }

    _logEvent(eventName, params = {}) {
        try {
            if (typeof gtag === 'function') {
                gtag('event', eventName, {
                    'event_category': 'survey',
                    ...params
                });
            }
        } catch (_) { }
    }
}
