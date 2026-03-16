/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Trusted Types Compliant: No innerHTML or unsafe assignments.
 * Professional Features: GPU-accelerated Sharpening, Natural HDR, and Animated Canvas Film Grain.
 */

(function () {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytb-' + k);
    const getB = (k) => getS(k) === 'true';

    // --- 1. SVG SHARPEN FILTER ---
    const injectSVG = () => {
        if (document.getElementById('ytb-svg-defs')) return;
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.id = 'ytb-svg-defs';
        svg.setAttribute('style', 'display:none;position:absolute;width:0;height:0');

        const defs = document.createElementNS(ns, "defs");
        const filter = document.createElementNS(ns, "filter");
        filter.id = "ytb-sharpen";

        const matrix = document.createElementNS(ns, "feConvolveMatrix");
        matrix.setAttribute("order", "3");
        matrix.setAttribute("preserveAlpha", "true");
        // Gentle unsharp mask: center 2.2, neighbors -0.2 — visible but no halos
        matrix.setAttribute("kernelMatrix", "0 -0.2 0 -0.2 2.2 -0.2 0 -0.2 0");

        filter.appendChild(matrix);
        defs.appendChild(filter);
        svg.appendChild(defs);
        (document.body || document.documentElement).appendChild(svg);
    };

    // --- 2. PROFESSIONAL CANVAS GRAIN ENGINE ---
    let grainCanvas = null;
    let grainCtx = null;
    let grainFrames = [];
    let currentFrame = 0;
    let grainInterval = null;

    const initGrainPatterns = () => {
        if (grainFrames.length > 0) return;
        for (let f = 0; f < 12; f++) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(512, 512);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                // Gaussian distribution over full 0–255 range
                // soft-light needs full range to have impact at low opacity
                let val = 0;
                for (let s = 0; s < 4; s++) val += Math.random();
                val = Math.floor((val / 4) * 255);
                data[i] = data[i + 1] = data[i + 2] = val;
                data[i + 3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
            grainFrames.push(canvas);
        }
    };

    const updateGrain = () => {
        const useGrain = getB('enhance_grain');
        const rawIntensity = parseInt(getS('grain_intensity') || '25', 10);
        // Divide by 200 so slider 25 = opacity 0.125 (sweet spot for soft-light)
        const intensity = rawIntensity / 200;

        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-container');
        if (!useGrain || !player) {
            if (grainCanvas) grainCanvas.style.display = 'none';
            if (grainInterval) { clearInterval(grainInterval); grainInterval = null; }
            return;
        }

        initGrainPatterns();

        if (!grainCanvas) {
            grainCanvas = document.createElement('canvas');
            grainCanvas.id = 'ytb-grain-canvas';
            grainCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;mix-blend-mode:soft-light;';
            player.appendChild(grainCanvas);
            grainCtx = grainCanvas.getContext('2d');
        }

        grainCanvas.style.display = 'block';
        grainCanvas.style.opacity = intensity.toString();

        if (!grainInterval) {
            grainInterval = setInterval(() => {
                if (!getB('enhance_grain')) return;

                if (grainCanvas.width !== player.offsetWidth || grainCanvas.height !== player.offsetHeight) {
                    grainCanvas.width = player.offsetWidth;
                    grainCanvas.height = player.offsetHeight;
                }

                if (grainCanvas.width === 0) return;

                currentFrame = (currentFrame + 1) % grainFrames.length;
                const pattern = grainCtx.createPattern(grainFrames[currentFrame], 'repeat');
                grainCtx.fillStyle = pattern;
                grainCtx.fillRect(0, 0, grainCanvas.width, grainCanvas.height);
            }, 42); // ~24fps cinematic
        }
    };

    // --- 3. VISUAL ENGINE ---
    const updateVisuals = () => {
        injectSVG();

        const styleId = 'ytb-premium-styles';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const useHDR = getB('enhance_hdr');
        const useSharp = getB('enhance_sharpness');

        let filters = [];
        if (useHDR) filters.push('contrast(1.05) saturate(1.10)');
        if (useSharp) filters.push('url(#ytb-sharpen)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.length ? filters.join(' ') : 'none'} !important;
                will-change: filter;
            }
        `;
        updateGrain();
    };

    // --- 4. AUDIO ENGINE ---
    let audioCtx, source, bass, treble, compressor, mainGain;

    const setupAudio = (video) => {
        if (video.ytlAudioHooked) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);

            bass = audioCtx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 150;
            treble = audioCtx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 4500;
            compressor = audioCtx.createDynamicsCompressor();
            mainGain = audioCtx.createGain();

            source.connect(bass);
            bass.connect(treble);
            treble.connect(compressor);
            compressor.connect(mainGain);
            mainGain.connect(audioCtx.destination);

            video.ytlAudioHooked = true;
        } catch (e) { }
    };

    const updateAudioLive = () => {
        const active = getB('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (!video.ytlAudioHooked) setupAudio(video);
        if (!video.ytlAudioHooked) return;

        const ramp = 0.1;
        if (bass) bass.gain.setTargetAtTime(active ? 3.5 : 0, 0, ramp);
        if (treble) treble.gain.setTargetAtTime(active ? 4.5 : 0, 0, ramp);
        if (mainGain) mainGain.gain.setTargetAtTime(active ? 1.15 : 1.0, 0, ramp);
        if (compressor) {
            compressor.threshold.setTargetAtTime(active ? -22 : 0, 0, ramp);
            compressor.ratio.setTargetAtTime(active ? 3 : 1, 0, ramp);
        }

        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    };

    const run = () => {
        // Skip all processing if audio-only background mode is active
        if (document.documentElement.getAttribute('data-ytb-bg_active') === 'true') return;
        updateVisuals();
        updateAudioLive();
    };
    window.addEventListener('yt-bettr-sync', run);
    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    document.addEventListener('click', () => audioCtx?.state === 'suspended' && audioCtx.resume());

    setInterval(run, 4000);
    run();
})();