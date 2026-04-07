# Implementation Plan: retro-visual-effects

## Overview

Adds a full retro visual-polish layer to Bug Busters in eight incremental steps: CRT shader, scanline overlay, loading screen upgrade, animated title screen, screen shake, particle bursts, damage blink, hit-stop, and floating score pop-ups. All runtime effects are centralised in a new `EffectsManager`; existing scenes are modified minimally to wire it in.

## Tasks

- [x] 1. Add `HIT_STOP_DURATION` constant and create `EffectsManager` skeleton
  - Add `HIT_STOP_DURATION: 80` to `src/config/constants.js`
  - Create `src/managers/EffectsManager.js` with constructor storing `this._scene` and empty stubs for all five public methods: `shake`, `spawnParticleBurst`, `startDamageBlink`, `triggerHitStop`, `spawnScorePopup`
  - _Requirements: 7.6, 9.1, 9.5_

- [x] 2. Implement `shake()` and integrate into `GameScene`
  - [x] 2.1 Implement `EffectsManager.shake(duration, intensity)`
    - Delegates directly to `this._scene.cameras.main.shake(duration, intensity)`
    - _Requirements: 2.5_

  - [x] 2.2 Write property test for `shake()` — Property 2
    - **Property 2: shake() delegates parameters unchanged**
    - **Validates: Requirements 2.5**

  - [x] 2.3 Instantiate `EffectsManager` in `GameScene.create()` and wire shake calls
    - Add `this._effectsManager = new EffectsManager(this)` in `create()`
    - Call `this._effectsManager.shake(150, 0.008)` in `_onProjectileHitBug()` (via `_eliminateBug`)
    - Call `this._effectsManager.shake(300, 0.015)` in `_onBugHitKiro()` after decrementing lives
    - Call `this._effectsManager.shake(200, 0.010)` after each `SoundManager.play('sfx_power_activate')` call
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.3, 9.4_

- [x] 3. Implement `spawnParticleBurst()` and `triggerHitStop()`
  - [x] 3.1 Implement `EffectsManager.spawnParticleBurst(x, y)`
    - Use `this._scene.add.particles(x, y, 'projectile', { speed: { min: 50, max: 150 }, scale: { start: 0.5, end: 0 }, lifespan: 400, quantity: 8, emitting: false })`
    - Call `particles.explode(8)` immediately after creation
    - Wrap in try/catch; log warning on failure without interrupting gameplay
    - Schedule `this._scene.time.delayedCall(400, () => particles.destroy())` to clean up
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write property test for `spawnParticleBurst()` — Property 3
    - **Property 3: spawnParticleBurst() positions emitter at given coordinates**
    - **Validates: Requirements 3.1, 3.5**

  - [x] 3.3 Implement `EffectsManager.triggerHitStop()`
    - Set `this._scene.time.timeScale = 0.05`
    - Schedule `this._scene.time.delayedCall(CONSTANTS.HIT_STOP_DURATION, () => { this._scene.time.timeScale = 1.0; })`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.4 Write property test for `triggerHitStop()` — Property 7
    - **Property 7: triggerHitStop() schedules restore with correct duration**
    - **Validates: Requirements 7.2**

  - [x] 3.5 Wire `spawnParticleBurst()` and `triggerHitStop()` into `GameScene._eliminateBug()`
    - Call both before `bug.setActive(false)`
    - _Requirements: 9.2_

