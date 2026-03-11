/**
 * src/features/quality.js
 * Caps max playback quality to 720p when the user option is enabled.
 * Uses the YouTube native HTML5 player API DOM methods.
 */

(function() {
    'use strict';

    if (localStorage['ytl-max_720p'] !== 'true') return;

    const TARGET_QUALITY = 'hd720';

    function applyQuality() {
        const player = document.getElementById('movie_player');
        if (!player || typeof player.setPlaybackQualityRange !== 'function') return;

        // Ensure we don't try to set a quality that doesn't exist
        const available = player.getAvailableQualityLevels ? player.getAvailableQualityLevels() : [];
        const ORDER = ['hd720', 'large', 'medium', 'small', 'tiny'];
        const cap = ORDER.find(q => available.includes(q)) || TARGET_QUALITY;

        player.setPlaybackQualityRange(cap, cap);
    }

    // Attempt to set quality immediately and after navigation events
    applyQuality();
    document.addEventListener('yt-navigate-finish', applyQuality);
    
    // Fallback: poll until the player is ready (up to 10 seconds)
    let attempts = 0;
    const interval = setInterval(() => {
        const p = document.getElementById('movie_player');
        if (p && typeof p.setPlaybackQualityRange === 'function') {
            applyQuality();
            clearInterval(interval);
        }
        if (++attempts > 50) clearInterval(interval); // 10s max
    }, 200);

})();
