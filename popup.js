/**
 * popup.js — yt bettr
 * Handles the logic for the Affinity-inspired interactive UI.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check hardware for High mode preset
    getHardwareCapabilities().then(hw => {
        window.hwCaps = hw;
        initUI();
    });
});

async function getHardwareCapabilities() {
    let hw = { av1: false, vp9: false, h264: true };
    if (!navigator.mediaCapabilities) return hw;
    
    try {
        const testRes = { width: 1920, height: 1080, bitrate: 5000000, framerate: 30 };
        const av1 = await navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: 'video/mp4; codecs="av01.0.05M.08"', ...testRes }});
        const vp9 = await navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: 'video/webm; codecs="vp09.00.10.08"', ...testRes }});
        hw.av1 = av1.supported && av1.powerEfficient;
        hw.vp9 = vp9.supported && (hw.av1 ? true : vp9.powerEfficient);
    } catch (e) {
        console.warn("yt bettr: HW detection failed", e);
    }
    return hw;
}

const TOGGLE_MAP = [
    { id: 'feat_ambient_off',    key: 'ambient_off',     def: true  },
    { id: 'feat_thumb_static',   key: 'thumb_static',    def: true  },
    { id: 'feat_hidden_pause',   key: 'hidden_pause',    def: false },
    { id: 'feat_thumb_lowres',   key: 'thumb_lowres',    def: false },
    { id: 'feat_block_60fps',    key: 'max_fps',         def: false, transform: (v) => v ? 30 : 60, rev: (v) => v === 30 },
    { id: 'feat_disable_ln',     key: 'disable_ln',      def: false },
    { id: 'feat_disable_ai_dub', key: 'disable_ai_dub',  def: true  },
    { id: 'feat_eco_ui',         key: 'eco_ui',          def: false },
    { id: 'feat_no_transparency',key: 'no_transparency', def: false },
    { id: 'feat_ab_experiments', key: 'ab_experiments',  def: false },
    { id: 'feat_hide_comments',  key: 'hide_comments',   def: false },
    { id: 'feat_hide_shorts',    key: 'hide_shorts',     def: false },
    { id: 'feat_bg_audio',       key: 'bg_audio',        def: false },
    { id: 'feat_enhance_hdr',       key: 'enhance_hdr',       def: false },
    { id: 'feat_enhance_sharpness', key: 'enhance_sharpness', def: false },
    { id: 'feat_enhance_grain',     key: 'enhance_grain',     def: false },
    { id: 'feat_enhance_audio',     key: 'enhance_audio',     def: false }
];

function initUI() {
    // Defaults & Storage Load
    const keys = TOGGLE_MAP.map(t => t.key).concat(['max_res', 'theme', 'run_mode', 'grain_intensity', 'block_av1', 'block_vp9', 'block_h264', 'block_opus']);
    
    chrome.storage.local.get(keys, (stored) => {
        let currentMode = stored.run_mode || 'custom';
        
        // Setup Toggles
        TOGGLE_MAP.forEach(t => {
            const el = document.getElementById(t.id);
            if (!el) return;
            const val = stored[t.key] !== undefined ? stored[t.key] : t.def;
            el.checked = t.rev ? t.rev(val) : !!val;
            
            // Sync on change
            el.addEventListener('change', () => {
                const checked = el.checked;
                chrome.storage.local.set({ [t.key]: t.transform ? t.transform(checked) : checked });
                if (currentMode !== 'custom') setMode('custom');
                updateStatusbar();
                updateCounts();
                handleGrainSlider();
            });

            // Card click area helper
            const card = el.closest('.toggle-card');
            if (card) {
                card.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('slider')) {
                        el.click();
                    }
                });
            }
        });

        // Setup Segments (Res, Codec, Audio)
        setupSegment('seg_res', 'ind_res', parseResFromStored(stored), (val) => {
            chrome.storage.local.set(resToStored(val));
            if (currentMode !== 'custom') setMode('custom');
            updateStatusbar();
        });
        
        setupSegment('seg_codec', 'ind_codec', parseCodecFromStored(stored), (val) => {
            chrome.storage.local.set(codecToStored(val));
            if (currentMode !== 'custom') setMode('custom');
            updateStatusbar();
        });

        setupSegment('seg_audio', 'ind_audio', stored.block_opus === true ? 'mp4a' : 'opus', (val) => {
            chrome.storage.local.set({ block_opus: val === 'mp4a', block_mp4a: false });
            if (currentMode !== 'custom') setMode('custom');
        });

        // Setup Mode Cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                setMode(mode);
                applyPresets(mode);
            });
        });

        // Select Initial Mode
        setMode(currentMode, false);

        // Accordions Setup
        document.querySelectorAll('.accordion').forEach(acc => {
            const header = acc.querySelector('.acc-header');
            const content = acc.querySelector('.acc-content');
            const inner = acc.querySelector('.acc-inner');
            
            header.addEventListener('click', () => {
                const isOpen = acc.classList.contains('open');
                // Optional: collapse all others
                // document.querySelectorAll('.accordion').forEach(other => {
                //    other.classList.remove('open');
                //    other.querySelector('.acc-content').style.maxHeight = null;
                //});
                
                if (!isOpen) {
                    acc.classList.add('open');
                    content.style.maxHeight = inner.offsetHeight + 20 + 'px'; // + buffer
                    setTimeout(() => { if (acc.classList.contains('open')) content.style.maxHeight = 'fit-content'; }, 300);
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    setTimeout(() => {
                        acc.classList.remove('open');
                        content.style.maxHeight = null;
                    }, 10);
                }
            });
        });

        window.addEventListener('resize', () => {
            document.querySelectorAll('.accordion.open .acc-content').forEach(c => {
                c.style.maxHeight = 'fit-content';
            });
            updateAllSegments();
        });

        // Theme Toggle
        const themes = ['dark', 'light', 'amoled'];
        const icons = ['🌙', '☀️', '⬛'];
        const btnTheme = document.getElementById('btn_theme');
        let tIdx = themes.indexOf(stored.theme || 'dark');
        if (tIdx === -1) tIdx = 0;
        
        const applyTheme = (idx) => {
            document.documentElement.setAttribute('data-theme', themes[idx]);
            btnTheme.textContent = icons[idx];
            btnTheme.style.transform = `rotate(${idx*180}deg)`;
        };
        
        applyTheme(tIdx);
        
        btnTheme.addEventListener('click', () => {
            tIdx = (tIdx + 1) % themes.length;
            applyTheme(tIdx);
            chrome.storage.local.set({ theme: themes[tIdx] });
        });

        // Grain Slider
        const grainSlider = document.getElementById('feat_grain_intensity');
        const grainVal = document.getElementById('grain_val');
        grainSlider.value = stored.grain_intensity || 15;
        grainVal.textContent = grainSlider.value;
        handleGrainSlider();
        
        grainSlider.addEventListener('input', () => {
            grainVal.textContent = grainSlider.value;
            chrome.storage.local.set({ grain_intensity: parseInt(grainSlider.value) });
        });

        // Initial Updates
        updateCounts();
        updateStatusbar();
        // Give layout time before setting initial indicator positions
        setTimeout(updateAllSegments, 50);
    });
}

// === Segmented Control Logic ===
const segState = {};
function setupSegment(containerId, indicatorId, initialValue, onChange) {
    const parent = document.getElementById(containerId);
    const ind = document.getElementById(indicatorId);
    const items = parent.querySelectorAll('.seg-item');
    
    segState[containerId] = initialValue;

    items.forEach(item => {
        item.addEventListener('click', () => {
            const val = item.dataset.val;
            segState[containerId] = val;
            updateSegmentVisual(containerId);
            onChange(val);
        });
    });
}

function updateAllSegments() {
    Object.keys(segState).forEach(k => updateSegmentVisual(k));
}

function updateSegmentVisual(containerId) {
    const parent = document.getElementById(containerId);
    const val = segState[containerId];
    const ind = parent.querySelector('.seg-indicator');
    const items = parent.querySelectorAll('.seg-item');
    
    let target = null;
    items.forEach(i => {
        i.classList.remove('active');
        if (i.dataset.val === val) {
            target = i;
            i.classList.add('active');
        }
    });

    if (target) {
        ind.style.width = target.offsetWidth + 'px';
        ind.style.transform = `translateX(${target.offsetLeft - 3}px)`; // -3px for parent padding
    }
}


function setMode(mode, save = true) {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    document.getElementById('mode_' + mode).classList.add('active');
    if (save) {
        chrome.storage.local.set({ run_mode: mode });
        updateStatusbar(mode);
    }
}

function applyPresets(mode) {
    if (mode === 'custom') return; // Do nothing, keep current state
    
    let updates = {};
    const HW = window.hwCaps;

    if (mode === 'lite') {
        updates = {
            block_av1: true,
            block_vp9: true,
            block_h264: false,
            block_opus: true,
            max_res: '480p',
            max_fps: 30,
            ambient_off: true,
            disable_ln: true,
            eco_ui: true,
            no_transparency: true,
            thumb_static: true,
            thumb_lowres: true,
            ab_experiments: true,
            hide_comments: true,
            hide_shorts: true,
            bg_audio: true,
            enhance_hdr: false,
            enhance_sharpness: false,
            enhance_grain: false,
            enhance_audio: false
        };
        segState['seg_res'] = '480p';
        segState['seg_codec'] = 'h264';
        segState['seg_audio'] = 'mp4a';
    } else if (mode === 'high') {
        const bestVideoCodec = HW.av1 ? false : (HW.vp9 ? true : true);
        updates = {
            block_av1: bestVideoCodec,
            block_vp9: HW.av1 ? true : !HW.vp9,
            block_h264: false,
            block_opus: false,
            max_res: 'highest',
            max_fps: 60,
            ambient_off: false,
            disable_ln: false,
            eco_ui: false,
            no_transparency: false,
            thumb_static: false,
            thumb_lowres: false,
            ab_experiments: false,
            hide_comments: false,
            hide_shorts: false,
            bg_audio: false,
            enhance_hdr: true,
            enhance_sharpness: true,
            enhance_grain: true,
            enhance_audio: true
        };
        segState['seg_res'] = 'highest';
        segState['seg_codec'] = HW.av1 ? 'av1' : (HW.vp9 ? 'vp9' : 'h264');
        segState['seg_audio'] = 'opus';
    }

    chrome.storage.local.set(updates, () => {
        // Sync toggles visually
        TOGGLE_MAP.forEach(t => {
            const el = document.getElementById(t.id);
            if (el && updates[t.key] !== undefined) {
                el.checked = t.rev ? t.rev(updates[t.key]) : !!updates[t.key];
            }
        });
        updateAllSegments();
        updateCounts();
        handleGrainSlider();
    });
}

function updateCounts() {
    const videoCount = [document.getElementById('feat_block_60fps').checked].filter(Boolean).length;
    document.getElementById('count_video').textContent = videoCount > 0 ? `${videoCount} on` : '--';
    
    const audioCount = [document.getElementById('feat_disable_ln').checked, document.getElementById('feat_disable_ai_dub').checked].filter(Boolean).length;
    document.getElementById('count_audio').textContent = audioCount > 0 ? `${audioCount} on` : '--';
    
    let optCount = 0;
    ['feat_thumb_static', 'feat_thumb_lowres', 'feat_ambient_off', 'feat_no_transparency', 'feat_eco_ui', 'feat_hide_comments', 'feat_hide_shorts', 'feat_hidden_pause', 'feat_bg_audio', 'feat_ab_experiments'].forEach(id => {
        if (document.getElementById(id).checked) optCount++;
    });
    document.getElementById('count_opt').textContent = optCount > 0 ? `${optCount}/10` : '--';

    let premCount = 0;
    ['feat_enhance_hdr', 'feat_enhance_sharpness', 'feat_enhance_grain', 'feat_enhance_audio'].forEach(id => {
        if (document.getElementById(id).checked) premCount++;
    });
    document.getElementById('count_premium').textContent = premCount > 0 ? `${premCount}/4` : '--';
}

function handleGrainSlider() {
    const s = document.getElementById('grain_slider_cont');
    s.style.display = document.getElementById('feat_enhance_grain').checked ? 'flex' : 'none';
    if (s.style.display === 'flex') {
        const acc = document.getElementById('acc_premium');
        if (acc.classList.contains('open')) {
            const inner = acc.querySelector('.acc-inner');
            acc.querySelector('.acc-content').style.maxHeight = inner.offsetHeight + 20 + 'px';
        }
    }
}

function updateStatusbar(overrideMode = null) {
    chrome.storage.local.get(['run_mode'], (st) => {
        const mode = overrideMode || st.run_mode || 'custom';
        const mSpan = document.getElementById('status_mode');
        mSpan.innerHTML = `Modo: <span class="status-accent">${mode.charAt(0).toUpperCase() + mode.slice(1)}</span>`;
        
        let cText = segState['seg_codec'] || 'H.264';
        cText = cText.toUpperCase();
        document.getElementById('status_codec').textContent = `Codec: ${cText}`;
    });
}

// Convert DB values to SegState
function parseResFromStored(stored) {
    if (!stored.max_res || stored.max_res === 'auto') return 'auto';
    return stored.max_res;
}
function resToStored(val) {
    return { max_res: val === 'auto' ? null : val };
}
function parseCodecFromStored(stored) {
    if (stored.block_av1 === false && stored.block_vp9 === true) return 'av1';
    if (stored.block_vp9 === false && stored.block_av1 === true && stored.block_h264 === true) return 'vp9'; // strictly VP9
    if (stored.block_av1 === true && stored.block_vp9 === false) return 'vp9'; // effectively VP9 prefered
    return 'h264';
}
function codecToStored(val) {
    if (val === 'av1')  return { block_av1: false, block_vp9: true,  block_h264: false };
    if (val === 'vp9')  return { block_av1: true,  block_vp9: false, block_h264: false };
    if (val === 'h264') return { block_av1: true,  block_vp9: true,  block_h264: false };
    return { block_av1: true, block_vp9: true, block_h264: false };
}
