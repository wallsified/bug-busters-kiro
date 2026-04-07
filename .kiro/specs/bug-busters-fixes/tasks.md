# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Eight Bug Conditions (Replicator size, projectile visibility, Kiro spawn overlap, Kiro bounds, enemy bounds, canvas centering, game_over sound, controls panel)
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test 1.1 — Replicator display size: construct `new Replicator(scene, x, y)` and assert `displayWidth === 48 && displayHeight === 48` (isBugCondition_1: entity instanceof Replicator AND displayWidth ≠ 48 OR displayHeight ≠ 48)
  - Test 1.2 — Projectile visibility: call `projectiles.fire(x, y, direction)` with active count < 3 and assert returned projectile has `active === true && visible === true` (isBugCondition_2: projectile.active = true AND projectile.visible = false)
  - Test 1.3 — Kiro spawn overlap: assert distance from `(80, 80)` to every enemy spawn in all three LEVELS configs is ≥ 96px (isBugCondition_3: dist < SAFE_SPAWN_DISTANCE for any enemy in levelConfig)
  - Test 1.4 — Kiro world bounds: assert `kiro.body.collideWorldBounds === true` after construction (isBugCondition_4: kiro exits [0,800]×[0,600])
  - Test 1.5 — Enemy world bounds: assert `bug.body.collideWorldBounds === true` for Wanderer, Seeker, Replicator after construction (isBugCondition_5: enemy exits [0,800]×[0,600])
  - Test 1.6 — game_over sound: mock `SoundManager.play`, trigger `_gameOver()`, assert `play('game_over')` was called (isBugCondition_7: _gameOver() called AND play('game_over') NOT called)
  - Test 1.7 — Controls panel: after `MainMenuScene.create()`, assert at least one text object contains 'WASD' or 'MOVE' or 'ARROW' (isBugCondition_8: no text with control binding descriptions)
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., Replicator displayWidth returns 0 or 32; projectile.visible is false; distance (80,80)→(100,100) ≈ 28px; collideWorldBounds is false; play('game_over') never called; no controls text found)
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Correct Behaviors Across All Eight Fixes
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code behavior for non-buggy inputs first
  - Observe: `new Wanderer(scene, x, y).displayWidth` returns correct value on unfixed code → write property asserting Wanderer/Seeker display size is unchanged after Bug 1 fix
  - Observe: `projectiles.fire()` when 3 already active returns no new projectile on unfixed code → write property asserting limit enforcement is preserved after Bug 2 fix
  - Observe: Kiro collision handling (life deduction + invincibility) works correctly on unfixed code → write property asserting collision behavior is unchanged after Bug 3 fix
  - Observe: Kiro velocity in interior positions (away from edges) on unfixed code → write property-based test generating random interior positions and asserting velocity output is unchanged after Bug 4 fix
  - Observe: Enemy AI velocity output (wander/seek/replicate) for interior positions on unfixed code → write property-based test asserting AI behavior is unchanged after Bug 5 fix
  - Observe: `sfx_fire`, `sfx_eliminate`, `sfx_life_lost`, `sfx_power_activate` all play correctly on unfixed code → write property asserting these sounds are unaffected after Bug 7 fix
  - Observe: start button `pointerdown` calls `scene.start('GameScene', { level: progress.level })` on unfixed code → write property asserting button behavior is unchanged after Bug 8 fix
  - Write property-based tests with `fast-check` (`{ numRuns: 100 }`) for movement/physics behaviors
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.10_

