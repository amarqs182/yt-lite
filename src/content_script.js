/**
 * src/content_script.js
 *
 * 1. Loads settings from chrome.storage.local
 * 2. Syncs them to the MAIN world's localStorage (since features run in MAIN)
 * 3. Dispatches event for live-sync without reload
 */

const DEFAULTS = {
    block_av1:      true,
    block_vp9:      true,
    block_h264:     false,
    block_opus:     false,
    max_res:        'auto',
    max_fps:        'auto',
    ambient_off:    true,
    thumb_static:   true,
    thumb_lowres:   false,
    pause_loops:    true,
    hidden_pause:   false,
    disable_ln:     false,
    disable_ai_dub: true,
    eco_ui:         false,
    no_transparency: false,
    ab_experiments: false,
    theme:          'dark',
    enhance_sharpness: false,
    enhance_hdr:       false,
    enhance_audio:     false,
    run_mode:          'lite'
};

// Function to inject settings into the Page's context (MAIN world)
const injectToMainWorld = (settings) => {
    const script = document.createElement('script');
    script.textContent = `
        (() => {
            const data = ${JSON.stringify(settings)};
            for (const [k, v] of Object.entries(data)) {
                localStorage.setItem('ytl-' + k, String(v));
            }
            window.dispatchEvent(new CustomEvent('yt-lite-settings-updated'));
        })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
};

// Initial Sync
chrome.storage.local.get(null, (stored) => {
    const opts = { ...DEFAULTS, ...stored };
    injectToMainWorld(opts);
});

// Live Sync on change
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const updates = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
        updates[key] = newValue;
    }
    injectToMainWorld(updates);
});
