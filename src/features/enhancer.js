/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Refined: Natural colors and High-Fidelity "V-Shape" Dynamic Audio.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. REFINED VISUAL FILTERS (Subtle & Natural) ---
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
        // Toned down HDR: More contrast, very little saturation boost to avoid "neon" look
        if (getS('enhance_hdr')) filters.push('contrast(1.06) saturate(1.08) brightness(1.01)');
        if (getS('enhance_sharpness')) filters.push('contrast(1.02)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.join(' ')} !important;
                ${getS('enhance_sharpness') ? 'image-rendering: -webkit-optimize-contrast !important;' : ''}
            }
        `;
    };

    // --- 2. HIGH-FIDELITY DYNAMIC AUDIO (No Metallic Effect) ---
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

        // Resume context if suspended (Chrome requirement)
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (video.ytLiteAudioHooked) {
            // Live toggle parameters instead of reconnecting
            if (bassBoost) bassBoost.gain.setTargetAtTime(active ? 3.0 : 0, 0, 0.1); // +3dB Bass
            if (trebleBoost) trebleBoost.gain.setTargetAtTime(active ? 4.0 : 0, 0, 0.1); // +4dB Treble
            if (compressor) compressor.threshold.setTargetAtTime(active ? -20 : 0, 0, 0.1);
            if (gainNode) gainNode.gain.setTargetAtTime(active ? 1.1 : 1.0, 0, 0.1);
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            // A. Low Shelf (Subtle Bass Punch)
            bassBoost = audioCtx.createBiquadFilter();
            bassBoost.type = "lowshelf";
            bassBoost.frequency.value = 150;
            bassBoost.gain.value = 3.0;

            // B. High Shelf (Crystal Clarity / Voices)
            trebleBoost = audioCtx.createBiquadFilter();
            trebleBoost.type = "highshelf";
            trebleBoost.frequency.value = 4500;
            trebleBoost.gain.value = 4.0;

            // C. Soft Knee Compressor (Dynamic Leveling)
            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -20;
            compressor.knee.value = 40; // Very soft transition
            compressor.ratio.value = 2.5; // Mild ratio for music
            compressor.attack.value = 0.01;
            compressor.release.value = 0.25;

            // D. Main Gain
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.1;

            // Routing (Serial chain for stability)
            source.connect(bassBoost);
            bassBoost.connect(trebleBoost);
            trebleBoost.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
            console.log("YT Lite: Hi-Fi Dynamic Audio Active");
        } catch (e) {
            console.warn("YT Lite: Audio CORS restricted.");
        }
    };

    // Fix for "Working sometimes": Resume AudioContext on first click
    const resumeAudio = () => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    };
    document.addEventListener('mousedown', resumeAudio, { once: false });

    // Listen for sync event from isolated world
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