- [x] 4. Implement `startDamageBlink()` and `spawnScorePopup()`
  - [x] 4.1 Implement `EffectsManager.startDamageBlink(sprite)`
    - Stop existing `this._blinkTween` if active before creating a new one
    - Tween config: `{ targets: sprite, alpha: 0.15, duration: 100, yoyo: true, repeat: Math.floor(CONSTANTS.INVINCIBILITY_DURATION / 200) - 1, onComplete: () => { sprite.alpha = 1.0; } }`
    - Store tween reference in `this._blinkTween`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Write property test for `startDamageBlink()` — Property 4
    - **Property 4: DamageBlink repeat count matches invincibility duration**
    - **Validates: Requirements 4.2**

  - [x] 4.3 Implement `EffectsManager.spawnScorePopup(x, y, points)`
    - Create text at `(x, y - 16)` with style `{ fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffff00' }` and `setScrollFactor(0)`
    - Use `String(points ?? 0)` prefixed with `"+"` for the label
    - Add tween: `{ targets: text, y: text.y - 40, alpha: 0, duration: 600, onComplete: () => { text.destroy(); } }`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.4 Write property test for `spawnScorePopup()` — Property 8
    - **Property 8: spawnScorePopup() positions text 16px above given coordinates**
    - **Validates: Requirements 8.1**

  - [x] 4.5 Wire `startDamageBlink()` and `spawnScorePopup()` into `GameScene`
    - Call `this._effectsManager.startDamageBlink(this._kiro)` in `_onBugHitKiro()` after decrementing lives
    - Call `this._effectsManager.spawnScorePopup(bug.x, bug.y, bug.pointValue)` in `_eliminateBug()` before `bug.setActive(false)`
    - _Requirements: 9.2, 9.3_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create `CRTShader` WebGL pipeline
  - [x] 6.1 Create `src/shaders/CRTShader.js` extending `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`
    - Implement GLSL fragment shader with `vignetteStrength` uniform (default 0.4) for radial edge darkening
    - Implement scanline pass with `scanlineAlpha` uniform (default 0.15) reducing brightness on odd pixel rows only
    - Set uniforms each frame in `onPreRender()`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Write property tests for CRT shader math — Properties 5 and 6
    - Extract vignette and scanline math into pure JS helper functions mirroring the GLSL logic
    - **Property 5: CRTShader vignette darkens monotonically toward edges**
    - **Property 6: CRTShader scanline applies to odd rows only**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 6.3 Register `CRTShader` in `BootScene.create()` and apply in `GameScene.create()`
    - In `BootScene.create()`: guard with `if (this.renderer.type === Phaser.WEBGL)` then `this.renderer.pipelines.addPostPipeline('CRTShader', CRTShader)`
    - In `GameScene.create()`: guard with WebGL check then `this.cameras.main.setPostPipeline(CRTShader)`
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 7. Create `ScanlineOverlay` helper and upgrade `LoadingScene`
  - [x] 7.1 Implement a `createScanlineOverlay(scene)` helper function (e.g. in `src/managers/EffectsManager.js` as a named export or standalone utility)
    - Draw horizontal stripes using `scene.add.graphics()`: 2 px stripe, 2 px gap, alpha 0.25, `setScrollFactor(0)`
    - Stripe count: `Math.ceil(viewportHeight / 4)` to ensure full coverage
    - _Requirements: 1.5, 1.6, 5.3_

  - [x] 7.2 Write property test for `ScanlineOverlay` stripe count — Property 1
    - **Property 1: ScanlineOverlay covers full viewport without gaps**
    - **Validates: Requirements 1.6**

  - [x] 7.3 Upgrade `LoadingScene`
    - Replace the 10-step timer with a smooth tween on `bar.width` filling over a random duration in `[2000, 3000]` ms
    - Change loading text colour to `#00ff00` and add CRT-flicker tween: `{ alpha: 0.7, duration: 120, yoyo: true, repeat: -1 }`
    - Call `createScanlineOverlay(this)` after other elements are created
    - Schedule `this.scene.start('MainMenuScene')` 400 ms after bar tween completes (use tween `onComplete` + `delayedCall`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Upgrade `MainMenuScene` with animated title screen
  - Add `TileSprite` background using `tileset` key; scroll diagonally at 20 px/s via `tilePositionX` and `tilePositionY` in `update()`
  - Add `update()` method to `MainMenuScene` with `this._bg.tilePositionX += delta * 0.02; this._bg.tilePositionY += delta * 0.02` (using `delta` from Phaser's update args)
  - Add pulsing scale tween on title text: `{ scaleX: 1.08, scaleY: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }`
  - Call `createScanlineOverlay(this)` after other elements
  - Apply `CRTShader` to `this.cameras.main` with WebGL guard
  - Preserve existing `"PRESS START"` blink and scene-transition behaviour
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Write `EffectsManager` unit tests
  - [x] 9.1 Write unit tests for all `EffectsManager` methods
    - `shake(150, 0.008)` → `cameras.main.shake` called with exact values
    - `spawnParticleBurst` → emitter config matches spec (quantity 8, texture `'projectile'`, lifespan 400)
    - `startDamageBlink` → tween alpha target is `0.15`, `yoyo: true`, `onComplete` resets alpha to `1.0`
    - `startDamageBlink` called twice → first tween stopped before second starts
    - `triggerHitStop` → `timeScale` set to `0.05`, `delayedCall` scheduled with `CONSTANTS.HIT_STOP_DURATION`
    - `spawnScorePopup` → text style matches spec, tween `onComplete` calls `destroy()`
    - _Requirements: 2.5, 3.5, 4.5, 7.5, 8.5_

  - [x] 9.2 Write property test for `_eliminateBug()` call order — Property 9
    - **Property 9: _eliminateBug() calls all effects before deactivating the bug**
    - **Validates: Requirements 9.2**

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All code comments and JSDoc in Spanish; identifiers in English (per project conventions)
- Magic numbers must be added to `CONSTANTS` before use — never inline
- WebGL availability must always be guarded before applying `CRTShader`
- Property tests use `fast-check` with `{ numRuns: 100 }` minimum
- Each property test file lives in `tests/unit/EffectsManager.test.js` alongside unit tests
