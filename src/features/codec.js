/**
 * src/features/codec.js
 * Blocks specific codecs to force YouTube into hardware-friendly fallbacks.
 * Overrides 3 APIs used by YouTube for codec negotiation (incl. SABR):
 *   1. HTMLMediaElement.canPlayType()
 *   2. MediaSource.isTypeSupported()
 *   3. MediaCapabilities.decodingInfo()
 */
(function () {
    'use strict';
    
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const blockAv1    = localStorage['ytl-block_av1']  === 'true';
    const blockVp9    = localStorage['ytl-block_vp9']  === 'true';
    const blockH264   = localStorage['ytl-block_h264'] === 'true';
    const blockOpus   = localStorage['ytl-block_opus'] === 'true';
    const block60fps  = localStorage['ytl-block_60fps'] !== 'false';

    if (!blockAv1 && !blockVp9 && !blockH264 && !blockOpus && !block60fps) return;

    function isBlocked(type) {
        if (!type) return false;
        const t = type.toLowerCase();
        
        // CRITICAL FIX: Never block DRM/widevine checks
        if (t.includes('drm') || t.includes('enc') || t.includes('widevine') || t.includes('cenc')) {
            return false;
        }

        // Explicit logic for Audio Codecs
        if (t.includes('opus')) return blockOpus;
        
        // Let generic audio (mp4a/aac) pass unless user somehow forced block all
        if (t.startsWith('audio') || t.includes('audio/')) {
            if (t.includes('opus')) return blockOpus;
            return false;
        }

        // Video Codecs
        if (blockAv1 && (t.includes('av01') || t.includes('av99'))) return true;
        if (blockVp9 && (t.includes('vp9') || t.includes('vp09') || t.includes('webm'))) return true;
        if (blockH264 && (t.includes('avc') || t.includes('mp4v') || t.includes('h264'))) return true;

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
