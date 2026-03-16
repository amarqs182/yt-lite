/**
 * popup.js — yt bettr
 * Mode Selection: Lite | High | Custom
 * Slider handling for Grain intensity.
 */

const TOGGLE_MAP = [
    { id: 'feat_ambient_off',    key: 'ambient_off',     def: true  },
    { id: 'feat_hidden_pause',   key: 'hidden_pause',    def: false },
    { id: 'feat_thumb_lowres',   key: 'thumb_lowres',    def: false },
    { id: 'feat_disable_ln',     key: 'disable_ln',      def: false },
    { id: 'feat_disable_ai_dub', key: 'disable_ai_dub',  def: true  },
    { id: 'feat_eco_ui',         key: 'eco_ui',          def: false },
    { id: 'feat_no_transparency',key: 'no_transparency', def: false },
    { id: 'feat_ab_experiments', key: 'ab_experiments',  def: false },
    { id: 'feat_enhance_hdr',       key: 'enhance_hdr',       def: false },
    { id: 'feat_enhance_sharpness', key: 'enhance_sharpness', def: false },
    { id: 'feat_enhance_grain',     key: 'enhance_grain',     def: false },
    { id: 'feat_enhance_audio',     key: 'enhance_audio',     def: false },
];

const SELECT_MAP = [
    { id: 'feat_max_res',        key: 'max_res',         def: 'auto' }
];

// Added slider mapping
const SLIDER_MAP = [
    { id: 'feat_grain_intensity', key: 'grain_intensity', def: 15, labelId: 'grain_val' }
];

const DEFAULTS = {
    block_av1: true, block_vp9: true, block_h264: false, block_opus: false,
    max_fps: 'auto', theme: 'dark', run_mode: 'lite', first_run: true
};
TOGGLE_MAP.forEach(t => DEFAULTS[t.key] = t.def);
SELECT_MAP.forEach(s => DEFAULTS[s.key] = s.def);
SLIDER_MAP.forEach(s => DEFAULTS[s.key] = s.def);

