/**
 * src/features/ai_dub.js
 * Automatically kills YouTube AI Dubbing (Auto-Translated Audio Tracks).
 * Sets the audio track back to the original ("Original") and hides the Audio Track settings menu.
 */

(function() {
    'use strict';

    if (localStorage['ytb-disable_ai_dub'] !== 'true') return;

    // We used to hide the Audio Track menu via CSS here, but that broke native
    // features like "Destacar vozes" (Clear Voice).
    // Now we ONLY use JS to auto-select the Original track, leaving the menu visible!

    function fixAudioTrack() {
        const player = document.getElementById('movie_player');
        if (!player || typeof player.getAvailableAudioTracks !== 'function') return;

        const tracks = player.getAvailableAudioTracks();
        if (!tracks || tracks.length <= 1) return;

        // Check current track
        const current = player.getAudioTrack ? player.getAudioTrack() : null;
        if (current) {
            const currentName = typeof current.name === 'string' ? current.name : (current.a7 && current.a7.name) || "";
            if (currentName.toLowerCase().includes('original')) return; // Already correct
        }

        // Find the track marked as "Original" in its name or ID
        // YouTube sometimes nests it in bizarre places like a7.name or within base64 IDs
        const originalTrack = tracks.find(t => {
            const name = typeof t.name === 'string' ? t.name : ((t.a7 && t.a7.name) || "");
            const id = t.id || "";
            return name.toLowerCase().includes('original') || id.toLowerCase().includes('orig');
        });

        if (originalTrack && typeof player.setAudioTrack === 'function') {
            player.setAudioTrack(originalTrack);
            console.log("yt bettr: Forced Original Audio Track");
        }
    }

    // Attempt to set audio track immediately and nav updates
    fixAudioTrack();
    document.addEventListener('yt-navigate-finish', fixAudioTrack);
    
    // Fallback: poll until the player is ready and audio tracks are parsed
    let attempts = 0;
    const interval = setInterval(() => {
        const p = document.getElementById('movie_player');
        if (p && typeof p.getAvailableAudioTracks === 'function') {
            fixAudioTrack();
            // We don't clear immediately if we found the function, because the track 
            // metadata might load a few milliseconds later. We clear after 10s.
        }
        if (++attempts > 50) clearInterval(interval); // 10s max
    }, 200);

})();
