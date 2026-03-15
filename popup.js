/**
 * popup.js — YT Lite
 * Horizontal buttons logic.
 */

const TOGGLE_MAP = [
    { id: 'feat_ambient_off',    key: 'ambient_off',     def: true  },
    { id: 'feat_hidden_pause',   key: 'hidden_pause',    def: false },
    { id: 'feat_disable_ln',     key: 'disable_ln',      def: false },
    { id: 'feat_disable_ai_dub', key: 'disable_ai_dub',  def: true  },
    { id: 'feat_eco_ui',         key: 'eco_ui',          def: false },
    { id: 'feat_ab_experiments', key: 'ab_experiments',  def: false },
];

const SELECT_MAP = [
    { id: 'feat_max_res',        key: 'max_res',         def: 'auto' }
];

const DEFAULTS = {
    block_av1: true, block_vp9: true, block_h264: false, block_opus: false,
    max_fps: 'auto', theme: 'dark'
};
TOGGLE_MAP.forEach(t => DEFAULTS[t.key] = t.def);
SELECT_MAP.forEach(s => DEFAULTS[s.key] = s.def);

document.addEventListener('DOMContentLoaded', () => {

    const hwLabel = document.getElementById('hw_support_label');
    document.getElementById('btn_detect_hw')?.addEventListener('click', async (e) => {
        e.target.textContent = "...";
        let results = [];
        if (navigator.mediaCapabilities) {
            const check = async (codec, label) => {
                try {
                    const res = await navigator.mediaCapabilities.decodingInfo({
                        type: 'media-source',
                        video: { contentType: `video/mp4; codecs="${codec}"`, width: 1920, height: 1080, bitrate: 5000000, framerate: 30 }
                    });
                    results.push(`${label}: ${res.powerEfficient ? '✅' : '⚠️'}`);
                } catch(e) {}
            };
            await check('av01.0.05M.08', 'AV1');
            await check('vp09.00.10.08', 'VP9');
            await check('avc1.640028', 'H264');
        }
        hwLabel.innerHTML = results.join(' | ') + ' <br><small>(✅ HW | ⚠️ SW)</small>';
        hwLabel.style.display = 'block';
        e.target.textContent = "Testado";
    });

    chrome.storage.local.get(DEFAULTS, (stored) => {
        // Toggles
        TOGGLE_MAP.forEach(({id, key}) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.checked = stored[key];
            el.addEventListener('change', () => chrome.storage.local.set({ [key]: el.checked }));
        });

        // Selects
        SELECT_MAP.forEach(({id, key}) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = stored[key];
            el.addEventListener('change', () => chrome.storage.local.set({ [key]: el.value }));
        });

        // Segmented: Codecs
        const setupSegmented = (groupId, storageKey, isMulti = false) => {
            const container = document.getElementById(groupId);
            if (!container) return;
            const buttons = container.querySelectorAll('.segment-btn');
            
            const updateUI = () => {
                buttons.forEach(btn => {
                    const key = btn.dataset.key;
                    if (key) {
                        const isBlocked = stored[key] === true || stored[key] === 'true';
                        // Button Active = NOT blocked
                        if (isBlocked) btn.classList.remove('active');
                        else btn.classList.add('active');
                    } else if (btn.dataset.val) {
                        if (stored[storageKey] === btn.dataset.val) btn.classList.add('active');
                        else btn.classList.remove('active');
                    }
                });
            };

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.key) {
                        const key = btn.dataset.key;
                        const newState = !btn.classList.contains('active'); // If we make it active, block = false
                        
                        // Safety: at least one codec
                        if (!newState && isMulti) {
                            const activeCount = container.querySelectorAll('.segment-btn.active').length;
                            if (activeCount <= 1) return;
                        }

                        stored[key] = !newState;
                        chrome.storage.local.set({ [key]: !newState });
                        updateUI();
                    } else if (btn.dataset.val) {
                        const val = btn.dataset.val;
                        stored[storageKey] = val;
                        chrome.storage.local.set({ [storageKey]: val });
                        updateUI();
                    }
                });
            });
            updateUI();
        };

        setupSegmented('group_video_codecs', null, true);
        setupSegmented('group_max_fps', 'max_fps');
        setupSegmented('group_audio_codecs');

        // Theme
        const ts = document.getElementById('theme_selector');
        ts.value = stored.theme;
        document.documentElement.setAttribute('data-theme', stored.theme);
        ts.addEventListener('change', () => {
            document.documentElement.setAttribute('data-theme', ts.value);
            chrome.storage.local.set({ theme: ts.value });
        });
    });

    // Terminal
    const logOutput = document.getElementById('log_output');
    try {
        const port = chrome.runtime.connect({ name: 'yt-lite-debug' });
        port.onMessage.addListener((msg) => {
            if (msg.type === 'history' || msg.type === 'new_log') {
                const logs = msg.type === 'history' ? msg.logs : [msg.log];
                logs.forEach(l => {
                    const line = document.createElement('div');
                    line.className = 't-line';
                    line.innerHTML = `<span class="t-time">[${l.ts}]</span> <span class="t-blocked">${l.ruleId === 3 ? 'LOG' : 'STATS'}</span> blocked`;
                    logOutput.prepend(line);
                });
            }
        });
    } catch(e) {}
});