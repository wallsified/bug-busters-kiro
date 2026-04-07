# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Five Bug Conditions (Visibility, Replicator, Unlock Sound, Spacebar Capture, Favicon)
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: Each test targets the concrete failing case for its bug condition
  - Create `tests/unit/MultiBugConditions.test.js` with the following five checks:
    - **Bug 1**: Call `_eliminateBug(bug)` on a mock bug with `active: true, visible: true`. Assert `bug.visible === false` after the call. (isBugCondition_1: bug.active === false AND bug.visible !== false)
    - **Bug 2**: Call `_spawnEnemies` with a level config containing a Replicator entry. Assert `_bugs` contains a `Replicator` instance. (isBugCondition_2: Replicator config present AND _bugs has no Replicator after spawn)
    - **Bug 3**: Call `checkUnlocks(POWER_UNLOCK_FREEZE, mockSoundManager)` on a fresh PowerManager. Assert `mockSoundManager.play` was called with `'sfx_power_unlock'`. (isBugCondition_3: score crosses threshold AND sfx_power_unlock NOT played)
    - **Bug 4**: After `GameScene.create()`, assert `keyboard.captures` includes `Phaser.Input.Keyboard.KeyCodes.SPACE`. (isBugCondition_4: SPACE keyCode NOT in keyboard.captures)
    - **Bug 5**: Parse `index.html` and assert a `<link rel="icon" href="favicon.ico">` element exists in `<head>`. (isBugCondition_5: no `<link rel="icon">` in head)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: All five tests FAIL (this is correct — it proves each bug exists)
  - Document counterexamples found:
    - Bug 1: `bug.visible` remains `true` after `_eliminateBug`
    - Bug 2: `_bugs` array has length 0 for a Replicator-only level
    - Bug 3: `soundManager.play` never called with `'sfx_power_unlock'`
    - Bug 4: `keyboard.captures` does not include `SPACE`
    - Bug 5: no `<link rel="icon">` found in `index.html`
  - Mark task complete when all five tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [x] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Non-Buggy Behaviors Unchanged Across All Five Fixes
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code first
  - Create `tests/unit/MultiBugPreservation.test.js` with fast-check property tests:
    - **Pres 1** (Req 3.1): For any bomb that expires without hitting an enemy, assert no score is awarded and no enemy is affected. Observe on unfixed code: bomb deactivation is independent of enemy state.
    - **Pres 2** (Req 3.2): For any Kiro hit by an enemy, assert life deduction and invincibility trigger correctly. Observe on unfixed code: `triggerInvincibility()` sets `_invincibleUntil = now + INVINCIBILITY_DURATION`.
    - **Pres 3** (Req 3.3): For any patch_bomb activation, assert all enemies within radius are eliminated. Observe on unfixed code: `activate('patch_bomb', ...)` calls `onBugEliminated` for each bug within `PATCH_BOMB_RADIUS`.
    - **Pres 4** (Req 3.4): For any level config with only Wanderers/Seekers (no Replicators), assert `_bugs` count matches config count. Observe on unfixed code: Wanderer/Seeker branches correctly assign to `bug`.
    - **Pres 5** (Req 3.5): For any Replicator-spawned Wanderer via `_onSpawn` callback, assert it is added to `_bugs` with collisions. Observe on unfixed code: callback pushes new Wanderer and calls `_setupBugCollisions`.
    - **Pres 6** (Req 3.6): For any `checkUnlocks` call after a power is already unlocked, assert `sfx_power_unlock` is NOT played again. Observe on unfixed code: `unlocked` flag prevents re-entry.
    - **Pres 7** (Req 3.7): For any Q/E power activation, assert `sfx_power_activate` is played (not `sfx_power_unlock`). Observe on unfixed code: `activate()` does not call any sound — sound is played in `GameScene.update()`.
    - **Pres 8** (Req 3.8): For any score change that does not cross an unlock threshold, assert no sound is played. Observe on unfixed code: `checkUnlocks` only sets `unlocked = true`, no sound call.
    - **Pres 9** (Req 3.9): For any arrow/WASD input, assert Kiro velocity is correct. Observe on unfixed code: `update()` sets velocity to `±PLAYER_SPEED` on the correct axis.
    - **Pres 10** (Req 3.12): Parse `index.html` and assert all existing `<head>` elements (fonts, Phaser CDN, meta tags) are present and unchanged.
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.12_

