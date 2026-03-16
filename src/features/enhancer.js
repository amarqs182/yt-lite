/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Trusted Types Compliant: No innerHTML or unsafe assignments.
 * Professional Features: SVG Convolution Sharpen, Tonal HDR, and Animated Canvas Film Grain.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. SVG SHARPEN FILTER (Safe DOM) ---
    const injectSVG = () => {
        const id = 'ytl-svg-defs';
        if (document.getElementById(id)) return;
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.id = id;
        svg.setAttribute('style', 'display:none');
        const defs = document.createElementNS(ns, "defs");
        const filter = document.createElementNS(ns, "filter");
        filter.id = "ytl-sharpen";
        const matrix = document.createElementNS(ns, "feConvolveMatrix");
        matrix.setAttribute("order", "3");
        matrix.setAttribute("preserveAlpha", "true");
        matrix.setAttribute("kernelMatrix", "0 -1 0 -1 5 -1 0 -1 0");
        filter.appendChild(matrix);
        defs.appendChild(filter);
        svg.appendChild(defs);
        (document.body || document.documentElement).appendChild(svg);
    };

    // --- 2. PROFESSIONAL CANVAS GRAIN ---
    let grainCanvas = null;
    let grainCtx = null;
    let grainFrames = [];
    let currentFrame = 0;
    let grainInterval = null;

    const initGrain = () => {
        if (grainFrames.length > 0) return;
        // Pre-generate 10 frames of 256x256 monochromatic noise patterns
        for (let f = 0; f < 10; f++) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(256, 256);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = 128 + (Math.random() - 0.5) * 50; // Subtle intensity
                data[i] = data[i+1] = data[i+2] = val;
                data[i+3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
            grainFrames.push(canvas);
        }
    };

    const updateGrain = () => {
        const useGrain = getS('enhance_grain');
        const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-container');
        
        if (!useGrain) {
            if (grainCanvas) grainCanvas.style.display = 'none';
            if (grainInterval) { clearInterval(grainInterval); grainInterval = null; }
            return;
        }

        initGrain();

        if (!grainCanvas) {
            grainCanvas = document.createElement('canvas');
            grainCanvas.id = 'ytl-grain-canvas';
            grainCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;mix-blend-mode:overlay;opacity:0.15;';
            player.appendChild(grainCanvas);
            grainCtx = grainCanvas.getContext('2d');
        }

        grainCanvas.style.display = 'block';
        
        if (!grainInterval) {
            grainInterval = setInterval(() => {
                if (!getS('enhance_grain')) return;
                const w = grainCanvas.width = grainCanvas.clientWidth;
                const h = grainCanvas.height = grainCanvas.clientHeight;
                if (w === 0 || h === 0) return;

                currentFrame = (currentFrame + 1) % grainFrames.length;
                const pattern = grainCtx.createPattern(grainFrames[currentFrame], 'repeat');
                grainCtx.fillStyle = pattern;
                grainCtx.fillRect(0, 0, w, h);
            }, 42); // 24fps
        }
    };

    // --- 3. VISUAL FILTERS ---
    const updateVisuals = () => {
        injectSVG();
        const styleId = 'ytl-premium-styles';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const useHDR = getS('enhance_hdr');
        const useSharp = getS('enhance_sharpness');

        let filters = [];
        // Natural HDR: Toned down to avoid overlap with sharpen
        if (useHDR) filters.push('contrast(1.04) saturate(1.08) brightness(1.01)');
        if (useSharp) filters.push('url(#ytl-sharpen)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.length ? filters.join(' ') : 'none'} !important;
                will-change: filter;
            }
        `;
        updateGrain();
    };

    // --- 4. AUDIO ENGINE (Live Bypass) ---
    let audioCtx, source, bass, treble, comp, gain;

    const updateAudio = () => {
        const active = getS('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (video.ytlAudioHooked) {
            const r = 0.1;
            // Immediate neutral bypass when inactive
            if (bass)   bass.gain.setTargetAtTime(active ? 3.5 : 0, 0, r);
            if (treble) treble.gain.setTargetAtTime(active ? 4.5 : 0, 0, r);
            if (gain)   gain.gain.setTargetAtTime(active ? 1.15 : 1, 0, r);
            if (comp) {
                comp.threshold.setTargetAtTime(active ? -22 : 0, 0, r);
                comp.ratio.setTargetAtTime(active ? 3 : 1, 0, r);
            }
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            bass = audioCtx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 150;
            treble = audioCtx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 4500;
            comp = audioCtx.createDynamicsCompressor();
            gain = audioCtx.createGain();

            source.connect(bass);
            bass.connect(treble);
            treble.connect(comp);
            comp.connect(gain);
            gain.connect(audioCtx.destination);

            video.ytlAudioHooked = true;
            setTimeout(updateAudio, 100);
        } catch(e) {}
    };

    const run = () => { updateVisuals(); updateAudio(); };
    window.addEventListener('yt-lite-sync', run);
    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    document.addEventListener('click', () => audioCtx?.state === 'suspended' && audioCtx.resume());
    
    setInterval(run, 4000);
    run();
})();
