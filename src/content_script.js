/**
 * src/content_script.js
 *
 * 1. Loads settings from chrome.storage.local
 * 2. Writes them to localStorage (synchronous, readable by injected scripts)
 * 3. Injects features into the page's main world
 * 4. Uses chrome.storage.onChanged to live-sync localStorage when popup changes a setting
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

// Step 1 + 2: Read storage → write localStorage
chrome.storage.local.get(null, (stored) => {
    const opts = { ...DEFAULTS, ...stored };
    for (const [k, v] of Object.entries(opts)) {
        localStorage['ytl-' + k] = String(v);
    }
});

// Step 4: Live-sync on any storage change
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
        localStorage['ytl-' + key] = String(newValue);
    }
    
    // Dispatch custom event to notify injected scripts immediately
    const script = document.createElement('script');
    script.textContent = `window.dispatchEvent(new CustomEvent('yt-lite-settings-updated'));`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
});
