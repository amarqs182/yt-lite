/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Corrected: Now handles world-to-world sync correctly.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getSettings = () => ({
        useSharpness: localStorage.getItem('ytl-enhance_sharpness') === 'true',
        useHDR:       localStorage.getItem('ytl-enhance_hdr')       === 'true',
        useAudio:     localStorage.getItem('ytl-enhance_audio')     === 'true'
    });

    // --- 1. VISUAL FILTERS ---
    const updateVisualFX = () => {
        const { useSharpness, useHDR } = getSettings();
        const video = document.querySelector('video.html5-main-video');
        if (!video) return;

        let filters = [];
        // Ultra-aggressive HDR for testing
        if (useHDR) filters.push('contrast(1.15) saturate(1.40) brightness(1.05)');
        if (useSharpness) filters.push('contrast(1.02)');

        if (filters.length > 0) {
            video.style.setProperty('filter', filters.join(' '), 'important');
            video.style.setProperty('image-rendering', '-webkit-optimize-contrast', 'important');
            console.log("YT Lite: Visual Filters Applied");
        } else {
            video.style.filter = '';
        }
    };

    // --- 2. AUDIO FX (Musical Compressor) ---
    let audioCtx = null;
    let compressor = null;

    const applyAudioFX = () => {
        const { useAudio } = getSettings();
        const video = document.querySelector('video');
        if (!video) return;

        if (!useAudio) {
            if (compressor) compressor.threshold.value = 0; // Bypass
            return;
        }

        if (video.ytLiteAudioHooked) {
            if (compressor) compressor.threshold.value = -20;
            return;
        }

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            
            // "Musical" Compressor setup
            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -20; // Lower threshold to catch more
            compressor.knee.value = 30;      // Soft knee for music
            compressor.ratio.value = 3;      // Subtle ratio
            compressor.attack.value = 0.01;  // Slow attack to preserve punch
            compressor.release.value = 0.25;

            source.connect(compressor);
            compressor.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
            console.log("YT Lite: Musical Audio Compressor Active");
        } catch (e) {
            // Note: CORS issues are common on YouTube Music/Official videos
            console.warn("YT Lite: Audio Enhancement blocked by YouTube's security policy (CORS).");
        }
    };

    // --- EVENT LISTENERS ---
    window.addEventListener('yt-lite-settings-updated', () => {
        updateVisualFX();
        applyAudioFX();
    });

    const run = () => {
        updateVisualFX();
        applyAudioFX();
    };

    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    run();
    
    // Pulse check to prevent YouTube from stripping styles
    setInterval(updateVisualFX, 4000);

})();
