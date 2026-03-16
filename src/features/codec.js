/**
 * src/features/codec.js
 * Blocks specific codecs based on settings in DOM attributes.
 */
(function () {
    'use strict';
    
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytb-' + k);

    function isBlocked(type) {
        if (!type) return false;
        const t = type.toLowerCase();
        
        const blockAv1  = getS('block_av1') === 'true';
        const blockVp9  = getS('block_vp9') === 'true';
        const blockH264 = getS('block_h264') === 'true';
        const blockOpus = getS('block_opus') === 'true';
        const maxFps    = getS('max_fps') || 'auto';

        if (t.includes('drm') || t.includes('enc') || t.includes('widevine') || t.includes('cenc')) return false;

        // Audio
        if (blockOpus && t.includes('opus')) return true;
        if (t.includes('audio/') || t.startsWith('audio')) {
            if (blockOpus && t.includes('opus')) return true;
            return false;
        }

        // Video
        if (blockAv1 && (t.includes('av01') || t.includes('av99'))) return true;
        if (blockVp9 && (t.includes('vp9') || t.includes('vp09') || t.includes('webm'))) return true;
        if (blockH264 && (t.includes('avc') || t.includes('mp4v') || t.includes('h264'))) return true;

        // FPS
        if (maxFps === '30') {
            const m = /framerate=(\d+)/.exec(t);
            if (m && parseInt(m[1], 10) > 30) return true;
        }

        return false;
    }

    const makeChecker = (orig) => function (type) {
        if (isBlocked(type)) return '';
        return orig.call(this, type);
    };

    HTMLMediaElement.prototype.canPlayType = makeChecker(HTMLMediaElement.prototype.canPlayType);
    if (window.MediaSource) MediaSource.isTypeSupported = makeChecker(MediaSource.isTypeSupported.bind(MediaSource));

    if (navigator.mediaCapabilities) {
        const origDecode = navigator.mediaCapabilities.decodingInfo.bind(navigator.mediaCapabilities);
        navigator.mediaCapabilities.decodingInfo = function (config) {
            const type = (config?.video?.contentType || '') + (config?.audio?.contentType || '');
            if (isBlocked(type)) return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
            return origDecode(config);
        };
    }
})();
