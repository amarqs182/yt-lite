/**
 * src/content_script.js
 *
 * Isolated World.
 * Syncs storage to DOM attributes.
 */

console.log("yt bettr: Content Script Loaded");
document.documentElement.setAttribute('data-ytb-cs-loaded', 'true');

const keys = [
    'block_av1', 'block_vp9', 'block_h264', 'block_opus',
    'max_res', 'max_fps', 'ambient_off', 'thumb_static',
    'thumb_lowres', 'pause_loops', 'hidden_pause', 'disable_ln',
    'disable_ai_dub', 'eco_ui', 'no_transparency', 'ab_experiments',
    'hide_comments', 'hide_shorts', 'bg_audio',
    'theme', 'enhance_sharpness', 'enhance_hdr', 'enhance_audio',
    'enhance_grain', 'grain_intensity', 'run_mode'
];

const sync = (data) => {
    console.log("yt bettr: Syncing data to DOM", data);
    for (const [k, v] of Object.entries(data)) {
        document.documentElement.setAttribute('data-ytb-' + k, String(v));
    }
    window.dispatchEvent(new CustomEvent('yt-bettr-sync'));
};

chrome.storage.local.get(keys, (stored) => {
    if (chrome.runtime.lastError) {
        console.error("yt bettr: Storage Error", chrome.runtime.lastError);
        return;
    }
    sync(stored);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const updates = {};
    for (const k of keys) {
        if (changes[k]) updates[k] = changes[k].newValue;
    }
    sync(updates);
});
