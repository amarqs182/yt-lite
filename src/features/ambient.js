/**
 * src/features/ambient.js
 * Disables Ambient Mode by actively removing the attribute from the DOM.
 */
(function() {
    'use strict';
    if (window.self !== window.top) return;

    const check = () => {
        if (document.documentElement.getAttribute('data-ytb-ambient_off') !== 'true') return;
        const flexy = document.querySelector('ytd-watch-flexy');
        if (flexy && flexy.hasAttribute('cinematics-active')) {
            flexy.removeAttribute('cinematics-active');
        }
        const cinematics = document.getElementById('cinematics');
        if (cinematics) cinematics.style.display = 'none';
    };

    setInterval(check, 2000);
    window.addEventListener('yt-bettr-sync', check);
})();
