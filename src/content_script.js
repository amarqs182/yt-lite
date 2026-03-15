/**
 * src/content_script.js
 *
 * 1. Loads settings from chrome.storage.local
 * 2. Writes them to localStorage (synchronous, readable by injected scripts)
 * 3. Injects codec.js into the page's main world
 * 4. Uses chrome.storage.onChanged to live-sync localStorage when popup changes a setting
 *    Ref: developer.chrome.com/docs/extensions/reference/api/storage#event-onChanged
 */

const DEFAULTS = {
    block_av1:      true,
    block_vp9:      true,
    block_h264:     false,
    block_opus:     false,
    block_60fps:    true,
    max_720p:       false,
    ambient_off:    true,
    thumb_static:   true,
    thumb_lowres:   false,
    pause_loops:    true,
    hidden_pause:   false,
    disable_ln:     false,
    disable_ai_dub: true,
    eco_ui:         false,
    ab_experiments: false,
};

// Step 1 + 2: Read storage → write localStorage
// The actual feature scripts (codec.js, ambient.js, quality.js) are injected natively via manifest.json
chrome.storage.local.get(DEFAULTS, (opts) => {
    for (const [k, v] of Object.entries(opts)) {
        localStorage['ytl-' + k] = String(v);
    }
});

// Step 4: Live-sync on any storage change (popup toggle, etc.)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in DEFAULTS) {
            localStorage['ytl-' + key] = String(newValue);
        }
    }
});


