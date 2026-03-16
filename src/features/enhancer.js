/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Now with optimized natural HDR and Instant Audio Toggling.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. NATURAL VISUAL FILTERS ---
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
        // Toned down HDR for natural look
        if (getS('enhance_hdr')) filters.push('contrast(1.08) saturate(1.18) brightness(1.02)');
        if (getS('enhance_sharpness')) filters.push('contrast(1.02)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.join(' ')} !important;
                ${getS('enhance_sharpness') ? 'image-rendering: -webkit-optimize-contrast !important;' : ''}
            }
        `;
    };

    // --- 2. AUDIO ENHANCEMENTS (Live Toggle) ---
    let audioCtx = null;
    let gainNode = null;
    let shelfFilter = null;
    let compressor = null;
    let delayNode = null;

    const applyAudioFX = () => {
        const video = document.querySelector('video');
        if (!video) return;

        const active = getS('enhance_audio');

        // If already hooked, just update parameters live
        if (video.ytLiteAudioHooked) {
            if (gainNode) gainNode.gain.setTargetAtTime(active ? 1.15 : 1.0, 0, 0.1);
            if (shelfFilter) shelfFilter.gain.setTargetAtTime(active ? 3.5 : 0, 0, 0.1);
            if (compressor) compressor.threshold.setTargetAtTime(active ? -22 : 0, 0, 0.1);
            if (delayNode) delayNode.delayTime.setTargetAtTime(active ? 0.020 : 0, 0, 0.1);
            return;
        }

        if (!active) return; // Don't hook if not active yet

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            
            shelfFilter = audioCtx.createBiquadFilter();
            shelfFilter.type = "highshelf";
            shelfFilter.frequency.value = 3500;
            shelfFilter.gain.value = 3.5;

            gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.15;

            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -22;
            compressor.ratio.value = 3;

            const splitter = audioCtx.createChannelSplitter(2);
            const merger = audioCtx.createChannelMerger(2);
            delayNode = audioCtx.createDelay();
            delayNode.delayTime.value = 0.020;

            source.connect(shelfFilter);
            shelfFilter.connect(gainNode);
            gainNode.connect(compressor);
            compressor.connect(splitter);
            splitter.connect(merger, 0, 0);
            splitter.connect(delayNode, 1, 0);
            delayNode.connect(merger, 0, 1);
            merger.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
            console.log("YT Lite: Audio Hooked");
        } catch (e) {
            console.warn("YT Lite: Audio CORS restricted.");
        }
    };

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
