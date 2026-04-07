# Requirements Document

## Introduction

This feature adds the full retro visual and audio polish layer to Bug Busters. It covers eight distinct effects that transform the existing functional gameplay into a cohesive CRT-era arcade experience: an extended loading screen with scanline aesthetics, screen shake on impactful events, particle explosions on enemy elimination, damage-blink on Kiro, an animated title screen, a CRT shader overlay, hit-stop freeze frames on kills, and floating score pop-ups. The user will supply all required art assets; this spec covers only the implementation.

## Glossary

- **LoadingScene**: The existing `src/scenes/LoadingScene.js` scene shown before `MainMenuScene`.
- **MainMenuScene**: The existing `src/scenes/MainMenuScene.js` title screen scene.
- **GameScene**: The existing `src/scenes/GameScene.js` core gameplay scene.
- **EffectsManager**: New manager class (`src/managers/EffectsManager.js`) that centralises all visual effect calls (shake, particles, blink, hit-stop, score pop-ups).
- **CRTShader**: New Phaser WebGL pipeline (`src/shaders/CRTShader.js`) that applies a CRT scanline and vignette overlay.
- **ScorePopup**: A short-lived floating text object spawned above an eliminated enemy showing the point value earned.
- **HitStop**: A brief (~80 ms) time-scale freeze applied to the Phaser time system immediately after a kill.
- **DamageBlink**: A tween-based alpha flicker applied to Kiro's sprite during the invincibility period.
- **ParticleBurst**: A one-shot particle emitter explosion triggered at an enemy's last position on elimination.
- **ScreenShake**: A camera shake effect triggered on hits, deaths, and power activations.
- **ScanlineOverlay**: A repeating semi-transparent horizontal-stripe graphic rendered on top of all game content.
- **ProgressBar**: The animated loading bar in `LoadingScene` that fills over a minimum of 2–3 seconds.

---

## Requirements

### Requirement 1: Extended Loading Screen with CRT Aesthetics

**User Story:** As a player, I want the loading screen to feel like booting up a retro arcade cabinet, so that the game's visual identity is established from the very first moment.

#### Acceptance Criteria

1. WHEN `LoadingScene` starts, THE `ProgressBar` SHALL take a minimum of 2000 ms and a maximum of 3000 ms to fill from 0% to 100%.
2. WHEN `LoadingScene` starts, THE `LoadingScene` SHALL render a `ScanlineOverlay` covering the full viewport on top of all other elements.
3. WHEN `LoadingScene` starts, THE `LoadingScene` SHALL display the loading text using the `"Press Start 2P"` font with a green (`#00ff00`) fill colour and a CRT-style flicker tween (alpha oscillating between 1.0 and 0.7, duration 120 ms, repeat -1).
4. WHEN the `ProgressBar` reaches 100%, THE `LoadingScene` SHALL wait 400 ms before transitioning to `MainMenuScene`.
5. THE `ScanlineOverlay` SHALL be composed of semi-transparent horizontal stripes with a height of 2 px, a gap of 2 px, and an alpha of 0.25, rendered using `setScrollFactor(0)`.
6. IF the viewport height is not evenly divisible by the stripe pitch (4 px), THEN THE `ScanlineOverlay` SHALL extend one additional stripe beyond the viewport bottom to avoid gaps.

---

### Requirement 2: Screen Shake on Impactful Events

**User Story:** As a player, I want the screen to shake when something impactful happens, so that hits, deaths, and power activations feel physically weighty.

#### Acceptance Criteria

