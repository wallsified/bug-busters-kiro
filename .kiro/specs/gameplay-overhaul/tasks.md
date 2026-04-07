# Implementation Plan: gameplay-overhaul

## Overview

Six independent areas are implemented in dependency order: config changes first, then the new BombGroup entity, then GameScene rewrites (projectile removal, spawn fix, auto-game-over fix, pause mechanic), and finally the CRT shader tweak. Each task builds on the previous and ends with everything wired together.

## Tasks

- [x] 1. Update CONSTANTS and LEVELS config
  - Add `BOMB_LIMIT: 3` and `BOMB_FUSE_DURATION: 3000` to `src/config/constants.js`
  - Add `spawnThreshold` to each level in `src/config/levels.js`: Level 1 = 10, Level 2 = 15, Level 3 = 20
  - Remove the `PROJECTILE_LIMIT` and `PROJECTILE_SPEED` entries (no longer needed after bomb replacement)
  - _Requirements: 1.5, 1.4, 2.1_

- [x] 2. Create BombGroup entity
  - [x] 2.1 Implement `src/entities/BombGroup.js`
    - Use the conditional `BaseGroup` pattern (Phaser / Jest fallback) matching `ProjectileGroup.js` style
    - Implement `placeBomb(x, y)` — snaps to nearest tile centre using `TILE_SIZE = 32`, enforces `BOMB_LIMIT`, creates/reuses pool member, starts `fuseTimer` via `this.scene.time.delayedCall(CONSTANTS.BOMB_FUSE_DURATION, ...)`
    - Implement `detonateBomb(bomb)` — guards `if (!bomb || bomb.active === false) return`, cancels `fuseTimer`, calls `setActive(false)`, zeroes velocity
    - Implement `getActiveCount()` — returns count of children where `active === true`
    - Comments in Spanish, identifiers in English
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 2.2 Write property test for BombGroup — tile snapping (Property 1)
    - **Property 1: Bomb placement respects tile snapping**
    - **Validates: Requirements 1.1, 1.2**
    - In `tests/unit/GameplayOverhaulProperties.test.js`, use `fc.property(fc.float({ min: 0, max: 800 }), fc.float({ min: 0, max: 600 }), (x, y) => { ... })` with `{ numRuns: 100 }`
    - Assert placed bomb x/y equals `Math.round(x/32)*32 + 16` and same for y

  - [x] 2.3 Write property test for BombGroup — limit never exceeded (Property 2)
    - **Property 2: Bomb limit is never exceeded**
    - **Validates: Requirements 1.5**
    - `fc.property(fc.integer({ min: 4, max: 20 }), (n) => { ... })` — place n bombs, assert `getActiveCount() <= BOMB_LIMIT`

  - [x] 2.4 Write unit tests for BombGroup
    - File: `tests/unit/BombGroup.test.js`
    - Test: bomb placed at snapped tile position
    - Test: fuse timeout calls `detonateBomb` (mock `scene.time.delayedCall`)
    - Test: `sfx_eliminate` and `spawnParticleBurst` called on detonation (mocked managers)
    - Test: `placeBomb` is a no-op when `BOMB_LIMIT` reached
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 3. Replace ProjectileGroup with BombGroup in GameScene
  - In `src/scenes/GameScene.js`:
    - Remove `import { ProjectileGroup }` and add `import { BombGroup }`
    - In `create()`: replace `this._projectiles = new ProjectileGroup(this)` with `this._bombs = new BombGroup(this)`
    - Remove `this.input.on('pointerdown', () => this._fireProjectile())`
    - Replace the `_spaceKey` fire handler in `update()` with `_placeBomb()` call (keep rising-edge pattern)
    - Add `_placeBomb()` method — calls `this._bombs.placeBomb(this._kiro.x, this._kiro.y)`, plays `sfx_eliminate` on detonation via callback, calls `this._effectsManager.spawnParticleBurst`
    - Add `_onBombHitBug(bomb, bug)` overlap handler — guards active checks, calls `this._bombs.detonateBomb(bomb)`, calls `this._eliminateBug(bug)`
    - Add `_setupBombCollisions()` — registers `physics.add.overlap(this._bombs, bug, ...)` for each bug
    - Replace `_setupBugCollisions` projectile overlap with bomb overlap
    - Remove `_onProjectileHitBug`, `_fireProjectile` methods
    - _Requirements: 1.1, 1.3, 1.6, 1.7_

  - [x] 3.1 Write property test for bomb-bug overlap (Property 3)
    - **Property 3: Bomb-bug overlap eliminates both**
    - **Validates: Requirements 1.3**
    - In `tests/unit/GameplayOverhaulProperties.test.js`
    - `fc.property(fc.record({ x: fc.float({ min: 0, max: 800 }), y: fc.float({ min: 0, max: 600 }) }), (pos) => { ... })`
    - After calling `_onBombHitBug(bomb, bug)`, assert `bomb.active === false` and `bug.active === false`