- [x] 3. Fix all five bugs

  - [x] 3.1 Bug 1 — Add `setVisible(false)` in `_eliminateBug` (`src/scenes/GameScene.js`)
    - In `_eliminateBug`, add `bug.setVisible(false)` immediately after `bug.setActive(false)`
    - Ensures sprite is removed from view and stops triggering further overlap callbacks
    - _Bug_Condition: isBugCondition_1(bug) → bug.active === false AND bug.visible !== false_
    - _Expected_Behavior: after _eliminateBug, bug.active === false AND bug.visible === false_
    - _Preservation: bombs expiring without hitting enemies unaffected (Req 3.1); patch_bomb power continues to eliminate enemies in radius (Req 3.3)_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Bug 2 — Assign Replicator to `bug` variable in `_spawnEnemies` (`src/scenes/GameScene.js`)
    - In the `else if (enemyDef.type === 'Replicator')` branch, change `new Replicator(...)` to `bug = new Replicator(...)`
    - Ensures the Replicator instance is pushed into `_bugs` and participates in the game loop and collision system
    - _Bug_Condition: isBugCondition_2(levelConfig) → Replicator config present AND _bugs has no Replicator after _spawnEnemies_
    - _Expected_Behavior: _bugs contains exactly the Replicator instances defined in the level config_
    - _Preservation: Wanderer/Seeker spawn unaffected (Req 3.4); Replicator-spawned Wanderers via callback unaffected (Req 3.5)_
    - _Requirements: 2.4, 2.5_

  - [x] 3.3 Bug 3 — Add `soundManager` parameter to `checkUnlocks` (`src/managers/PowerManager.js` + call site in `src/scenes/GameScene.js`)
    - In `PowerManager.checkUnlocks`, add `soundManager` as a second parameter
    - After setting `unlocked = true` for each power, call `if (soundManager) soundManager.play('sfx_power_unlock')`
    - In `GameScene.create()`, update the `ScoreSystem` callback to pass `this._soundManager`: `this._powerManager.checkUnlocks(score, this._soundManager)`
    - _Bug_Condition: isBugCondition_3 → score crosses POWER_UNLOCK_FREEZE or POWER_UNLOCK_PATCH_BOMB for the first time AND sfx_power_unlock NOT played_
    - _Expected_Behavior: sfx_power_unlock played exactly once per unlock event_
    - _Preservation: already-unlocked powers do not re-trigger sound (Req 3.6); Q/E activation still plays sfx_power_activate (Req 3.7); score changes below threshold play no sound (Req 3.8)_
    - _Requirements: 2.6, 2.7_

  - [x] 3.4 Bug 4 — Capture spacebar key in `GameScene.create()` (`src/scenes/GameScene.js`)
    - After `this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)`, add:
      `this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE])`
    - Prevents the browser from receiving the spacebar event and scrolling the page
    - _Bug_Condition: isBugCondition_4(keyCode) → keyCode === SPACE AND keyboard.captures does NOT include SPACE_
    - _Expected_Behavior: keyboard.captures includes SPACE; browser default behavior prevented_
    - _Preservation: arrow keys and WASD continue to move Kiro (Req 3.9); Q/E continue to activate powers (Req 3.10); ESC/P continue to toggle pause (Req 3.11)_
    - _Requirements: 2.8, 2.9_

  - [x] 3.5 Bug 5 — Add favicon link to `index.html`
    - In `<head>`, after `<title>Bug Busters</title>`, add: `<link rel="icon" href="favicon.ico" />`
    - Ensures the browser tab displays the favicon
    - _Bug_Condition: isBugCondition_5(htmlDocument) → head does NOT contain `<link rel="icon" href="favicon.ico">`_
    - _Expected_Behavior: `<link rel="icon" href="favicon.ico">` present in `<head>`_
    - _Preservation: all other head elements (fonts, Phaser CDN, meta tags) remain unchanged (Req 3.12)_
    - _Requirements: 2.10_

  - [x] 3.6 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Five Bug Conditions Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for all five bugs
    - When all five tests pass, it confirms the expected behavior is satisfied
    - Run `tests/unit/MultiBugConditions.test.js` on FIXED code
    - **EXPECTED OUTCOME**: All five tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Behaviors Unchanged After All Fixes
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `tests/unit/MultiBugPreservation.test.js` on FIXED code
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm all tests still pass after fixes (no regressions introduced)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npm test`
  - Ensure `MultiBugConditions.test.js` and `MultiBugPreservation.test.js` all pass
  - Ensure no existing tests in `tests/unit/` regressed
  - Ask the user if any questions arise
