/**
 * popup.js — YT Lite
 *
 * Reads settings from chrome.storage.local, wires HTML elements.
 * On change: writes directly to chrome.storage.local — no background relay needed.
 */

// Mapping of input IDs to storage keys
const TOGGLE_MAP = [
    { id: 'feat_ambient_off',    key: 'ambient_off',     def: true  },
    { id: 'feat_thumb_static',   key: 'thumb_static',    def: true  },
    { id: 'feat_hidden_pause',   key: 'hidden_pause',    def: false },
    { id: 'feat_disable_ln',     key: 'disable_ln',      def: false },
    { id: 'feat_disable_ai_dub', key: 'disable_ai_dub',  def: true  },
    { id: 'feat_eco_ui',         key: 'eco_ui',          def: false },
    { id: 'feat_ab_experiments', key: 'ab_experiments',  def: false },
];

const SELECT_MAP = [
    { id: 'feat_video_codec',    key: 'video_codec',     def: 'auto' }, // auto | av1 | vp9 | h264
    { id: 'feat_audio_codec',    key: 'audio_codec',     def: 'auto' }, // auto | aac
    { id: 'feat_max_res',        key: 'max_res',         def: 'auto' }, // auto | 1080 | 720 | 480 | 360 | 144
    { id: 'feat_max_fps',        key: 'max_fps',         def: 'auto' }  // auto | 30
];

const DEFAULTS = {};
TOGGLE_MAP.forEach(t => DEFAULTS[t.key] = t.def);
SELECT_MAP.forEach(s => DEFAULTS[s.key] = s.def);
DEFAULTS['theme'] = 'dark';

document.addEventListener('DOMContentLoaded', () => {

    // HW Detection
    const btnDetectHw = document.getElementById('btn_detect_hw');
    const hwLabel = document.getElementById('hw_support_label');
    
    if (btnDetectHw) {
        btnDetectHw.addEventListener('click', async () => {
            btnDetectHw.textContent = "Testando...";
            let results = [];
            
            if (navigator.mediaCapabilities) {
                try {
                    const av1 = await navigator.mediaCapabilities.decodingInfo({
                        type: 'media-source',
                        video: { contentType: 'video/mp4; codecs="av01.0.05M.08"', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 }
                    });
                    results.push(`AV1: ${av1.powerEfficient ? '✅ Hardware' : (av1.supported ? '⚠️ Software' : '❌ Não')}`);
                } catch(e) {}
                
                try {
                    const vp9 = await navigator.mediaCapabilities.decodingInfo({
                        type: 'media-source',
                        video: { contentType: 'video/mp4; codecs="vp09.00.10.08"', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 }
                    });
                    results.push(`VP9: ${vp9.powerEfficient ? '✅ Hardware' : (vp9.supported ? '⚠️ Software' : '❌ Não')}`);
                } catch(e) {}
                
                try {
                    const h264 = await navigator.mediaCapabilities.decodingInfo({
                        type: 'media-source',
                        video: { contentType: 'video/mp4; codecs="avc1.640028"', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 }
                    });
                    results.push(`H264: ${h264.powerEfficient ? '✅ Hardware' : (h264.supported ? '⚠️ Software' : '❌ Não')}`);
                } catch(e) {}
            }
            
            hwLabel.innerHTML = `<strong>Suporte Físico (GPU):</strong><br>${results.join('<br>')}<br><br><em>(Evite forçar codecs marcados como Software/Não)</em>`;
            hwLabel.style.display = 'block';
            btnDetectHw.textContent = "Testado!";
        });
    }

    // Load all settings and initialize UI
    chrome.storage.local.get(DEFAULTS, (stored) => {
        
        // Initialize Toggles
        for (const { id, key } of TOGGLE_MAP) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.checked = stored[key];
            el.addEventListener('change', () => {
                chrome.storage.local.set({ [key]: el.checked });
            });
        }

        // Initialize Selects
        for (const { id, key } of SELECT_MAP) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.value = stored[key];
            el.addEventListener('change', () => {
                chrome.storage.local.set({ [key]: el.value });
            });
        }

        // Theme initialization
        const themeSelector = document.getElementById('theme_selector');
        if (themeSelector) {
            themeSelector.value = stored['theme'];
            document.documentElement.setAttribute('data-theme', stored['theme']);
            
            themeSelector.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                document.documentElement.setAttribute('data-theme', newTheme);
                chrome.storage.local.set({ 'theme': newTheme });
            });
        }
    });

    // --- DEBUG TERMINAL LOGIC ---
    const logOutput = document.getElementById('log_output');
    const btnCopy = document.getElementById('btn_copy_logs');
    let allLogs = [];

    function renderLogs() {
        if (!logOutput) return;
        if (allLogs.length === 0) {
            logOutput.innerHTML = '<div class="t-line">Aguardando telemetria...</div>';
            return;
        }

        let html = '';
        const ruleNames = { 1: "QOE", 2: "ADS", 3: "LOG" };

        allLogs.forEach(l => {
            const isError = l.ruleId === 3; 
            const ruleClass = isError ? 't-error' : 't-blocked';
            const ruleName = ruleNames[l.ruleId] || `R${l.ruleId}`;
            html += `<div class="t-line"><span class="t-time">[${l.ts}]</span> <span class="${ruleClass}">${ruleName}</span> blocked</div>`;
        });
        logOutput.innerHTML = html;
    }

    try {
        const port = chrome.runtime.connect({ name: 'yt-lite-debug' });
        port.onMessage.addListener((msg) => {
            if (msg.type === 'history') {
                allLogs = msg.logs;
                renderLogs();
            } else if (msg.type === 'new_log') {
                allLogs.unshift(msg.log);
                if (allLogs.length > 50) allLogs.pop();
                renderLogs();
            }
        });
    } catch(e) {}

    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            if (allLogs.length === 0) return;
            const textToCopy = allLogs.map(l => `[${l.ts}] Rule ${l.ruleId} BLOCKED ${l.type}: ${l.url}`).join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const oldIcon = btnCopy.textContent;
                btnCopy.textContent = 'Copied!';
                setTimeout(() => { btnCopy.textContent = oldIcon; }, 1500);
            });
        });
    }
});