# Lessons Learned

## 2026-03-16: Don't remove hardware-dependent logic without explicit permission
- **Mistake**: Removed `getHardwareCapabilities()` from High mode preset, forcing AV1 unconditionally regardless of GPU support.
- **Rule**: Never remove hardware/capability detection logic. If a preset depends on HW capabilities, that check exists for a reason — it prevents forcing codecs the GPU can't decode.
- **Pattern**: When cleaning up "unused" code, verify it's truly unused and not serving a safety/compatibility purpose.

## 2026-03-16: Don't bundle independent features into a single toggle
- **Mistake**: Eco UI toggle was hiding comments, chat, and Shorts all at once — user wanted granular control.
- **Rule**: Features that affect different content areas (comments vs Shorts vs animations) should always be separate toggles. Users expect to control what they hide independently.
- **Pattern**: When a single flag controls multiple unrelated behaviors, split it into independent flags.