1. WHEN a projectile hits an enemy, THE `EffectsManager` SHALL trigger a `ScreenShake` with a duration of 150 ms and an intensity of 0.008.
2. WHEN Kiro loses a life, THE `EffectsManager` SHALL trigger a `ScreenShake` with a duration of 300 ms and an intensity of 0.015.
3. WHEN a power is activated, THE `EffectsManager` SHALL trigger a `ScreenShake` with a duration of 200 ms and an intensity of 0.010.
4. WHILE a `ScreenShake` is already in progress, THE `EffectsManager` SHALL allow a new shake call to override it (Phaser's `cameras.main.shake` replaces the current shake).
5. THE `EffectsManager` SHALL expose a `shake(duration, intensity)` method that calls `this._scene.cameras.main.shake(duration, intensity)`.

---

### Requirement 3: Particle Burst on Enemy Elimination

**User Story:** As a player, I want a particle explosion when I eliminate an enemy, so that kills feel satisfying and visually rewarding.

#### Acceptance Criteria

1. WHEN an enemy is eliminated, THE `EffectsManager` SHALL spawn a `ParticleBurst` at the enemy's last `(x, y)` position.
2. THE `ParticleBurst` SHALL emit exactly 8 particles using the `'projectile'` texture key.
3. THE `ParticleBurst` SHALL configure particles with: speed `{ min: 50, max: 150 }`, scale `{ start: 0.5, end: 0 }`, lifespan 400 ms, and `emitting: false`.
4. WHEN the `ParticleBurst` lifespan expires, THE `EffectsManager` SHALL destroy the particle emitter object to avoid memory accumulation.
5. THE `EffectsManager` SHALL expose a `spawnParticleBurst(x, y)` method that creates and immediately explodes the emitter.

---

### Requirement 4: Damage Blink on Kiro

**User Story:** As a player, I want Kiro to visibly flicker when damaged, so that I can clearly see the invincibility window is active.

#### Acceptance Criteria

1. WHEN Kiro loses a life, THE `EffectsManager` SHALL start a `DamageBlink` tween on Kiro's sprite.
2. THE `DamageBlink` tween SHALL oscillate Kiro's alpha between 1.0 and 0.15, with a duration of 100 ms per half-cycle, `yoyo: true`, and repeat count equal to `Math.floor(CONSTANTS.INVINCIBILITY_DURATION / 200) - 1`.
3. WHEN the `DamageBlink` tween completes, THE `EffectsManager` SHALL set Kiro's alpha back to 1.0.
4. IF a `DamageBlink` tween is already running when a new one is requested, THEN THE `EffectsManager` SHALL stop the existing tween before starting the new one.
5. THE `EffectsManager` SHALL expose a `startDamageBlink(sprite)` method that manages the tween lifecycle described above.

---

### Requirement 5: Animated Title Screen

**User Story:** As a player, I want the title screen to have animated elements, so that it feels alive and sets the retro arcade mood before I start playing.

#### Acceptance Criteria

1. WHEN `MainMenuScene` starts, THE `MainMenuScene` SHALL display a scrolling background by tiling the `tileset` image and scrolling it diagonally at 20 px/s on both axes using `tilePositionX` and `tilePositionY` in `update()`.
2. WHEN `MainMenuScene` starts, THE `MainMenuScene` SHALL display the title text `"BUG BUSTERS"` with a pulsing scale tween: scale oscillating between 1.0 and 1.08, duration 600 ms, `yoyo: true`, repeat -1, ease `'Sine.easeInOut'`.
3. WHEN `MainMenuScene` starts, THE `MainMenuScene` SHALL render a `ScanlineOverlay` identical in specification to Requirement 1 AC5–6.
4. WHEN `MainMenuScene` starts, THE `MainMenuScene` SHALL apply the `CRTShader` pipeline to `this.cameras.main` if WebGL is available.
5. WHEN `MainMenuScene` starts, THE `MainMenuScene` SHALL display a `"PRESS START"` button that blinks with alpha oscillating between 1.0 and 0, duration 500 ms, `yoyo: true`, repeat -1 (preserving existing behaviour).
6. WHEN the player clicks `"PRESS START"`, THE `MainMenuScene` SHALL transition to `GameScene` with `{ level: progress.level }` (preserving existing behaviour).

---

### Requirement 6: CRT Shader Overlay

**User Story:** As a player, I want a CRT shader effect on the game camera, so that the entire game has a consistent retro monitor look.

#### Acceptance Criteria

1. THE `CRTShader` SHALL be implemented as a Phaser WebGL pipeline class in `src/shaders/CRTShader.js` extending `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`.
2. THE `CRTShader` SHALL apply a vignette effect: darkening pixels towards the screen edges using a radial gradient with a strength configurable via a `vignetteStrength` uniform (default 0.4).
3. THE `CRTShader` SHALL apply a scanline darkening pass: reducing brightness of every other pixel row by a factor configurable via a `scanlineAlpha` uniform (default 0.15).
4. WHERE WebGL is not available (Canvas renderer), THE `GameScene` SHALL skip pipeline registration and fall back to the `ScanlineOverlay` approach used in `LoadingScene`.
5. WHEN `GameScene` creates, THE `GameScene` SHALL register and apply the `CRTShader` pipeline to `this.cameras.main` via `this.cameras.main.setPostPipeline(CRTShader)`.
6. THE `CRTShader` pipeline SHALL be registered with the Phaser game instance in `BootScene` under the key `'CRTShader'` before any scene that uses it starts.

---

### Requirement 7: Hit-Stop Freeze Frame on Kill

**User Story:** As a player, I want a brief freeze frame when I eliminate an enemy, so that kills have a punchy, satisfying impact moment.

#### Acceptance Criteria

1. WHEN an enemy is eliminated, THE `EffectsManager` SHALL apply a `HitStop` by setting `this._scene.time.timeScale` to 0.05.
2. WHEN the `HitStop` starts, THE `EffectsManager` SHALL schedule a `delayedCall` of `CONSTANTS.HIT_STOP_DURATION` ms (default 80) to restore `this._scene.time.timeScale` to 1.0.
3. THE `HitStop` SHALL use `this._scene.time.delayedCall` so the restore callback is itself subject to the slowed time scale, producing a perceived freeze of approximately 80 ms of real time.
4. IF a `HitStop` is already active when a new kill occurs, THEN THE `EffectsManager` SHALL allow the new `HitStop` to overwrite the time scale (the existing restore callback will still fire and reset to 1.0).
5. THE `EffectsManager` SHALL expose a `triggerHitStop()` method that implements the behaviour described in AC1–2.
6. THE `CONSTANTS` object SHALL include `HIT_STOP_DURATION: 80`.

---

### Requirement 8: Floating Score Pop-ups

**User Story:** As a player, I want to see the point value float up from an eliminated enemy, so that I get immediate feedback on how many points I earned.

#### Acceptance Criteria

1. WHEN an enemy is eliminated, THE `EffectsManager` SHALL spawn a `ScorePopup` text object at the enemy's `(x, y - 16)` position showing the point value (e.g. `"+10"`).
2. THE `ScorePopup` SHALL use the `"Press Start 2P"` font, `fontSize: '10px'`, fill colour `'#ffff00'`, and `setScrollFactor(0)` to stay fixed relative to the camera.
3. THE `ScorePopup` SHALL animate upward by 40 px over 600 ms using a tween on the `y` property, with alpha fading from 1.0 to 0 over the same duration.
4. WHEN the `ScorePopup` tween completes, THE `EffectsManager` SHALL call `destroy()` on the text object.
5. THE `EffectsManager` SHALL expose a `spawnScorePopup(x, y, points)` method that creates the text and starts the tween described above.
6. THE `GameScene` SHALL call `this._effectsManager.spawnScorePopup(bug.x, bug.y, bug.pointValue)` inside `_eliminateBug()` before deactivating the bug.

---

### Requirement 9: EffectsManager Integration in GameScene

**User Story:** As a developer, I want all visual effects centralised in a single manager, so that GameScene stays clean and effects are easy to maintain or extend.

#### Acceptance Criteria

1. THE `EffectsManager` SHALL be instantiated in `GameScene.create()` as `this._effectsManager = new EffectsManager(this)`.
2. THE `GameScene._eliminateBug()` method SHALL call `this._effectsManager.spawnParticleBurst(bug.x, bug.y)`, `this._effectsManager.triggerHitStop()`, and `this._effectsManager.spawnScorePopup(bug.x, bug.y, bug.pointValue)` before deactivating the bug.
3. THE `GameScene._onBugHitKiro()` method SHALL call `this._effectsManager.shake(300, 0.015)` and `this._effectsManager.startDamageBlink(this._kiro)` after decrementing lives.
4. WHEN a power is activated in `GameScene`, THE `GameScene` SHALL call `this._effectsManager.shake(200, 0.010)` after the `SoundManager.play('sfx_power_activate')` call.
5. THE `EffectsManager` constructor SHALL accept a single `scene` parameter and store it as `this._scene`.
