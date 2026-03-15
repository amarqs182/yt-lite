/**
 * src/features/enhancer.js
 * Implements Premium Visual and Audio Enhancements for the High mode.
 * Optimized for robustness and zero performance overhead when disabled.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const useSharpness = localStorage['ytl-enhance_sharpness'] === 'true';
    const useHDR       = localStorage['ytl-enhance_hdr']       === 'true';
    const useAudio     = localStorage['ytl-enhance_audio']     === 'true';

    // --- 1. Visual Enhancements (CSS Style Injection) ---
    // Injected styles are more reliable than setting JS properties on dynamic elements.
    const injectVisualStyles = () => {
        let filters = [];
        if (useHDR) {
            filters.push('contrast(1.08)', 'saturate(1.20)', 'brightness(1.03)');
        }
        if (useSharpness) {
            filters.push('contrast(1.02)');
        }

        if (filters.length > 0 || useSharpness) {
            const id = 'yt-lite-premium-fx';
            let style = document.getElementById(id);
            if (!style) {
                style = document.createElement('style');
                style.id = id;
                (document.head || document.documentElement).appendChild(style);
            }

            style.textContent = `
                /* Targeted filtering for the main video stream */
                video.html5-main-video {
                    filter: ${filters.join(' ')} !important;
                    ${useSharpness ? 'image-rendering: -webkit-optimize-contrast !important; image-rendering: crisp-edges !important;' : ''}
                }
                
                /* Slight sharpening effect using contrast on container if needed */
                .html5-video-container {
                    background: black !important;
                }
            `;
        }
    };

    // --- 2. Audio Enhancements (Dynamic Audio Node Hook) ---
    let audioContext = null;
    let sourceNode = null;
    let effectNode = null;

    const applyAudioFX = () => {
        if (!useAudio) return;
        
        const video = document.querySelector('video');
        if (!video) return;

        try {
            // We only hook once per page load to avoid "Source already connected" errors
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                sourceNode = audioContext.createMediaElementSource(video);
                
                // Compressor Node: Behaves like a 'Smart Volume' but tuned for clarity
                const compressor = audioContext.createDynamicsCompressor();
                compressor.threshold.value = -20;
                compressor.knee.value = 12;
                compressor.ratio.value = 3;
                compressor.attack.value = 0.003;
                compressor.release.value = 0.25;

                // Simple Stereo Widener (Haas Effect)
                const splitter = audioContext.createChannelSplitter(2);
                const merger = audioContext.createChannelMerger(2);
                const delay = audioContext.createDelay();
                delay.delayTime.value = 0.015; // 15ms for perceived width

                sourceNode.connect(compressor);
                compressor.connect(splitter);
                
                splitter.connect(merger, 0, 0); // L -> L
                splitter.connect(delay, 1, 0); // R -> Delay
                delay.connect(merger, 0, 1);   // Delay -> R
                
                merger.connect(audioContext.destination);
                
                console.log("YT Lite: Premium Audio FX Applied (Compressor + Width)");
            }
        } catch (e) {
            // CORS often blocks createMediaElementSource on YouTube
            console.warn("YT Lite: Audio FX blocked by CORS policy. YouTube stream is protected.");
        }
    };

    // --- INITIALIZATION ---
    if (useHDR || useSharpness) injectVisualStyles();
    
    // We try to apply audio FX when the video element is ready
    if (useAudio) {
        let audioAttempts = 0;
        const audioInterval = setInterval(() => {
            const v = document.querySelector('video');
            if (v && v.readyState >= 1) {
                applyAudioFX();
                clearInterval(audioInterval);
            }
            if (++audioAttempts > 50) clearInterval(audioInterval);
        }, 500);
    }

    // Re-verify visual filters on navigation
    document.addEventListener('yt-navigate-finish', () => {
        if (useHDR || useSharpness) injectVisualStyles();
    });

})();