document.addEventListener('DOMContentLoaded', () => {

    const hwLabel = document.getElementById('hw_support_label');
    const smartStatus = document.getElementById('smart_status');
    const mainScroll = document.getElementById('main_scroll');

    // --- AUTO OPTIMIZATION ENGINE ---
    async function getHardwareCapabilities() {
        if (!navigator.mediaCapabilities) return { av1: false, vp9: false, h264: true };
        const check = async (codec) => {
            try {
                const res = await navigator.mediaCapabilities.decodingInfo({
                    type: 'media-source',
                    video: { contentType: `video/mp4; codecs="${codec}"`, width: 1920, height: 1080, bitrate: 5000000, framerate: 30 }
                });
                return res.powerEfficient;
            } catch(e) { return false; }
        };
        return {
            av1: await check('av01.0.05M.08'),
            vp9: await check('vp09.00.10.08'),
            h264: await check('avc1.640028')
        };
    }

    async function applyModeSettings(mode) {
        if (mode === 'custom') {
            mainScroll.classList.remove('smart-active');
            smartStatus.textContent = "Controle manual ativado.";
            return;
        }

        mainScroll.classList.add('smart-active');
        const hw = await getHardwareCapabilities();
        const updates = {};

        if (mode === 'lite') {
            updates.block_av1 = true;
            updates.block_vp9 = true;
            updates.block_h264 = false;
            updates.block_opus = true; 
            updates.max_res = '480';
            updates.max_fps = '30';
            updates.ambient_off = true;
            updates.no_transparency = true;
            updates.eco_ui = true;
            updates.thumb_lowres = true;
            updates.enhance_hdr = false;
            updates.enhance_sharpness = false;
            updates.enhance_grain = false;
            updates.enhance_audio = false;
            smartStatus.textContent = "H.264/480p/30fps + Eco UI.";
        } else if (mode === 'high') {
            updates.block_av1 = !hw.av1;
            updates.block_vp9 = false;
            updates.block_h264 = false;
            updates.block_opus = false; 
            updates.max_res = 'auto';
            updates.max_fps = 'auto';
            updates.ambient_off = false;
            updates.no_transparency = false;
            updates.eco_ui = false;
            updates.thumb_lowres = false;
            updates.enhance_hdr = true;
            updates.enhance_sharpness = true;
            updates.enhance_grain = true;
            updates.enhance_audio = true;
            smartStatus.textContent = "AV1/VP9/Opus + Filtros Premium.";
        }

        chrome.storage.local.set(updates);
    }

    // --- INITIALIZATION ---
    chrome.storage.local.get(DEFAULTS, async (stored) => {
        
        if (stored.first_run) {
            await applyModeSettings('lite');
            chrome.storage.local.set({ first_run: false, run_mode: 'lite' });
            stored.run_mode = 'lite';
        }

        // Apply Mode UI
        const updateModeUI = (mode) => {
            const container = document.getElementById('group_run_mode');
            container.querySelectorAll('.segment-btn').forEach(btn => {
                if (btn.dataset.val === mode) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            if (mode === 'custom') mainScroll.classList.remove('smart-active');
            else mainScroll.classList.add('smart-active');
            applyModeSettings(mode);
        };

        updateModeUI(stored.run_mode);

        // Wire Mode Buttons
        document.getElementById('group_run_mode').querySelectorAll('.segment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newMode = btn.dataset.val;
                chrome.storage.local.set({ run_mode: newMode });
                updateModeUI(newMode);
            });
        });

        // --- WIRE TOGGLES ---
        TOGGLE_MAP.forEach(({id, key}) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.checked = stored[key];
            el.addEventListener('change', () => chrome.storage.local.set({ [key]: el.checked }));
        });

        // --- WIRE SELECTS ---
        SELECT_MAP.forEach(({id, key}) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = stored[key];
            el.addEventListener('change', () => chrome.storage.local.set({ [key]: el.value }));
        });

        // --- WIRE SLIDERS ---
        SLIDER_MAP.forEach(({id, key, labelId}) => {
            const el = document.getElementById(id);
            const lbl = document.getElementById(labelId);
            if (!el) return;
            el.value = stored[key];
            if (lbl) lbl.textContent = el.value;
            el.addEventListener('input', () => {
                if (lbl) lbl.textContent = el.value;
                chrome.storage.local.set({ [key]: parseInt(el.value, 10) });
            });
        });

        // --- WIRE SEGMENTED CONTROLS ---
        const setupSegmented = (groupId, storageKey, isMulti = false) => {
            const container = document.getElementById(groupId);
            if (!container) return;
            
            const refreshButtons = () => {
                chrome.storage.local.get(null, (latest) => {
                    container.querySelectorAll('.segment-btn').forEach(btn => {
                        const key = btn.dataset.key;
                        const val = btn.dataset.val;
                        if (key) {
                            const isBlocked = latest[key] === true || latest[key] === 'true';
                            if (isBlocked) btn.classList.remove('active');
                            else btn.classList.add('active');
                        } else if (val) {
                            if (groupId === 'group_audio_codecs') {
                                const blockOpus = latest['block_opus'] === true || latest['block_opus'] === 'true';
                                if ((val === 'opus' && !blockOpus) || (val === 'aac' && blockOpus)) btn.classList.add('active');
                                else btn.classList.remove('active');
                            } else {
                                if (latest[storageKey] === val) btn.classList.add('active');
                                else btn.classList.remove('active');
                            }
                        }
                    });
                });
            };

            container.querySelectorAll('.segment-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.key) {
                        const key = btn.dataset.key;
                        const isCurrentlyActive = btn.classList.contains('active');
                        if (!isCurrentlyActive && isMulti) {
                            const activeCount = container.querySelectorAll('.segment-btn.active').length;
                            if (activeCount <= 1 && btn.classList.contains('active')) return;
                        }
                        chrome.storage.local.set({ [key]: btn.classList.contains('active') }, refreshButtons);
                    } else if (btn.dataset.val) {
                        const val = btn.dataset.val;
                        if (groupId === 'group_audio_codecs') {
                            chrome.storage.local.set({ 'block_opus': (val === 'aac') }, refreshButtons);
                        } else {
                            chrome.storage.local.set({ [storageKey]: val }, refreshButtons);
                        }
                    }
                });
            });

            refreshButtons();
            chrome.storage.onChanged.addListener(refreshButtons);
        };

        setupSegmented('group_video_codecs', null, true);
        setupSegmented('group_max_fps', 'max_fps');
        setupSegmented('group_audio_codecs');

        // HW Manual Test Button
        document.getElementById('btn_detect_hw')?.addEventListener('click', async (e) => {
            e.target.textContent = "...";
            const hw = await getHardwareCapabilities();
            hwLabel.innerHTML = `AV1: ${hw.av1?'✅':'⚠️'} | VP9: ${hw.vp9?'✅':'⚠️'} | H264: ${hw.h264?'✅':'⚠️'}<br><small>(✅ HW | ⚠️ SW)</small>`;
            hwLabel.style.display = 'block';
            e.target.textContent = "Testado";
        });

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
        const port = chrome.runtime.connect({ name: 'yt-bettr-debug' });
        port.onMessage.addListener((msg) => {
            if (msg.type === 'history' || msg.type === 'new_log') {
                if (logOutput.textContent.includes('Aguardando')) logOutput.innerHTML = '';
                const logs = msg.type === 'history' ? msg.logs : [msg.log];
                logs.forEach(l => {
                    const line = document.createElement('div');
                    line.className = 't-line';
                    line.innerHTML = `<span class="t-time">[${l.ts}]</span> <span class="t-blocked">${l.ruleId === 3 ? 'LOG' : 'STATS'}</span> blocked`;
                    logOutput.prepend(line);
                    if (logOutput.children.length > 50) logOutput.lastElementChild.remove();
                });
            }
        });
    } catch(e) {}

    document.getElementById('btn_copy_logs')?.addEventListener('click', () => {
        const lines = Array.from(logOutput.querySelectorAll('.t-line')).map(l => l.innerText);
        if (lines.length === 0 || lines[0].includes('Aguardando')) return;
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            const btn = document.getElementById('btn_copy_logs');
            const oldText = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = oldText, 1000);
        });
    });
});
