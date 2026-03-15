/**
 * src/features/quality.js
 * Caps max playback quality based on the new unified dropdown (max_res).
 * Supports 1080p, 720p, 480p, 360p, 144p.
 */

(function() {
    'use strict';

    const maxResPref = localStorage['ytl-max_res'] || 'auto';
    if (maxResPref === 'auto') return;

    // Map the dropdown values to YouTube's internal quality labels
    const RESOLUTION_MAP = {
        '1080': 'hd1080',
        '720':  'hd720',
        '480':  'large',
        '360':  'medium',
        '144':  'tiny'
    };

    const targetQuality = RESOLUTION_MAP[maxResPref] || 'hd720';

    function applyQuality() {
        const p = document.getElementById('movie_player');
        if (p && typeof p.setPlaybackQualityRange === 'function') {
            try {
                // Force YouTube to stay within the desired quality or lower
                p.setPlaybackQualityRange('tiny', targetQuality);
            } catch(e) {}
        }
    }

    // Since player might load late, we poll for it briefly
    let attempts = 0;
    const interval = setInterval(() => {
        const p = document.getElementById('movie_player');
        if (p && typeof p.setPlaybackQualityRange === 'function') {
            applyQuality();
            clearInterval(interval);
        }
        if (++attempts > 50) clearInterval(interval); // 10s max
    }, 200);

    // Also re-apply when navigating (SPA)
    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(applyQuality, 500);
    });

})();
