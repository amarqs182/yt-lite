## CHANGELOG

### Added
- **A/B Experiments Disabler**: Added toggle and \src/features/experiments.js\ to freeze \yt.config_.EXPERIMENT_FLAGS\, blocking heavy YouTube layout experiment scripts.
- **Telemetry Blocker**: Implemented a \declarativeNetRequest\ rule (\src/rules.json\) that silently blocks \log_event\, \stats/qoe\, and \stats/ads\ endpoints without overhead.
- **Debug Terminal**: Added a live telemetry block log and an automatic blocked requests counter on the extension badge, supported by a new background service worker.

### Fixed
- **Pause Bug**: Corrected storage key lookup in \src/features/pause.js\ ensuring that \ytl-hidden_pause\ (Auto-Pause) and \ytl-pause_loops\ (Background Optimization) can now be toggled independently.
- **Manifest V3 Validation**: Replaced deprecated \domains\ key with \initiatorDomains\ and removed unsupported \etch\ resource type in \ules.json\ to ensure 100% Chrome compatibility.
