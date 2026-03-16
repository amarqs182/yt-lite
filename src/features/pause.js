/**
 * src/features/pause.js
 * Automatically pauses video when tab is hidden or secondary loops are active.
 */
(function() {
    'use strict';
    if (window.self !== window.top) return;

    const getS = (k) => document.documentElement.getAttribute('data-ytb-' + k) === 'true';

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && getS('hidden_pause')) {
            const video = document.querySelector('video');
            if (video && !video.paused) video.pause();
        }
    });

    const originalRVFC = HTMLVideoElement.prototype.requestVideoFrameCallback;
    if (originalRVFC) {
        HTMLVideoElement.prototype.requestVideoFrameCallback = function(callback) {
            if (getS('pause_loops') && (this.paused || document.hidden)) {
                return Math.floor(Math.random() * 100000); 
            }
            return originalRVFC.call(this, callback);
        };
    }
})();
