# Recording Guide — Instagram Reels with OpenScreen

How to record a cinematic vertical clip of the Journey Visualiser for Instagram Reels, TikTok, or YouTube Shorts.

## Setup

1. Download **OpenScreen** from [github.com/siddharthvaddem/openscreen/releases](https://github.com/siddharthvaddem/openscreen/releases)
2. Install and open it alongside your browser
3. Open the Journey Visualiser in your browser (`npm run dev` or the deployed URL)

## Framing the Shot

1. Click the **phone icon** (top right, next to the gear icon) to turn on the **vertical preview overlay**
   - A centred 9:16 rectangle appears with a white border
   - Everything outside the rectangle is darkened
   - Faint guides show the **caption zone** (bottom 15%) and **buttons zone** (right 10%) — Instagram overlays its UI here
2. Orbit the 3D scene to get the camera angle you want — make sure the route fits within the 9:16 frame
3. Note the exact position and size of the 9:16 rectangle on your screen
4. **Turn off** the vertical overlay before recording — the overlay is just for framing, it should not appear in the final video

## Settings for a Clean Recording

Before recording, configure these settings (gear icon, top right):

| Setting             | Value     | Why                                         |
|---------------------|-----------|---------------------------------------------|
| Route colour        | **Speed** | Most visually striking gradient              |
| Auto-orbit          | **On**    | Slow cinematic rotation during playback      |
| Dot trail           | **On**    | Comet tail effect behind the animated dot     |
| Elevation profile   | **Off**   | Clean frame, no bottom chart                 |
| Day/night background| **Off**   | Consistent dark background                   |
| Live stats          | **Off**   | No stats overlay in the recording            |
| Leg labels          | **On/Off**| Your preference — hidden in cinema mode anyway|

**Playback speed:** Set to **3600x** for approximately a 21-second clip (depends on total driving time). Check the console log on page load for the exact speed multiplier needed for your target clip length.

## Recording Workflow

1. In **OpenScreen**, select the 9:16 region matching where the vertical preview frame was
2. Press **R** in the browser — this triggers the auto-play sequence:
   - Resets playback to the start
   - Waits 1 second (gives you time to start recording)
   - Enables cinema mode (hides all UI)
   - Auto-plays the journey
3. **Start recording** in OpenScreen immediately after pressing R (during the 1-second pause)
4. Let the full journey play out (~21 seconds at 3600x)
5. **Stop recording** in OpenScreen once the dot reaches the end

### Keyboard Shortcuts

| Key | Action                                           |
|-----|--------------------------------------------------|
| `C` | Toggle cinema mode (hide/show all UI)            |
| `R` | Record-ready auto-play (reset + cinema + play)   |

## OpenScreen Export Settings

- **Resolution:** 1080x1920 (standard vertical)
- **Watermark:** None
- **Variable speed:** Slow down over dramatic sections (e.g., the Kodaikanal mountain spike) for added impact, normal speed on flat highway sections
- **Motion blur:** On — smooths the auto-orbit camera rotation

## Instagram Reels Tips

- **Caption zone** covers the bottom ~15% of the frame — adjust your camera angle so the route stays above this area
- **Like/share buttons** cover the right ~10% — same consideration
- **Ideal clip length:** 15-30 seconds performs best on Reels
- **Add captions in Instagram** directly after upload — don't burn text into the video, Instagram's native captions look better and are searchable
- **Audio:** Add a trending audio track in Instagram for better reach. The visualiser has no audio, so any track works
- **Hashtags:** #roadtrip #3dvisualization #gpx #travelmap #datavisualization

## Troubleshooting

- **Route too small in frame:** Lower the elevation exaggeration or zoom in before framing
- **Dot moves too fast/slow:** Adjust playback speed. The console shows the exact multiplier for your target duration
- **Auto-orbit too fast:** Reduce orbit speed in settings (default 0.05 rad/s)
- **Cinema mode didn't activate:** Press C manually, or check that R was pressed outside an input field
