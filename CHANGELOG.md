## CHANGELOG

### Added
- **A/B Experiments Disabler**: Added toggle and `src/features/experiments.js` to freeze `yt.config_.EXPERIMENT_FLAGS`, blocking heavy YouTube layout experiment scripts.
- **Telemetry Blocker**: Implemented a `declarativeNetRequest` rule (`src/rules.json`) that silently blocks `log_event`, `stats/qoe`, and `stats/ads` endpoints without overhead.
- **Debug Terminal**: Added a live telemetry block log and an automatic blocked requests counter on the extension badge, supported by a new background service worker.
- **Hardware Codec Detection**: Added a "Testar PC" button in the popup that evaluates hardware decoding support for AV1, VP9, and H264 to help users make informed choices.
- **Premium Visual Filters**: New high-fidelity filters including **Nitidez /|\** (GPU-accelerated), **Destaque <>** (HDR depth), and **Granulação (*)** (Professional animated film grain).
- **Audio Hi-Fi Engine**: Implemented a V-Shape equalizer with dynamic compression for crystal clear sound and powerful bass.
- **OLED Mode**: Real pure-black theme support for the YouTube website.

### Fixed
- **Pause Bug**: Corrected storage key lookup in `src/features/pause.js` ensuring that `ytb-hidden_pause` (Auto-Pause) and `ytb-pause_loops` (Background Optimization) can now be toggled independently.
- **Manifest V3 Validation**: Replaced deprecated `domains` key with `initiatorDomains` and removed unsupported `fetch` resource type in `rules.json` to ensure 100% Chrome compatibility.
- **Trusted Types Compliance**: Refactored DOM manipulation to avoid `innerHTML`, fixing security blocks on YouTube.
- **Storage Sync Gap**: Implemented a real-time DOM-attribute bridge to ensure instant settings synchronization between the isolated world and the main world.

### Changed
- **UI Redesign (Minimalist)**: Fully refactored `popup.html` and `popup.js` to a modern minimalist style with better typography (Inter), cleaner toggle switches (iOS style), and improved spacing and contrast.
- **Operational Modes**: Introduced **Auto Lite**, **Auto High**, and **Custom** profiles for one-click intelligent optimization.
- **Granular Codec Controls**: Restored individual toggles for video and audio codecs with a new segmented button UI for maximum flexibility.
