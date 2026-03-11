/**
 * src/features/ambient.js
 * Disables Ambient Mode by actively removing the attribute from the DOM.
 * Works reliably regardless of how YouTube's internal state machine initializes.
 */

(function() {
    'use strict';

    // Prevent execution in sandboxed iframes or about:blank to avoid Console errors
    if (window.self !== window.top || window.location.href === 'about:blank') return;

    // --- Ambient Mode Disabler ---
    if (localStorage['ytl-ambient_off'] === 'true') {
        // Hide Ambient Mode toggle from the settings gear menu and kill the visual glow element
        const style = document.createElement('style');
        style.textContent = `
            /* Hide Ambient Mode menu item based on its unique SVG path start */
            .ytp-menuitem:has(path[d^="M12 .5C11.73 .5 11.48"]) {
                display: none !important;
            }

            /* Permanently destroy the canvas containers that render the actual visual glow */
            #cinematics,
            ytd-cinematics,
            [id="cinematics"],
            #cinematics-container,
            .ytd-cinematic-container-renderer {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // We target the main flexy container which YouTube uses to toggle the ambient effect
        const clearAmbient = () => {
            const flexy = document.querySelector('ytd-watch-flexy');
            if (flexy && flexy.hasAttribute('cinematics-active')) {
                flexy.removeAttribute('cinematics-active');
            }
        };

        // Run initially
        clearAmbient();

        // Set up a MutationObserver to instantly remove the attribute if YouTube adds it back
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'cinematics-active') {
                    clearAmbient();
                }
            }
        });

        // Start observing document body for the flexy element or attribute changes
        observer.observe(document.documentElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ['cinematics-active']
        });

        document.addEventListener('yt-navigate-finish', clearAmbient);
    }

    // --- Static Thumbnails Feature ---
    if (localStorage['ytl-thumb_static'] === 'true') {
        const thumbStyle = document.createElement('style');
        thumbStyle.textContent = `
            /* 1. Kill all potential video/animated preview containers and overlays */
            ytd-video-preview,
            ytd-moving-thumbnail-renderer,
            ytd-inline-player,
            ytd-thumbnail-overlay-loading-preview-renderer,
            #mouseover-overlay,
            #hover-overlays,
            yt-video-preview-view-model,
            yt-inline-preview-ui,
            animated-thumbnail-overlay-view-model,
            .ytAnimatedThumbnailOverlayViewModelHost {
                display: none !important;
                pointer-events: none !important;
                visibility: hidden !important;
            }

            /* 2. Force the original static thumbnail image to stay visible */
            ytd-thumbnail img,
            yt-thumbnail-view-model img,
            .yt-core-image,
            .ytCoreImageHost {
                opacity: 1 !important;
                display: block !important;
                visibility: visible !important;
            }

            /* 3. Prevent any video tags from playing inside thumbnail containers */
            ytd-thumbnail video,
            yt-thumbnail-view-model video,
            .yt-lockup-view-model video {
                display: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(thumbStyle);
    }

})();
