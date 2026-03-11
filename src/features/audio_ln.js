/**
 * src/features/audio_ln.js
 * Disables YouTube's Loudness Normalization (Stable Volume).
 * Implements persistent monkey-patching and event hooks to survive SPA navigations.
 */

(function() {
    'use strict';
    
    if (window.self !== window.top || window.location.href === 'about:blank') return;
    if (localStorage['ytl-disable_ln'] !== 'true') return;

    let overrideVideoId = '';

    function enforceLoudnessOff() {
        const player = document.getElementById('movie_player');
        if (!player) return;

        // 1. Monkey-patch setters to prevent YouTube from turning it back on via internal scripts
        if (typeof player.setOption === 'function' && !player._ytl_ln_patched) {
            const origSetOption = player.setOption;
            player.setOption = function(key, value) {
                if (key === 'loudnessNormalization') value = false;
                return origSetOption.call(this, key, value);
            };
            player._ytl_ln_patched = true;
        }

        if (typeof player.setDrcUserPreference === 'function' && !player._ytl_drc_patched) {
            const origSetDrc = player.setDrcUserPreference;
            player.setDrcUserPreference = function(value) {
                return origSetDrc.call(this, false);
            };
            player._ytl_drc_patched = true;
        }

        // 2. Force initialization override exactly once per video ID
        // This ensures we recalculate the audio node (setVolume) without causing slider UI spam
        let currentVideoId = '';
        if (typeof player.getVideoData === 'function') {
            const data = player.getVideoData();
            currentVideoId = data ? data.video_id : '';
        }

        // If video changed (or first load), strike the normalization
        if (currentVideoId && currentVideoId !== overrideVideoId) {
            overrideVideoId = currentVideoId;
            
            if (typeof player.setOption === 'function') {
                player.setOption('loudnessNormalization', false);
            }
            if (typeof player.setDrcUserPreference === 'function') {
                player.setDrcUserPreference(false);
            }
            
            // Re-apply volume to trigger JS audio node gain recalculation immediately
            if (typeof player.setVolume === 'function' && typeof player.getVolume === 'function') {
                const vol = player.getVolume();
                player.setVolume(vol);
            }
            
            console.log("YT Lite: Content Loudness Normalization defeated for video " + currentVideoId);
        }
    }

    // 3. Hook HTML5 Video element natively to catch ad transitions and rapid video changes
    function attachHooks() {
        const video = document.querySelector('video');
        if (video && !video._ytl_ln_hooked) {
            video._ytl_ln_hooked = true;
            video.addEventListener('loadeddata', enforceLoudnessOff);
            video.addEventListener('playing', enforceLoudnessOff);
            video.addEventListener('durationchange', enforceLoudnessOff);
        }
    }

    // 4. Fallback Poller at 1Hz 
    // Zero performance cost. Ensures hooks are attached if DOM changes or YouTube totally rebuilds the player.
    setInterval(() => {
        attachHooks();
        enforceLoudnessOff();
    }, 1000);

})();


