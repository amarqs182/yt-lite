/**
 * popup.js — YT Lite
 *
 * Reads settings from chrome.storage.local, wires HTML toggles.
 * On change: writes directly to chrome.storage.local — no background relay needed.
 * content_script.js picks up changes via chrome.storage.onChanged automatically.
 *
 * Ref: developer.chrome.com/docs/extensions/reference/api/storage
 */

// HTML element ID → storage key + default value
const TOGGLE_MAP = [
    { id: 'feat_block_av1',      key: 'block_av1',       def: true  },
    { id: 'feat_block_vp9',      key: 'block_vp9',       def: true  },
    { id: 'feat_block_h264',     key: 'block_h264',      def: false },
    { id: 'feat_block_opus',     key: 'block_opus',      def: false },
    { id: 'feat_30fps_cap',      key: 'block_60fps',     def: true  },
    { id: 'feat_max_720p',       key: 'max_720p',        def: false },
    { id: 'feat_ambient_off',    key: 'ambient_off',     def: true  },
    { id: 'feat_thumb_static',   key: 'thumb_static',    def: true  },
    { id: 'feat_thumb_lowres',   key: 'thumb_lowres',    def: false },
    { id: 'feat_pause_loops',    key: 'pause_loops',     def: true  },
    { id: 'feat_hidden_pause',   key: 'hidden_pause',    def: false },
    { id: 'feat_disable_ln',     key: 'disable_ln',      def: false },
    { id: 'feat_disable_ai_dub', key: 'disable_ai_dub',  def: true  },
    { id: 'feat_eco_ui',         key: 'eco_ui',          def: false },
    { id: 'feat_ab_experiments', key: 'ab_experiments',  def: false },
];

const DEFAULTS = Object.fromEntries(TOGGLE_MAP.map(t => [t.key, t.def]));

document.addEventListener('DOMContentLoaded', () => {

    // HW Detection
    const btnDetectHw = document.getElementById('btn_detect_hw');
    const hwLabel = document.getElementById('hw_support_label');
    
    if (btnDetectHw) {
        btnDetectHw.addEventListener('click', async () => {
            btnDetectHw.textContent = "Testando...";
            let results = [];
            
            // Check AV1
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
            
            hwLabel.innerHTML = `<strong>Decodificação do seu PC:</strong><br>${results.join('<br>')}<br><br><em>(Dica: Se aparecer 'Software' ou 'Não', bloqueie o codec acima para evitar superaquecimento).</em>`;
            hwLabel.style.display = 'block';
            btnDetectHw.textContent = "Testado!";
        });
    }

    // Load all settings and initialize toggles
    // Ref: developer.chrome.com/docs/extensions/reference/api/storage#method-StorageArea-get
    chrome.storage.local.get({ ...DEFAULTS, theme: 'dark' }, (stored) => {
        for (const { id, key, def } of TOGGLE_MAP) {
            const el = document.getElementById(id);
            if (!el) continue;

            el.checked = stored[key] ?? def;

            // Write directly to storage — content_script reacts via onChanged
            el.addEventListener('change', () => {
                chrome.storage.local.set({ [key]: el.checked });
            });
        }

        // Theme initialization
        const themeSelector = document.getElementById('theme_selector');
        if (themeSelector) {
            const currentTheme = stored['theme'] || 'dark';
            themeSelector.value = currentTheme;
            document.documentElement.setAttribute('data-theme', currentTheme);
            
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
            logOutput.innerHTML = '<div class="t-line t-empty">Aguardando bloqueios (recarregue a página)... <span class="t-cursor"></span></div>';
            return;
        }

        let html = '';
        const ruleNames = {
            1: "QOE_STATS",
            2: "ADS_STATS",
            3: "LOG_EVENT"
        };

        allLogs.forEach(l => {
            const ruleColor = l.ruleId === 3 ? 'error' : 'warn'; 
            const ruleName = ruleNames[l.ruleId] || `RULE_${l.ruleId}`;
            html += `<div class="t-line"><span class="t-ts">[${l.ts}]</span> <span class="t-msg ${ruleColor}">[${ruleName}] BLOCKED: ${l.url}</span></div>`;
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
    } catch(e) {
        console.log("Debug port not available.");
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            if (allLogs.length === 0) return;
            const textToCopy = allLogs.map(l => `[${l.ts}] Rule ${l.ruleId} BLOCKED ${l.type}: ${l.url}`).join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const oldIcon = btnCopy.textContent;
                btnCopy.textContent = '✅';
                setTimeout(() => { btnCopy.textContent = oldIcon; }, 1500);
            });
        });
    }

});
