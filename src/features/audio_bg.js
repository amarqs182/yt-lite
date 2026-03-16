/**
 * src/features/audio_bg.js
 * Audio-Only Background Mode.
 * When tab is hidden: forces 144p, kills visual filters and grain canvas,
 * blocks requestVideoFrameCallback — keeps only audio playing with
 * minimal CPU/GPU/battery usage.
 * Priority: hidden_pause (full stop) > bg_audio (audio-only).
 */
(function () {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getB = (k) => document.documentElement.getAttribute('data-ytb-' + k) === 'true';
    const root = document.documentElement;

    let savedQuality = null;
    let isInBgMode = false;

    // --- Quality helpers ---
    const getPlayer = () => document.getElementById('movie_player');

    const forceMinQuality = () => {
        const p = getPlayer();
        if (!p || typeof p.getPlaybackQuality !== 'function') return;
        try {
            savedQuality = p.getPlaybackQuality();
            p.setPlaybackQualityRange('tiny', 'tiny');
        } catch (e) {}
    };

    const restoreQuality = () => {
        const p = getPlayer();
        if (!p || typeof p.setPlaybackQualityRange !== 'function') return;
        try {
            // Restore to user's configured max_res or let quality.js handle it
            const userMax = root.getAttribute('data-ytb-max_res') || 'auto';
            if (userMax === 'auto') {
                p.setPlaybackQualityRange('tiny', 'highres');
            } else {
                const map = { '1080': 'hd1080', '720': 'hd720', '480': 'large', '360': 'medium', '144': 'tiny' };
                const target = map[userMax] || 'hd720';
                p.setPlaybackQualityRange('tiny', target);
            }
            savedQuality = null;
        } catch (e) {}
    };

    // --- Visual filter suppression ---
    const STYLE_ID = 'ytb-bg-audio-kill';

    const killVisuals = () => {
        let style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            (document.head || root).appendChild(style);
        }
        style.textContent = `
            video.html5-main-video { filter: none !important; will-change: auto !important; }
            #ytb-grain-canvas { display: none !important; }
        `;
        // Signal enhancer.js to skip updates
        root.setAttribute('data-ytb-bg_active', 'true');
    };

    const restoreVisuals = () => {
        const style = document.getElementById(STYLE_ID);
        if (style) style.textContent = '';
        root.setAttribute('data-ytb-bg_active', 'false');
        // Trigger sync so enhancer.js re-applies its filters
        window.dispatchEvent(new CustomEvent('yt-bettr-sync'));
    };

    // --- Core logic ---
    const enterBgMode = () => {
        if (isInBgMode) return;
        isInBgMode = true;
        forceMinQuality();
        killVisuals();
    };

    const exitBgMode = () => {
        if (!isInBgMode) return;
        isInBgMode = false;
        restoreQuality();
        restoreVisuals();
    };

    document.addEventListener('visibilitychange', () => {
        const bgEnabled = getB('bg_audio');
        const pauseEnabled = getB('hidden_pause');

        if (document.hidden) {
            // hidden_pause takes priority (full stop)
            if (pauseEnabled) return;
            if (bgEnabled) enterBgMode();
        } else {
            if (isInBgMode) exitBgMode();
        }
    });
})();
