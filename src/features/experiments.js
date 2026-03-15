/**
 * src/features/experiments.js
 * Freezes yt.config_.EXPERIMENT_FLAGS to prevent YouTube from loading multiple sets of heavy experimental layout scripts.
 */

(function() {
    'use strict';

    if (localStorage['ytl-ab_experiments'] !== 'true') return;

    // We need to run very early to intercept yt.config_ before YouTube fully parses it
    let frozen = false;

    // Define property interceptor on the global window.yt object
    const interceptYt = () => {
        if (!window.yt) {
            window.yt = {};
        }
        
        let configValue = window.yt.config_;

        Object.defineProperty(window.yt, 'config_', {
            get: function() {
                return configValue;
            },
            set: function(val) {
                if (val && val.EXPERIMENT_FLAGS && !frozen) {
                    // Turn off common heavy UI experiments
                    val.EXPERIMENT_FLAGS.kevlar_watch_grid = false;
                    val.EXPERIMENT_FLAGS.kevlar_watch_flexy = false;
                    // Freeze the flags object to prevent further modifications
                    try {
                        Object.freeze(val.EXPERIMENT_FLAGS);
                        frozen = true;
                        console.log("YT Lite: A/B Experiment Flags Frozen");
                    } catch(e) { }
                }
                configValue = val;
            },
            configurable: true
        });
    };

    interceptYt();

})();
