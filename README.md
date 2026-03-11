# ytライト🌱 (YT Lite) 🪶 ▶🚀

YT Lite is a refined, highly stable YouTube optimizer fork based on `h264ify` and `enhanced-h264ify`. 
It focuses on deeply integrated hardware decoding detection to serve the most power-efficient video streams without breaking the YouTube experience with overly aggressive hacks.

## 🌟 Core Features (Phase 1)

- **Ambient Mode Remover:** Automatically strips the GPU-intensive "Ambient Mode" glow effect from the player.
- **Telemetry Blocker:** Silently intercepts and blocks intensive data-gathering requests (`log_event`, `stats/qoe`, `stats/ads`) without breaking the player.

## 🔋 Eco Mode Features (Phase 2)
- **Background Pause Optimization:** When a video is paused, YT Lite safely intercepts `requestVideoFrameCallback` to kill the internal rendering loop, dropping CPU usage near zero while maintaining seek/scrub functionality.
- **Hidden Tab Auto-Pause (Opt-In):** Automatically pauses the video when you switch away from the YouTube tab.
- **A/B Experiment Disabler (Opt-In / Experimental):** Freezes `yt.config_.EXPERIMENT_FLAGS` to prevent YouTube from loading multiple sets of heavy experimental layout scripts.

## 🚀 What We *Don't* Do (Discarded Hacks)
Unlike messy performance extensions, YT Lite avoids hacks that break core functionality:
- ❌ We do *not* spoof your screen size (`innerWidth`).
- ❌ We do *not* globally throttle `requestAnimationFrame` (which breaks UI animations).
- ❌ We do *not* freeze `ytInitialPlayerResponse` (which breaks video-to-video navigation).
- ❌ We do *not* block `base.js` or `videoplayback?preload` completely.

---

## 🛠️ Installation

1. Clone or download this repository.
2. Open your Chromium-based browser (Chrome, Edge, Brave, etc.).
3. Navigate to `chrome://extensions/`.
4. Enable **Developer Mode** (usually a toggle in the top right corner).
5. Click **Load unpacked** and select the `/ytライト` directory.
6. The "YT Lite ▶🚀" icon will appear in your extensions list.

## 💻 Technical Details
This project builds upon the foundations of [erkserkserks/h264ify](https://github.com/erkserkserks/h264ify) and [alextrv/enhanced-h264ify](https://github.com/alextrv/enhanced-h264ify). It introduces custom ES6+ overrides in `inject_eco.js` to manage the advanced performance hooks. All `localStorage` keys are namespaced to `yt-lite-`.