- [x] 3. Fix all eight bugs

  - [x] 3.1 Bug 1 — Add `setDisplaySize(48, 48)` to Replicator constructor
    - In `src/entities/Replicator.js` constructor, after `super(scene, x, y, 'replicator')`, add `this.setDisplaySize(48, 48)`
    - _Bug_Condition: isBugCondition_1(entity) where entity instanceof Replicator AND displayWidth ≠ 48_
    - _Expected_Behavior: entity.displayWidth === 48 AND entity.displayHeight === 48_
    - _Preservation: Wanderer and Seeker display sizes must remain unchanged (3.1)_
    - _Requirements: 2.1, 3.1_

  - [x] 3.2 Bug 2 — Add `setVisible(true)` in ProjectileGroup.fire()
    - In `src/entities/ProjectileGroup.js` `fire()`, add `projectile.setVisible(true)` when reactivating a pooled projectile (`existing`) alongside `setActive(true)`
    - Also add `setVisible(true)` on the mock base class `create()` object so tests pass in Jest environment
    - _Bug_Condition: isBugCondition_2(projectile) where projectile.active = true AND projectile.visible = false_
    - _Expected_Behavior: projectile.active === true AND projectile.visible === true AND velocity ≠ 0_
    - _Preservation: Projectile limit of 3 must remain enforced — firing beyond limit stays a no-op (3.2)_
    - _Requirements: 2.2, 3.2_

  - [x] 3.3 Bug 3 — Move Kiro spawn position in GameScene.create()
    - In `src/scenes/GameScene.js` `create()`, change `new Kiro(this, 80, 80)` to `new Kiro(this, 80, 300)`
    - Verify distance from `(80, 300)` to all enemy spawns across all three LEVELS is ≥ 96px
    - _Bug_Condition: isBugCondition_3(kiroSpawn, levelConfig) where dist((80,80), (100,100)) ≈ 28px < 96px_
    - _Expected_Behavior: distance(kiroSpawn_fixed, every enemy spawn) ≥ 96px for all levels_
    - _Preservation: Collision handling (life deduction + invincibility) must remain unchanged (3.5)_
    - _Requirements: 2.3, 3.5_

  - [x] 3.4 Bug 4 — Enable collideWorldBounds for Kiro
    - In `src/entities/Kiro.js` constructor, after `scene.physics.add.existing(this)`, add `this.body.setCollideWorldBounds(true)` (guarded by `if (typeof Phaser !== 'undefined' && this.body)`)
    - _Bug_Condition: isBugCondition_4(kiro, worldBounds) where kiro exits [0,800]×[0,600]_
    - _Expected_Behavior: kiro.x IN [0,800] AND kiro.y IN [0,600] after any movement_
    - _Preservation: Kiro free movement in interior positions must remain unchanged (3.3)_
    - _Requirements: 2.4, 3.3_

  - [x] 3.5 Bug 5 — Enable collideWorldBounds for all enemies via Bug base class
    - In `src/entities/Bug.js` constructor, after `scene.physics.add.existing(this)`, add `this.body.setCollideWorldBounds(true)` (guarded by `if (typeof Phaser !== 'undefined' && this.body)`)
    - This applies to Wanderer, Seeker, and Replicator via inheritance
    - _Bug_Condition: isBugCondition_5(enemy, worldBounds) where enemy exits [0,800]×[0,600]_
    - _Expected_Behavior: enemy.x IN [0,800] AND enemy.y IN [0,600] after any update_
    - _Preservation: Enemy AI behavior (wander/seek/replicate) in interior positions must remain unchanged (3.4, 3.7)_
    - _Requirements: 2.5, 3.4, 3.7_

  - [x] 3.6 Bug 6 — Verify/fix canvas centering in index.html
    - Inspect `index.html` scale config: confirm `mode: Phaser.Scale.FIT` and `autoCenter: Phaser.Scale.CENTER_BOTH` are present (they are already in the file)
    - Remove `display: block` from the `canvas` CSS rule to avoid conflicting with the body flex centering, or confirm the scale config alone is sufficient
    - _Bug_Condition: isBugCondition_6(phaserConfig) where autoCenter ≠ CENTER_BOTH or CSS conflicts_
    - _Expected_Behavior: canvas centered horizontally and vertically in viewport_
    - _Requirements: 2.6_

  - [x] 3.7 Bug 7 — Register game_over audio asset and play it on game over
    - In `src/managers/AssetLoader.js` `preload()`, add `scene.load.audio('game_over', 'assets/audio/game_over.mp3')`
    - In `src/scenes/GameScene.js` `_gameOver()`, add `this._soundManager.play('game_over')` before `this.scene.start('GameOverScene', ...)`
    - _Bug_Condition: isBugCondition_7(trigger) where _gameOver() called AND play('game_over') NOT called_
    - _Expected_Behavior: soundManager.play('game_over') called before/during transition to GameOverScene_
    - _Preservation: sfx_fire, sfx_eliminate, sfx_life_lost, sfx_power_activate must continue to play correctly (3.10); GameOverScene must still receive correct score and level (3.6)_
    - _Requirements: 2.7, 3.6, 3.10_

  - [x] 3.8 Bug 8 — Add controls panel to MainMenuScene
    - In `src/scenes/MainMenuScene.js` `create()`, add a text block below the start button listing control bindings using `"Press Start 2P"` font at 8px
    - Content: Move: ARROW KEYS / WASD | Fire: SPACE / CLICK | Freeze: Q | Patch Bomb: E
    - _Bug_Condition: isBugCondition_8(mainMenuScene) where no text with control binding descriptions exists_
    - _Expected_Behavior: at least one text object in scene contains control binding descriptions_
    - _Preservation: Start button pointerdown must still call scene.start('GameScene', { level: progress.level }) (3.8)_
    - _Requirements: 2.8, 3.8_

  - [x] 3.9 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Eight Bug Conditions Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for all eight bugs
    - When these tests pass, it confirms the expected behavior is satisfied for each fix
    - Run all bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

  - [x] 3.10 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions After All Eight Fixes
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm all existing correct behaviors are unaffected by the eight fixes

- [-] 4. Checkpoint — Ensure all tests pass
  - Run `npm test` and confirm all tests pass
  - Ensure all tests pass; ask the user if questions arise
