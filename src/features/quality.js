/**
 * src/features/quality.js
 * Enforces a maximum playback quality on YouTube reading from attributes.
 */
(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getRes = () => document.documentElement.getAttribute('data-ytb-max_res') || 'auto';

    const RESOLUTION_MAP = {
        '1080': 'hd1080', '720': 'hd720', '480': 'large', '360': 'medium', '144': 'tiny'
    };

    function applyQuality() {
        const res = getRes();
        if (res === 'auto') return;
        const target = RESOLUTION_MAP[res] || 'hd720';
        const p = document.getElementById('movie_player');
        if (p && typeof p.setPlaybackQualityRange === 'function') {
            try { p.setPlaybackQualityRange('tiny', target); } catch(e) {}
        }
    }

    setInterval(applyQuality, 3000);
    window.addEventListener('yt-navigate-finish', () => setTimeout(applyQuality, 1000));
    window.addEventListener('yt-bettr-sync', applyQuality);
})();
