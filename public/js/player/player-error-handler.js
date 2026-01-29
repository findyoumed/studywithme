
export const isCriticalError = (code) => code === 150 || code === 101;

export const showPlayerError = (ui, key, defaultMsg) => {
      const t = ui && ui.i18nManager && ui.i18nManager.translations && ui.i18nManager.translations[ui.currentLang]
        ? ui.i18nManager.translations[ui.currentLang]
        : null;
      const msg = t && t[key] ? t[key] : defaultMsg;
      ui.showSplash(msg);
      return msg; // Return message for other uses
};
