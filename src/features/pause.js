/**
 * src/features/pause.js
 * Saves severe background CPU usage by automatically pausing the video when the tab goes hidden.
 * Also hijacks requestVideoFrameCallback while paused to stop YouTube from endlessly querying DOM frames.
 */

(function() {
    'use strict';

    const enableHiddenPause = localStorage['ytl-hidden_pause'] === 'true';
    const enablePauseLoops = localStorage['ytl-pause_loops'] === 'true';

    // 1. Auto-pause functionality
    if (enableHiddenPause) {
        document.addEventListener('visibilitychange', () => {
            const player = document.getElementById('movie_player');
            if (!player) return;
            
            const video = document.querySelector('video');
            if (!video) return;

            if (document.hidden) {
                // Only pause if the video isn't an ad (YouTube ads act weird if paused forcefully)
                if (!video.classList.contains('ad-showing') && typeof player.pauseVideo === 'function') {
                    player.pauseVideo();
                }
            } 
            // Note: We don't auto-resume on visibilitychange because the user might have intentionally paused it
        });
    }

    // 2. Kill the requestVideoFrameCallback loop when not playing to save CPU drawing cycles
    if (enablePauseLoops) {
        const originalRVFC = HTMLVideoElement.prototype.requestVideoFrameCallback;
        if (originalRVFC) {
            HTMLVideoElement.prototype.requestVideoFrameCallback = function(callback) {
                // If the video is paused or the document is hidden, intercept the frame loop request
                if (this.paused || document.hidden) {
                    // Return a fake ID so YouTube thinks it queued, but NEVER call the callback
                    // This stops YouTube from needlessly burning CPU cycles on a frozen/invisible frame
                    return Math.floor(Math.random() * 100000); 
                }
                // Otherwise, let it draw as normal
                return originalRVFC.call(this, callback);
            };
        }
    }

})();
