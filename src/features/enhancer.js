/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Trusted Types Compliant: Uses DOM API instead of innerHTML.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. SVG FILTERS (Safe DOM Construction) ---
    const injectSVG = () => {
        const id = 'ytl-svg-defs';
        if (document.getElementById(id)) return;

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.id = id;
        svg.setAttribute('style', 'display:none');

        const defs = document.createElementNS(ns, "defs");

        // A. Sharpen Filter
        const sharpen = document.createElementNS(ns, "filter");
        sharpen.id = "ytl-sharpen";
        const convolve = document.createElementNS(ns, "feConvolveMatrix");
        convolve.setAttribute("order", "3");
        convolve.setAttribute("preserveAlpha", "true");
        convolve.setAttribute("kernelMatrix", "0 -1 0 -1 5 -1 0 -1 0");
        sharpen.appendChild(convolve);
        defs.appendChild(sharpen);

        // B. Grain Filter
        const grain = document.createElementNS(ns, "filter");
        grain.id = "ytl-grain";
        
        const turb = document.createElementNS(ns, "feTurbulence");
        turb.setAttribute("type", "fractalNoise");
        turb.setAttribute("baseFrequency", "0.8");
        turb.setAttribute("numOctaves", "3");
        turb.setAttribute("stitchTiles", "stitch");
        grain.appendChild(turb);

        const sat = document.createElementNS(ns, "feColorMatrix");
        sat.setAttribute("type", "saturate");
        sat.setAttribute("values", "0");
        grain.appendChild(sat);

        const trans = document.createElementNS(ns, "feComponentTransfer");
        const funcA = document.createElementNS(ns, "feFuncA");
        funcA.setAttribute("type", "linear");
        funcA.setAttribute("slope", "0.07");
        trans.appendChild(funcA);
        grain.appendChild(trans);

        const comp = document.createElementNS(ns, "feComposite");
        comp.setAttribute("operator", "in");
        comp.setAttribute("in2", "SourceGraphic");
        grain.appendChild(comp);

        defs.appendChild(grain);
        svg.appendChild(defs);

        (document.body || document.documentElement).appendChild(svg);
    };

    // --- 2. VISUAL ENGINE ---
    const updateUI = () => {
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
        const useGrain = getS('enhance_grain');

        let filters = [];
        if (useHDR) filters.push('contrast(1.05) saturate(1.12) brightness(1.01)');
        if (useSharp) filters.push('url(#ytl-sharpen)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.length ? filters.join(' ') : 'none'} !important;
            }
            .ytl-grain-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 10;
                filter: url(#ytl-grain);
                display: ${useGrain ? 'block' : 'none'};
            }
        `;

        const container = document.querySelector('.html5-video-container');
        if (container && !document.querySelector('.ytl-grain-overlay')) {
            const grain = document.createElement('div');
            grain.className = 'ytl-grain-overlay';
            container.appendChild(grain);
        }
    };

    // --- 3. AUDIO ENGINE ---
    let audioCtx, source, bass, treble, comp, gain;

    const updateAudio = () => {
        const active = getS('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (video.ytlAudioHooked) {
            const r = 0.1;
            bass.gain.setTargetAtTime(active ? 3 : 0, 0, r);
            treble.gain.setTargetAtTime(active ? 4 : 0, 0, r);
            gain.gain.setTargetAtTime(active ? 1.1 : 1, 0, r);
            comp.threshold.setTargetAtTime(active ? -20 : 0, 0, r);
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            bass = audioCtx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 150;
            treble = audioCtx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 4000;
            comp = audioCtx.createDynamicsCompressor();
            gain = audioCtx.createGain();

            source.connect(bass);
            bass.connect(treble);
            treble.connect(comp);
            comp.connect(gain);
            gain.connect(audioCtx.destination);

            video.ytlAudioHooked = true;
            updateAudio();
        } catch(e) {}
    };

    const run = () => { updateUI(); updateAudio(); };
    window.addEventListener('yt-lite-sync', run);
    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1000));
    document.addEventListener('click', () => audioCtx?.state === 'suspended' && audioCtx.resume());
    
    setInterval(run, 3000);
    run();
})();
