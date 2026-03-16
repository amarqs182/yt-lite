/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Refined: True HDR (Contrast-only depth) and Perfect Audio Bypass.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. REFINED VISUAL FILTERS ---
    const updateVisualFX = () => {
        const id = 'yt-lite-premium-fx';
        let style = document.getElementById(id);
        
        if (!getS('enhance_sharpness') && !getS('enhance_hdr')) {
            if (style) style.remove();
            return;
        }

        if (!style) {
            style = document.createElement('style');
            style.id = id;
            (document.head || document.documentElement).appendChild(style);
        }

        let filters = [];
        // HDR: Toned down contrast to avoid fake sharpening look. Focus on depth.
        if (getS('enhance_hdr')) {
            filters.push('contrast(1.04) saturate(1.06) brightness(1.01)');
        }
        // Sharpness: Distinct 1.02 contrast boost
        if (getS('enhance_sharpness')) {
            filters.push('contrast(1.02)');
        }

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.join(' ')} !important;
                /* Sharpness only applies rendering hint if specifically enabled */
                ${getS('enhance_sharpness') ? 'image-rendering: -webkit-optimize-contrast !important;' : 'image-rendering: auto !important;'}
            }
        `;
    };

    // --- 2. HIGH-FIDELITY DYNAMIC AUDIO (With Perfect Bypass) ---
    let audioCtx = null;
    let source = null;
    let compressor = null;
    let bassBoost = null;
    let trebleBoost = null;
    let gainNode = null;

    const applyAudioFX = () => {
        const video = document.querySelector('video');
        if (!video) return;

        const active = getS('enhance_audio');

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (video.ytLiteAudioHooked) {
            // IMMEDIATE BYPASS: Set all gains to neutral instantly when deactivated
            const ramp = 0.05; // 50ms for click-free switching
            if (bassBoost)   bassBoost.gain.setTargetAtTime(active ? 3.0 : 0, 0, ramp);
            if (trebleBoost) trebleBoost.gain.setTargetAtTime(active ? 4.0 : 0, 0, ramp);
            if (gainNode)    gainNode.gain.setTargetAtTime(active ? 1.1 : 1.0, 0, ramp);
            if (compressor) {
                // If inactive, set threshold to 0 (no compression) and ratio to 1 (unity)
                compressor.threshold.setTargetAtTime(active ? -20 : 0, 0, ramp);
                compressor.ratio.setTargetAtTime(active ? 2.5 : 1, 0, ramp);
            }
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            bassBoost = audioCtx.createBiquadFilter();
            bassBoost.type = "lowshelf";
            bassBoost.frequency.value = 150;
            bassBoost.gain.value = 3.0;

            trebleBoost = audioCtx.createBiquadFilter();
            trebleBoost.type = "highshelf";
            trebleBoost.frequency.value = 4500;
            trebleBoost.gain.value = 4.0;

            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -20;
            compressor.knee.value = 40;
            compressor.ratio.value = 2.5;

            gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.1;

            source.connect(bassBoost);
            bassBoost.connect(trebleBoost);
            trebleBoost.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
        } catch (e) {
            console.warn("YT Lite: Audio CORS restricted.");
        }
    };

    // Global click resume
    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: false });

    // Listen for sync event from isolated world (Now perfectly matching)
    window.addEventListener('yt-lite-sync', () => {
        updateVisualFX();
        applyAudioFX();
    });

    const run = () => {
        updateVisualFX();
        applyAudioFX();
    };

    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    setTimeout(run, 500);
    setInterval(updateVisualFX, 4000);

})();
