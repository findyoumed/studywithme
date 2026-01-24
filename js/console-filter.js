/**
 * Console Filter - Hide Third-Party Library Noise
 * Prevents development stack exposure by filtering out:
 * - YouTube embed errors (ads, analytics, tracking)
 * - Browser performance warnings
 * - MediaPipe/WASM internal logs
 */
export function initConsoleFilter() {
    // Filter console.error (YouTube network errors)
    const originalError = console.error;
    console.error = function (...args) {
        const errorMsg = args.join(' ');

        const noisePatterns = [
            'ERR_BLOCKED_BY_CLIENT',
            'doubleclick.net',
            'googlesyndication',
            'googleads',
            'youtube.com/youtubei/v1/log_event',
            'youtube.com/generate_204',
            'cast_sender.js',
            'ad_status.js'
        ];

        if (noisePatterns.some(pattern => errorMsg.includes(pattern))) {
            return; // Suppress
        }

        originalError.apply(console, args);
    };

    // Filter console.warn (Browser violations)
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const warnMsg = args.join(' ');

        if (warnMsg.includes('Violation') ||
            warnMsg.includes('passive event listener')) {
            return; // Suppress performance warnings
        }

        originalWarn.apply(console, args);
    };

    // Filter console.log (MediaPipe WASM logs)
    const originalLog = console.log;
    console.log = function (...args) {
        const logMsg = args.join(' ');

        // MediaPipe internal logs (I0000, W0000 format)
        if (logMsg.includes('I0000') ||
            logMsg.includes('W0000') ||
            logMsg.includes('vision_wasm_internal') ||
            logMsg.includes('gl_context') ||
            logMsg.includes('Graph successfully started')) {
            return; // Suppress MediaPipe logs
        }

        originalLog.apply(console, args);
    };
}
