# Implementation Plan: Powerup System

## Overview

Extend the existing `PowerManager`, `HUDManager`, `GameScene`, `MainMenuScene`, and `BootScene` to support three score-triggered auto-activating powerups (Blast-a-Bug, Bug Free Zone, Extra Life), a `PowerupBanner` helper, and a one-time `TutorialScene` shown before level 1.

## Tasks

- [x] 1. Extend CONSTANTS with powerup configuration values
  - Add `POWERUP_BLAST_A_BUG_THRESHOLD`, `POWERUP_BUG_FREE_ZONE_THRESHOLD`, `POWERUP_EXTRA_LIFE_THRESHOLD` to `src/config/constants.js`
  - Add `BLAST_A_BUG_DURATION`, `BLAST_A_BUG_SCALE`, `BUG_FREE_ZONE_RADIUS`, `POWERUP_BANNER_DURATION`
  - _Requirements: 1.3, 2.2, 3.1, 4.2_

- [x] 2. Implement PowerupBanner helper class
  - [x] 2.1 Create `src/managers/PowerupBanner.js`
    - Constructor creates a centered `Phaser.GameObjects.Text` at depth 500, scrollFactor 0, initially hidden
    - `show(text)` sets text, makes visible, cancels any pending `delayedCall`, starts a new 1500ms auto-hide timer
    - `hide()` sets invisible
    - Font: `"Press Start 2P"`, 20px, fill `#ffff00`, `setOrigin(0.5)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.2 Write unit tests for PowerupBanner
    - Verify text content, font style, depth, and scrollFactor after construction
    - Verify `show()` sets text and visibility; verify `hide()` clears visibility
    - Verify calling `show()` a second time resets the timer (Property 7)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Write property test for PowerupBanner banner replacement (Property 7)
    - **Property 7: Banner replacement resets timer**
    - **Validates: Requirements 4.4**

- [x] 3. Extend PowerManager with milestone-based auto-activation
  - [x] 3.1 Add internal state and `checkMilestones` method to `src/managers/PowerManager.js`
    - Add `_lastTriggered = { blastABug: -1, bugFreeZone: -1, extraLife: -1 }` and `_blastABugUntil = 0`
    - Implement `checkMilestones(score, ctx)` — evaluates all three thresholds using deduplication check `score % threshold === 0 && score !== _lastTriggered[key]`
    - Blast-a-Bug: set `_blastABugUntil = now + CONSTANTS.BLAST_A_BUG_DURATION`, update `_lastTriggered.blastABug`
    - Bug Free Zone: iterate `ctx.bugs`, eliminate those with Euclidean distance < `CONSTANTS.BUG_FREE_ZONE_RADIUS` from `ctx.kiro`, update `_lastTriggered.bugFreeZone`
    - Extra Life: call `ctx.onLifeGained()`, update `_lastTriggered.extraLife`
    - Each activated powerup calls `ctx.banner.show(text)` and `ctx.soundManager.play('sfx_power_activate')`
    - Guard `ctx.onLifeGained` with null check before invocation
    - Score 0 must not trigger any powerup
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.5, 3.1, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.2 Add `blastABugUntil` getter and update `getState()` return shape
    - Add `get blastABugUntil()` returning `_blastABugUntil`
    - Extend `getState()` to include `blastABug: { active, remainingMs }`, `nextBlastABug`, `nextBugFreeZone`, `nextExtraLife` using `Math.ceil((score + 1) / threshold) * threshold` formula
    - `getState()` needs current score — accept it as a parameter or read from context
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.3 Write property tests for PowerManager milestone logic
    - **Property 1: Blast-a-Bug activates on every score multiple of 20**
    - **Validates: Requirements 1.1, 8.1, 8.2**

  - [x] 3.4 Write property test for Blast-a-Bug duration invariant (Property 2)
    - **Property 2: Blast-a-Bug duration invariant**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 3.5 Write property test for Bug Free Zone radius elimination (Property 3)
    - **Property 3: Bug Free Zone eliminates exactly the bugs within 50px**
    - **Validates: Requirements 2.1, 2.2, 2.5**

  - [x] 3.6 Write property test for Extra Life increment (Property 4)
    - **Property 4: Extra Life increments lives by exactly 1**
    - **Validates: Requirements 3.1, 3.4**

  - [x] 3.7 Write property test for multi-threshold activation (Property 5)
    - **Property 5: Multi-threshold scores activate all applicable powerups**
    - **Validates: Requirements 3.4, 8.2, 8.3, 8.4**

  - [x] 3.8 Write property test for deduplication (Property 6)
    - **Property 6: Threshold deduplication — no re-trigger on same score**
    - **Validates: Requirements 8.5**

  - [x] 3.9 Write property test for HUD next-threshold computation (Property 8)
    - **Property 8: HUD next-threshold computation is correct**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 3.10 Write property test for sfx_power_activate call count (Property 10)
    - **Property 10: sfx_power_activate plays exactly once per activation**
    - **Validates: Requirements 1.6, 2.4, 3.3, 6.3, 6.4**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend HUDManager to display powerup thresholds
  - [x] 5.1 Add new HUD text objects and update `update()` in `src/managers/HUDManager.js`
    - Add `_blastABugText`, `_bugFreeZoneText`, `_extraLifeText` in constructor, positioned lower-right, scrollFactor 0
    - Update `update()` to render "BAB: Xpts" / "BAB: Xs" (when active), "BFZ: Xpts", "EL: Xpts" from the extended `powerState` shape
    - Update every frame to reflect current score and active state
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Write unit tests for HUDManager powerup threshold display
    - Verify new text objects are created with correct scroll factor and position
    - Verify correct label text for specific score examples (e.g., score 0 → "BAB: 20pts", score 20 → "BAB: 40pts")
    - Verify "BAB: Xs" format when Blast-a-Bug is active
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Wire PowerupBanner and updated PowerManager into GameScene
  - [x] 6.1 Modify `src/scenes/GameScene.js` to instantiate `PowerupBanner` and pass context to `checkMilestones`
    - Import and instantiate `PowerupBanner` in `create()` as `this._banner`
    - Replace `checkUnlocks` callback with `checkMilestones(score, { bugs, kiro, onLifeGained, soundManager, banner })` in the `ScoreSystem` constructor call
    - `onLifeGained` callback: `() => { this._lives += 1; }`
    - Pass updated `powerState` (with score) to `HUDManager.update()` each frame
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3, 8.1_

- [x] 7. Implement TutorialScene
  - [x] 7.1 Create `src/scenes/TutorialScene.js`
    - `init(data)` stores `{ level }`; if `level > 1`, immediately transition to `GameScene` with `{ level }`
    - `create()` renders title and three powerup descriptions using `"Press Start 2P"` font
    - Description strings: "Every 20 pts — BLAST-A-BUG! Bigger projectile for 5 seconds", "Every 40 pts — BUG FREE ZONE! Eliminates bugs within 50px", "Every 100 pts — EXTRA LIFE! +1 life"
    - Dismiss button ("PRESS ANY KEY / CLICK") transitions to `GameScene` with `{ level: 1 }` using `_transitioning` guard
    - Also listen for any keyboard key press to dismiss
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 7.2 Write unit tests for TutorialScene
    - Verify all three powerup description strings are present
    - Verify dismissal routes to `GameScene` at level 1
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x] 7.3 Write property test for tutorial routing (Property 9)
    - **Property 9: Tutorial shown only for level 1**
    - **Validates: Requirements 7.1, 7.6**

- [x] 8. Register TutorialScene in BootScene and update MainMenuScene routing
  - [x] 8.1 Add `TutorialScene` to the scene list in `src/scenes/BootScene.js`
    - Import `TutorialScene` and add it to the Phaser game config scene array
    - _Requirements: 7.1_

  - [x] 8.2 Update `startBtn` handler in `src/scenes/MainMenuScene.js`
    - Change handler to route to `'TutorialScene'` when `progress.level === 1`, otherwise `'GameScene'`
    - _Requirements: 7.1, 7.6_

  - [x] 8.3 Write unit tests for MainMenuScene routing
    - Verify routing to `TutorialScene` when level is 1
    - Verify routing directly to `GameScene` when level > 1
    - _Requirements: 7.1, 7.6_

- [x] 9. Implement Blast-a-Bug projectile scale effect in ProjectileGroup
  - [x] 9.1 Modify `src/entities/ProjectileGroup.js` to support scaled projectiles
    - Add a `setBlastScale(scale)` method (or equivalent) that stores the active scale multiplier
    - Apply the scale to newly fired projectiles when Blast-a-Bug is active
    - `GameScene` or `Kiro` must pass the current scale from `PowerManager.blastABugUntil` each frame
    - Revert to scale 1 when `blastABugUntil` has passed
    - _Requirements: 1.2, 1.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All property tests live in `tests/unit/PowerupSystemProperties.test.js`
- Use `fast-check` with `{ numRuns: 100 }` for all property tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
