/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Now with Live Sync support (works immediately without reload).
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    // Helper to get fresh settings from localStorage
    const getSettings = () => ({
        useSharpness: localStorage['ytl-enhance_sharpness'] === 'true',
        useHDR:       localStorage['ytl-enhance_hdr']       === 'true',
        useAudio:     localStorage['ytl-enhance_audio']     === 'true'
    });

    // --- 1. LIVE VISUAL FILTERS (CSS Style Injection) ---
    const updateVisualFX = () => {
        const { useSharpness, useHDR } = getSettings();
        const id = 'yt-lite-premium-fx';
        let style = document.getElementById(id);
        
        if (!useSharpness && !useHDR) {
            if (style) style.remove();
            return;
        }

        if (!style) {
            style = document.createElement('style');
            style.id = id;
            (document.head || document.documentElement).appendChild(style);
        }

        let filters = [];
        if (useHDR) filters.push('contrast(1.12) saturate(1.30) brightness(1.04)');
        if (useSharpness) filters.push('contrast(1.02)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.join(' ')} !important;
                ${useSharpness ? 'image-rendering: -webkit-optimize-contrast !important; image-rendering: crisp-edges !important;' : ''}
            }
        `;
    };

    // --- 2. AUDIO ENHANCEMENTS (Dynamic Hook) ---
    let audioCtx = null;
    let source = null;
    let compressor = null;
    let merger = null;

    const applyAudioFX = () => {
        const { useAudio } = getSettings();
        const video = document.querySelector('video');
        if (!video) return;

        if (!useAudio) {
            // Disconnecting AudioContext safely is complex, usually we just set bypass
            if (compressor) compressor.threshold.value = 0; // Effectively bypass
            return;
        }

        if (video.ytLiteAudioHooked) {
            if (compressor) compressor.threshold.value = -24; // Reactivate
            return;
        }

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.ratio.value = 4;

            const splitter = audioCtx.createChannelSplitter(2);
            merger = audioCtx.createChannelMerger(2);
            const delay = audioCtx.createDelay();
            delay.delayTime.value = 0.012;

            source.connect(compressor);
            compressor.connect(splitter);
            splitter.connect(merger, 0, 0);
            splitter.connect(delay, 1);
            delay.connect(merger, 0, 1);
            merger.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
        } catch (e) {
            console.warn("YT Lite: Audio FX blocked by CORS.");
        }
    };

    // --- LIVE SYNC LISTENER ---
    // This watches for changes in localStorage sent by content_script.js
    window.addEventListener('storage', (e) => {
        if (e.key.startsWith('ytl-enhance_')) {
            updateVisualFX();
            if (e.key === 'ytl-enhance_audio') applyAudioFX();
        }
    });

    // Custom event from content_script for more reliable live updates
    window.addEventListener('yt-lite-settings-updated', () => {
        updateVisualFX();
        applyAudioFX();
    });

    // Initial and Navigation run
    const run = () => {
        updateVisualFX();
        applyAudioFX();
    };

    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1000));
    run();
    
    // Safety pulse to ensure styles aren't overwritten by YT
    setInterval(updateVisualFX, 3000);

})();
