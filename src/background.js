/**
 * src/background.js
 * Ativa a contagem automática no ícone da extensão (badge) para as requisições bloqueadas.
 * Opcionalmente, grava logs para o popup ler em tempo real via porta.
 */

// 1. Contador Automático no Ícone (Badge) Nativo do Chrome
chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true
});

// A cor de fundo do badge (badge nativo conta por aba)
chrome.action.setBadgeBackgroundColor({ color: "#D32F2F" });

// 2. Sistema de Log e Conexão com o Popup (Modo Debug)
// Limitamos o tamanho do log em memória
const MAX_LOGS = 50;
let blockLogs = [];
let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'yt-lite-debug') {
        popupPort = port;
        // Envia o histórico existente ao conectar
        port.postMessage({ type: 'history', logs: blockLogs });

        port.onDisconnect.addListener(() => {
            popupPort = null;
        });
    }
});

// onRuleMatchedDebug só funciona em extensões "Unpacked" e com a permissão declarativeNetRequestFeedback
// Isso é útil para nós vermos quais URLs específicas foram aniquiladas
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
        const entry = {
            ts: new Date().toLocaleTimeString(),
            ruleId: info.rule.ruleId,
            url: info.request.url.substring(0, 100) + (info.request.url.length > 100 ? '...' : ''),
            type: info.request.type
        };

        // Adiciona e mantém o limite
        blockLogs.unshift(entry);
        if (blockLogs.length > MAX_LOGS) blockLogs.pop();

        // Se o popup estiver aberto, emite em tempo real
        if (popupPort) {
            popupPort.postMessage({ type: 'new_log', log: entry });
        }
    });
}
