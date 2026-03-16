/**
 * src/features/eco.js
 * Implements Low Res Thumbnails and aggressive DOM hiding for Heavy Elements.
 * Reads from attributes for live sync.
 */
(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytb-' + k) === 'true';

    const applyStyles = () => {
        const id = 'yt-bettr-eco-styles';
        let style = document.getElementById(id);
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            (document.head || document.documentElement).appendChild(style);
        }

        let css = '';

        // 1. Low Res Thumbnails
        if (getS('thumb_lowres')) {
            // This needs URL interception usually, but we can try CSS trick for sizing
        }

        // 1. Static Thumbnails (block video preview on hover)
        if (getS('thumb_static')) {
            css += `
                #mouseover-overlay, ytd-moving-thumbnail-renderer { display: none !important; }
            `;
        }

        // 2. Extreme Eco UI (animations + heavy elements only)
        if (getS('eco_ui')) {
            css += `
                * { animation: none !important; transition: none !important; }
            `;
        }

        // 2b. Hide Comments & Chat
        if (getS('hide_comments')) {
            css += `
                #comments, #chat, #chat-container, ytd-live-chat-frame { display: none !important; }
            `;
        }

        // 2c. Hide Shorts
        if (getS('hide_shorts')) {
            css += `
                ytd-rich-section-renderer, ytd-reel-shelf-renderer, #shorts-container { display: none !important; }
            `;
        }

        // 3. Remove Transparencies
        if (getS('no_transparency')) {
            css += `
                * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
                #masthead-container.ytd-app, .ytp-popup, .ytp-settings-menu { background: black !important; opacity: 1 !important; }
            `;
        }

        // 4. OLED Theme
        if (document.documentElement.getAttribute('data-ytb-theme') === 'amoled') {
            css += `
                html, body, ytd-app, ytd-masthead, #masthead-container.ytd-app, #columns.ytd-watch-flexy { background-color: #000000 !important; }
                ytd-guide-renderer, #background.ytd-masthead, .ytp-panel-menu { background-color: #000000 !important; }
            `;
        }

        style.textContent = css;
    };

    window.addEventListener('yt-bettr-sync', applyStyles);
    applyStyles();
})();
