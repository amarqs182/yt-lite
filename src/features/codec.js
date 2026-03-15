/**
 * src/features/codec.js
 * Parses the new unified dropdown options (video_codec, audio_codec, max_fps).
 * Overrides APIs used by YouTube for codec negotiation (incl. SABR).
 */
(function () {
    'use strict';
    
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const videoPref = localStorage['ytl-video_codec'] || 'auto'; // auto, av1, vp9, h264
    const audioPref = localStorage['ytl-audio_codec'] || 'auto'; // auto, aac
    const maxFps    = localStorage['ytl-max_fps']     || 'auto'; // auto, 30

    if (videoPref === 'auto' && audioPref === 'auto' && maxFps === 'auto') return;

    function isBlocked(type) {
        if (!type) return false;
        const t = type.toLowerCase();
        
        // CRITICAL FIX: Never block DRM/widevine checks
        if (t.includes('drm') || t.includes('enc') || t.includes('widevine') || t.includes('cenc')) {
            return false;
        }

        // --- AUDIO ---
        const isAudio = t.startsWith('audio') || t.includes('audio/');
        if (isAudio || t.includes('opus') || t.includes('mp4a')) {
            if (audioPref === 'aac') {
                // To force AAC, we block Opus
                if (t.includes('opus')) return true;
            }
            return false;
        }

        // --- VIDEO ---
        if (videoPref !== 'auto') {
            const isAv1 = t.includes('av01') || t.includes('av99');
            const isVp9 = t.includes('vp9') || t.includes('vp09') || t.includes('webm');
            const isH264 = t.includes('avc') || t.includes('mp4v') || t.includes('h264');

            // If user wants AV1, block VP9 and H264
            if (videoPref === 'av1' && (isVp9 || isH264)) return true;
            // If user wants VP9, block AV1 and H264
            if (videoPref === 'vp9' && (isAv1 || isH264)) return true;
            // If user wants H264, block AV1 and VP9
            if (videoPref === 'h264' && (isAv1 || isVp9)) return true;
        }

        // --- FPS ---
        if (maxFps === '30') {
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

    // 3. MediaCapabilities.decodingInfo
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
