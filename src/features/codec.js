/**
 * src/features/codec.js
 * Blocks AV1/VP9/WebM → YouTube falls back to H264/AAC.
 * Overrides 3 APIs used by YouTube for codec negotiation (incl. SABR):
 *   1. HTMLMediaElement.canPlayType()
 *   2. MediaSource.isTypeSupported()
 *   3. MediaCapabilities.decodingInfo()
 * Ref: developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
 * Based on h264ify (MIT — erkserkserks/alextrv).
 */
(function () {
    'use strict';
    
    // Prevent execution in sandboxed iframes or about:blank to avoid Console errors
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const blockCodecs = localStorage['ytl-block_codecs'] !== 'false';
    const block60fps  = localStorage['ytl-block_60fps']  !== 'false';
    const blockOpus   = localStorage['ytl-block_opus']   === 'true';

    if (!blockCodecs && !block60fps && !blockOpus) return;

    const BLOCKED = [];
    if (blockCodecs) BLOCKED.push('vp9', 'vp09', 'av01', 'av99', 'webm');
    if (blockOpus)   BLOCKED.push('opus');

    function isBlocked(type) {
        if (!type) return false;
        const t = type.toLowerCase();
        
        // CRITICAL FIX: Never block DRM/widevine checks
        if (t.includes('drm') || t.includes('enc') || t.includes('widevine') || t.includes('cenc')) {
            return false;
        }

        // Explicit logic for Opus audio blocking
        if (t.includes('opus')) {
            // Only block Opus if the toggle is explicitly ON
            return blockOpus; 
        }

        // If it's a generic audio stream (like mp4a, aac) and it's not Opus, NEVER block it
        if (t.startsWith('audio') || t.includes('audio/')) {
            return false;
        }

        // If it's a video stream (or generic codec string), block the heavy video codecs
        if (blockCodecs && ['vp9', 'vp09', 'av01', 'av99', 'webm'].some(b => t.includes(b))) {
            return true;
        }

        // 60fps blocker
        if (block60fps) {
            const m = /framerate=(\d+)/.exec(t);
            if (m && parseInt(m[1], 10) > 30) return true;
        }

        return false;
    }

    function makeChecker(orig) {
        return function (type) {
            if (isBlocked(type)) return '';
            return orig.call(this, type);
        };
    }

    // 1. canPlayType
    HTMLMediaElement.prototype.canPlayType = makeChecker(HTMLMediaElement.prototype.canPlayType);

    // 2. MediaSource.isTypeSupported
    if (window.MediaSource) {
        MediaSource.isTypeSupported = makeChecker(MediaSource.isTypeSupported.bind(MediaSource));
    }

    // 3. MediaCapabilities.decodingInfo (used by YouTube SABR for format negotiation)
    if (navigator.mediaCapabilities) {
        const origDecode = navigator.mediaCapabilities.decodingInfo.bind(navigator.mediaCapabilities);
        navigator.mediaCapabilities.decodingInfo = function (config) {
            const type = (config?.video?.contentType || '') + (config?.audio?.contentType || '');
            if (isBlocked(type)) {
                return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
            }
            return origDecode(config);
        };
    }

})();