- [x] 4. Fix Wanderer spawn and implement score-based spawn limit
  - In `src/scenes/GameScene.js`, `create()`: initialise `this._spawnedPointTotal = 0` and `this._spawnThresholdReached = false`
  - Rewrite `_spawnEnemies(levelConfig)`:
    - Loop over `levelConfig.enemies` sequentially
    - Before creating each enemy, check `if (this._spawnedPointTotal >= (levelConfig.spawnThreshold ?? Infinity)) break`
    - After pushing a non-Replicator bug, add its `pointValue` to `this._spawnedPointTotal`
    - Replicator's dynamic Wanderer callback: push to `this._bugs` and call `this._setupBugCollisions(newWanderer)` — do NOT increment `_spawnedPointTotal`
    - After the loop, set `this._spawnThresholdReached = (this._spawnedPointTotal >= (levelConfig.spawnThreshold ?? Infinity))`
    - Add `console.warn` for unknown enemy types (existing `if (bug)` guard stays)
  - Update `_checkWinCondition()`: add guard `if (!this._spawnThresholdReached) return` before the active-bugs check
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.4_

  - [x] 4.1 Write property test for spawn threshold (Property 4)
    - **Property 4: Spawn threshold is never exceeded**
    - **Validates: Requirements 2.2, 2.3, 2.6**
    - In `tests/unit/GameplayOverhaulProperties.test.js`
    - `fc.property(fc.array(enemyArb, { minLength: 1, maxLength: 10 }), fc.integer({ min: 1, max: 100 }), (enemies, threshold) => { ... })`
    - Assert `spawnedPointTotal >= threshold` OR all enemies were spawned (whichever comes first)

  - [x] 4.2 Write property test for Wanderer count (Property 5)
    - **Property 5: Wanderer count matches level config**
    - **Validates: Requirements 3.1**
    - `fc.property(fc.integer({ min: 0, max: 10 }), (n) => { ... })` — build a level config with n Wanderers, assert bugs array contains exactly n Wanderer instances after `_spawnEnemies`

  - [x] 4.3 Write property test for Wanderer velocity (Property 6)
    - **Property 6: Wanderer velocity magnitude equals ENEMY_SPEED**
    - **Validates: Requirements 3.3**
    - In `tests/unit/GameplayOverhaulProperties.test.js`
    - `fc.property(fc.integer({ min: 0, max: 1000 }), (seed) => { ... })` — call `_pickNewDirection()`, assert exactly one of `|vx|` or `|vy|` equals `ENEMY_SPEED` and the other equals 0

  - [x] 4.4 Write unit tests for Wanderer spawn fix
    - In `tests/unit/Wanderer.test.js`: add test that Wanderer is created with `wanderer` texture key (req 3.2)
    - _Requirements: 3.2_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Fix auto game-over bug
  - In `src/scenes/GameScene.js`, audit `create()` for any `this.time.addEvent` or `this.time.delayedCall` that references `_scoreSystem.getScore()` and calls `_gameOver()` — remove if found
  - Confirm `_onBugHitKiro` only calls `_gameOver()` when `this._lives <= 0` (no score check)
  - Confirm `_checkWinCondition()` has no score-based branch
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.1 Write property test for no game-over while lives > 0 (Property 9)
    - **Property 9: Game-over does not trigger while lives > 0 and modules exist**
    - **Validates: Requirements 5.1, 5.2**
    - `fc.property(fc.integer({ min: 0 }), fc.integer({ min: 1, max: 10 }), (score, lives) => { ... })`
    - Assert `_gameOver` is not called when `this._lives > 0` regardless of score value

  - [x] 6.2 Update ScoreSystem unit test
    - In `tests/unit/ScoreSystem.test.js`: add/confirm test that `getScore()` returns 0 on construction
    - _Requirements: 5.3_

