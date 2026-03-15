/**
 * src/features/quality.js
 * Enforces a maximum playback quality on YouTube.
 * Uses multiple strategies to ensure the setting sticks on modern YouTube (SABR).
 */

(function() {
    'use strict';

    // Prevent execution in sandboxed iframes
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const maxResPref = localStorage['ytl-max_res'] || 'auto';
    if (maxResPref === 'auto') return;

    // Mapping of our simplified labels to YouTube's internal quality names
    const RESOLUTION_MAP = {
        '1080': 'hd1080',
        '720':  'hd720',
        '480':  'large',
        '360':  'medium',
        '144':  'tiny'
    };

    const targetQuality = RESOLUTION_MAP[maxResPref];
    if (!targetQuality) return;

    const enforceQuality = () => {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player) return;

        try {
            // Strategy 1: setPlaybackQualityRange (The most "official" way)
            // It sets a ceiling for automatic quality selection.
            if (typeof player.setPlaybackQualityRange === 'function') {
                player.setPlaybackQualityRange('tiny', targetQuality);
            }

            // Strategy 2: setPlaybackQuality (Immediate force)
            // Sometimes needed if the video already started at a higher resolution.
            if (typeof player.getPlaybackQuality === 'function' && typeof player.setPlaybackQuality === 'function') {
                const current = player.getPlaybackQuality();
                // If current quality exists and is "better" than our target (heuristic check)
                // YouTube labels order: tiny < small < medium < large < hd720 < hd1080 < hd1440 < hd2160
                const levels = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160', 'hd2880', 'highres'];
                const targetIdx = levels.indexOf(targetQuality);
                const currentIdx = levels.indexOf(current);

                if (currentIdx > targetIdx) {
                    player.setPlaybackQuality(targetQuality);
                }
            }
        } catch (e) {
            // Silently fail if player API is not ready
        }
    };

    // Strategy 3: Aggressive Polling + Event Listeners
    // YouTube's player is notoriously finicky with timing.
    
    // Listen for YouTube internal navigation events
    window.addEventListener('yt-navigate-finish', () => setTimeout(enforceQuality, 500));
    window.addEventListener('yt-player-updated', () => enforceQuality());

    // Basic interval to catch cases where events don't fire correctly
    let counter = 0;
    const interval = setInterval(() => {
        enforceQuality();
        if (++counter > 20) clearInterval(interval); // Poll for ~4 seconds
    }, 200);

    // Initial run
    enforceQuality();

    // Strategy 4: Intercepting YouTube's preference storage (Optional/Advanced)
    // We try to tell YouTube that the user *manually* chose this quality in the past.
    try {
        const ytData = localStorage['yt-player-quality'];
        if (ytData) {
            const parsed = JSON.parse(ytData);
            if (parsed && parsed.data) {
                const data = JSON.parse(parsed.data);
                // Only update if we are restricting (to avoid over-writing higher user preferences if they turn us off)
                data.quality = targetQuality;
                parsed.data = JSON.stringify(data);
                parsed.expiration = Date.now() + 86400000; // 24h
                localStorage['yt-player-quality'] = JSON.stringify(parsed);
            }
        }
    } catch(e) {}

})();