- [x] 7. Implement pause mechanic
  - [x] 7.1 Add pause state and overlay in `GameScene.create()`
    - Initialise `this._paused = false`
    - Create `this._pauseOverlay` as a `Phaser.GameObjects.Container` with `setDepth(1000)` and `setScrollFactor(0)`
    - Add semi-transparent black rectangle (full screen, alpha 0.6) to container
    - Add "PAUSED" text — `"Press Start 2P"`, 24px, white, `setOrigin(0.5)`, centred
    - Add "RESUME" text — `"Press Start 2P"`, 16px, white, interactive, `setOrigin(0.5)`
    - Add "QUIT" text — `"Press Start 2P"`, 16px, white, interactive, `setOrigin(0.5)`
    - Call `this._pauseOverlay.setVisible(false)` initially
    - _Requirements: 6.2, 6.3, 6.7_

  - [x] 7.2 Implement `_togglePause()` and key bindings
    - Implement `_togglePause()` following the design spec: toggle `this._paused`, call `this.time.paused = true/false`, call `this.physics.pause()/resume()`, toggle overlay visibility
    - Add guard `if (this._transitioning) return` at top of `_togglePause()`
    - In `create()`: add ESC key (`Phaser.Input.Keyboard.KeyCodes.ESC`) and P key listeners calling `_togglePause()` via `JustDown`
    - Wire "RESUME" text `pointerdown` to `_togglePause()`
    - Wire "QUIT" text `pointerdown` to `() => this.scene.start('MainMenuScene')`
    - Add pause guard `if (this._paused) return` in `update()` after the transitioning guard
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

  - [x] 7.3 Write property test for pause-resume round trip (Property 10)
    - **Property 10: Pause-resume is a round trip**
    - **Validates: Requirements 6.4**
    - In `tests/unit/GameplayOverhaulProperties.test.js`
    - `fc.property(fc.boolean(), (initialPaused) => { ... })` — call `_togglePause()` twice, assert `this._paused === false` and `this.time.paused === false`

  - [x] 7.4 Write property test for update no-op while paused (Property 11)
    - **Property 11: Update is a no-op while paused**
    - **Validates: Requirements 6.6**
    - `fc.property(fc.record({ x: fc.float(), y: fc.float() }), (pos) => { ... })` — set `this._paused = true`, call `update()`, assert bug positions and Kiro position unchanged

  - [x] 7.5 Write unit tests for pause mechanic
    - File: `tests/unit/PauseMechanic.test.js`
    - Test: `_togglePause()` sets `this._paused = true` and calls `physics.pause()`
    - Test: `_togglePause()` called twice restores running state
    - Test: `update()` returns early when `this._paused === true`
    - Test: QUIT handler calls `scene.start('MainMenuScene')`
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

- [x] 8. Adjust CRT shader constants
  - In `src/shaders/CRTShader.js`, change `this.vignetteStrength` from `0.4` to `0.25`
  - Change `this.scanlineAlpha` from `0.15` to `0.18`
  - _Requirements: 4.1, 4.2, 4.5_

  - [x] 8.1 Write property test for CRT vignette brightness (Property 7)
    - **Property 7: CRT vignette preserves brightness in centre region**
    - **Validates: Requirements 4.1, 4.5**
    - In `tests/unit/GameplayOverhaulProperties.test.js`
    - `fc.property(fc.float({ min: 0, max: 0.5 }), (dist) => { ... })` — assert `vignetteValue(dist, 0.25) >= 0.75`

  - [x] 8.2 Write property test for CRT scanline brightness (Property 8)
    - **Property 8: CRT scanline preserves brightness on odd rows**
    - **Validates: Requirements 4.2, 4.5**
    - `fc.property(fc.integer({ min: 1, max: 1000 }).filter(n => n % 2 !== 0), (row) => { ... })` — assert `scanlineValue(row, 0.18) >= 0.80` and `0.18 > 0`

- [x] 9. Clean up ProjectileGroup references
  - Delete `src/entities/ProjectileGroup.js`
  - In `tests/unit/ProjectileGroup.test.js`: remove or replace with a deprecation notice comment so the test suite does not fail on a missing module
  - Verify no remaining `import { ProjectileGroup }` references exist in the codebase
  - _Requirements: 1.7_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests live in a single file `tests/unit/GameplayOverhaulProperties.test.js` to keep the suite organised
- All property tests use `fast-check` with `{ numRuns: 100 }`
- Tasks 1–3 (config + BombGroup + GameScene wiring) must be completed before tasks 4–7 (spawn, pause, game-over fixes) since they all modify `GameScene`
- Task 9 (cleanup) should be the last code change to avoid breaking intermediate steps
