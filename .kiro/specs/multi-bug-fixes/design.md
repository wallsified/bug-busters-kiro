# Multi-Bug Fixes — Bugfix Design

## Overview

This document covers the design for fixing five bugs in Bug Busters:

1. **Bomb elimination** — `_eliminateBug` calls `setActive(false)` but omits `setVisible(false)`, leaving enemy sprites visible and triggering repeated overlap callbacks.
2. **Replicator not spawning** — `_spawnEnemies` creates `new Replicator(...)` but never assigns it to `bug`, so the guard `if (bug)` fails and the Replicator is silently dropped.
3. **Power-up unlock silent** — `PowerManager.checkUnlocks` sets `unlocked = true` but never calls `soundManager.play('sfx_power_unlock')`.
4. **Spacebar browser scroll** — `GameScene` does not capture the spacebar key, so the browser intercepts it and scrolls the page.
5. **Favicon missing** — `index.html` has no `<link rel="icon">` element, so the browser tab shows no icon.

Each fix is minimal and targeted. The strategy is: explore the bug on unfixed code, apply the fix, then verify preservation of unaffected behavior.

---

## Glossary

- **Bug_Condition (C)**: The condition that identifies inputs or states that trigger a specific bug.
- **Property (P)**: The desired correct behavior when the bug condition holds.
- **Preservation**: Existing behaviors that must remain unchanged after the fix.
- **`_eliminateBug(bug)`**: Method in `src/scenes/GameScene.js` that deactivates an enemy and awards points.
- **`_spawnEnemies(levelConfig)`**: Method in `src/scenes/GameScene.js` that instantiates enemies from level config and pushes them into `_bugs`.
- **`checkUnlocks(score)`**: Method in `src/managers/PowerManager.js` that unlocks powers when score thresholds are crossed.
- **`soundManager`**: Instance of `SoundManager` in `GameScene`, passed to `PowerManager` to play audio feedback.
- **`keyboard.addCapture`**: Phaser API that prevents the browser from receiving specified key events.
- **`active`**: Phaser sprite property; `false` means the entity is logically removed from the game.
- **`visible`**: Phaser sprite property; `false` means the sprite is not rendered.

---

## Bug Details

### Bug 1 — Bomb Elimination

#### Bug Condition

The bug manifests when a bomb overlaps an active enemy. `_eliminateBug` calls `bug.setActive(false)` but never calls `bug.setVisible(false)`, so the sprite remains rendered and the physics body continues triggering overlap callbacks on subsequent frames.

**Formal Specification:**
```
FUNCTION isBugCondition_1(bug)
  INPUT: bug — a game entity (Wanderer, Seeker, Replicator)
  OUTPUT: boolean

  RETURN bug.active === false
         AND bug.visible !== false
END FUNCTION
```

#### Examples

- Bomb hits a Wanderer → `setActive(false)` called, sprite stays visible, overlap fires again next frame → score awarded multiple times.
- Patch_bomb power eliminates a Seeker → same issue: sprite visible, body still active in physics.
- Expected: after `_eliminateBug`, `bug.active === false` AND `bug.visible === false`.

---

### Bug 2 — Replicator Not Spawning

#### Bug Condition

The bug manifests when a level config includes a `Replicator` enemy. The `else if (enemyDef.type === 'Replicator')` branch creates the instance but never assigns it to `bug`, so `if (bug)` evaluates to `false` and the Replicator is never pushed into `_bugs`.

**Formal Specification:**
```
FUNCTION isBugCondition_2(levelConfig)
  INPUT: levelConfig — a level configuration object
  OUTPUT: boolean

  RETURN levelConfig.enemies.some(e => e.type === 'Replicator')
         AND _bugs does NOT contain any Replicator instance after _spawnEnemies(levelConfig)
END FUNCTION
```

#### Examples

- Level 3 has a Replicator at (400, 300) → after `_spawnEnemies`, `_bugs` contains no Replicator → no collision, no update, no spawning of Wanderers.
- Expected: `_bugs` contains exactly the Replicator instances defined in the level config.

---

### Bug 3 — Power-Up Unlock Silent

#### Bug Condition

The bug manifests when the player's score crosses `POWER_UNLOCK_FREEZE` or `POWER_UNLOCK_PATCH_BOMB` for the first time. `checkUnlocks` sets `unlocked = true` but does not call `soundManager.play('sfx_power_unlock')`.

**Formal Specification:**
```
FUNCTION isBugCondition_3(previousScore, newScore, powerName)
  INPUT: previousScore — score before the update
         newScore — score after the update
         powerName — 'freeze' or 'patch_bomb'
  OUTPUT: boolean

  threshold := POWER_UNLOCK_FREEZE if powerName === 'freeze'
               else POWER_UNLOCK_PATCH_BOMB
  RETURN previousScore < threshold
         AND newScore >= threshold
         AND sfx_power_unlock NOT played
END FUNCTION
```

#### Examples

- Score goes from 140 to 160 (crosses `POWER_UNLOCK_FREEZE = 150`) → freeze unlocked silently, no audio cue.
- Score goes from 290 to 310 (crosses `POWER_UNLOCK_PATCH_BOMB = 300`) → patch_bomb unlocked silently.
- Expected: `sfx_power_unlock` played exactly once per unlock event.

---

### Bug 4 — Spacebar Browser Scroll

#### Bug Condition

The bug manifests when the player presses the spacebar during gameplay. Phaser registers the key via `addKey` but does not call `keyboard.addCapture`, so the browser also receives the event and scrolls the page.

**Formal Specification:**
```
FUNCTION isBugCondition_4(keyCode)
  INPUT: keyCode — a keyboard key code
  OUTPUT: boolean

  RETURN keyCode === SPACE
         AND keyboard.captures does NOT include keyCode
END FUNCTION
```

#### Examples

- Player presses spacebar to place a bomb → browser scrolls down, viewport shifts, game appears frozen.
- Expected: spacebar (and other registered control keys) are captured by Phaser so the browser never receives them.

---

### Bug 5 — Favicon Missing

#### Bug Condition

The bug manifests when the game page loads. `index.html` has no `<link rel="icon">` element, so the browser tab shows no favicon.

**Formal Specification:**
```
FUNCTION isBugCondition_5(htmlDocument)
  INPUT: htmlDocument — the parsed index.html
  OUTPUT: boolean

  RETURN htmlDocument.head does NOT contain
         <link rel="icon" href="favicon.ico">
END FUNCTION
```

#### Examples

- Browser opens `index.html` → tab shows default browser icon instead of `favicon.ico`.
- Expected: `<link rel="icon" href="favicon.ico">` present in `<head>`.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Bombs that expire without hitting an enemy continue to deactivate without affecting score or enemies (Req 3.1).
- Kiro hit by an enemy continues to lose a life and trigger invincibility (Req 3.2).
- Patch_bomb power continues to eliminate all enemies within radius (Req 3.3).
- Wanderer and Seeker enemies continue to spawn and register collisions correctly (Req 3.4).
- Replicator-spawned Wanderers continue to be added to `_bugs` with collisions (Req 3.5).
- Already-unlocked powers do not re-trigger the unlock sound on further score increases (Req 3.6).
- Q/E power activation continues to play `sfx_power_activate`, not `sfx_power_unlock` (Req 3.7).
- Score changes that don't cross a threshold continue to update the HUD without playing any sound (Req 3.8).
- Arrow keys and WASD continue to move Kiro correctly (Req 3.9).
- Q and E continue to activate powers (Req 3.10).
- ESC and P continue to toggle the pause overlay (Req 3.11).
- All other assets (fonts, Phaser CDN, game modules) continue to load without interference (Req 3.12).

**Scope:**
All inputs and behaviors that do NOT involve the five bug conditions above must be completely unaffected by these fixes.

---

## Hypothesized Root Cause

### Bug 1 — Bomb Elimination

1. **Missing `setVisible(false)` call**: `_eliminateBug` was written to match the pattern `setActive(false)` + stop velocity, but the corresponding `setVisible(false)` was omitted. Without it, the Phaser physics body remains active for overlap detection even though `active === false` is checked in the guard — the guard fires correctly but the sprite is still rendered and the overlap system may re-fire before the next frame clears it.

### Bug 2 — Replicator Not Spawning

1. **Unassigned variable in conditional branch**: The `else if (enemyDef.type === 'Replicator')` block calls `new Replicator(...)` but the result is not assigned to `bug`. The `Wanderer` and `Seeker` branches correctly do `bug = new Wanderer(...)` / `bug = new Seeker(...)`. The Replicator branch was likely written as a callback-heavy block and the assignment was forgotten.

### Bug 3 — Power-Up Unlock Silent

1. **`checkUnlocks` has no reference to `SoundManager`**: `PowerManager` was designed as a pure state manager. When the audio feedback requirement was added, `checkUnlocks` was not updated to accept or call a sound manager. The fix requires passing a `soundManager` reference (or a callback) into `checkUnlocks`.

### Bug 4 — Spacebar Browser Scroll

1. **`addKey` does not capture**: Phaser's `addKey` registers a key for reading in the game loop but does not prevent the browser from also receiving the event. `keyboard.addCapture(keyCode)` (or passing the key codes to `keyboard.addCapture`) is required to stop propagation. This call was omitted in `GameScene.create()`.

### Bug 5 — Favicon Missing

1. **`<link rel="icon">` tag absent from `index.html`**: The `favicon.ico` file exists at the project root but was never referenced in the HTML `<head>`. The browser requests `/favicon.ico` by convention but the explicit link tag is needed for reliable cross-browser display.

---

## Correctness Properties

Property 1: Bug Condition — Enemy Fully Deactivated on Elimination

_For any_ active enemy `bug` passed to `_eliminateBug`, the fixed function SHALL set both `bug.active === false` AND `bug.visible === false`, ensuring the sprite is removed from view and no further overlap callbacks are triggered for that enemy.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition — Replicator Registered in _bugs

_For any_ level configuration that includes one or more Replicator entries, the fixed `_spawnEnemies` SHALL assign the `new Replicator(...)` instance to `bug` and push it into `_bugs`, so it participates in the game loop and collision system.

**Validates: Requirements 2.4, 2.5**

Property 3: Bug Condition — Unlock Sound Played on First Unlock

_For any_ call to `checkUnlocks(score)` where `score` crosses a power unlock threshold for the first time, the fixed `checkUnlocks` SHALL call `soundManager.play('sfx_power_unlock')` exactly once per unlock event.

**Validates: Requirements 2.6, 2.7**

Property 4: Bug Condition — Spacebar Captured by Phaser

_For any_ keyboard event where the spacebar is pressed during gameplay, the fixed `GameScene` SHALL have registered the spacebar key code with `keyboard.addCapture` so the browser default behavior is prevented.

**Validates: Requirements 2.8, 2.9**

Property 5: Bug Condition — Favicon Link Present

_For any_ load of `index.html`, the fixed document SHALL contain a `<link rel="icon" href="favicon.ico">` element in `<head>` so the browser tab displays the favicon.

**Validates: Requirements 2.10**

Property 6: Preservation — Non-Buggy Behaviors Unchanged

_For any_ input where none of the five bug conditions hold (isBugCondition_1 through isBugCondition_5 all return false), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing gameplay mechanics, audio events, and asset loading.

**Validates: Requirements 3.1–3.12**

---

## Fix Implementation

### Bug 1 — `src/scenes/GameScene.js` → `_eliminateBug`

**Specific Change**: Add `bug.setVisible(false)` immediately after `bug.setActive(false)`.

```
BEFORE:
  bug.setActive(false);
  if (bug.body) { bug.body.velocity.x = 0; bug.body.velocity.y = 0; }

AFTER:
  bug.setActive(false);
  bug.setVisible(false);
  if (bug.body) { bug.body.velocity.x = 0; bug.body.velocity.y = 0; }
```

---

### Bug 2 — `src/scenes/GameScene.js` → `_spawnEnemies`

**Specific Change**: Assign the `new Replicator(...)` result to `bug` in the `else if` branch.

```
BEFORE:
  } else if (enemyDef.type === 'Replicator') {
    new Replicator(this, enemyDef.x, enemyDef.y, (spawnX, spawnY) => { ... });
  }

AFTER:
  } else if (enemyDef.type === 'Replicator') {
    bug = new Replicator(this, enemyDef.x, enemyDef.y, (spawnX, spawnY) => { ... });
  }
```

---

### Bug 3 — `src/managers/PowerManager.js` → `checkUnlocks`

**Specific Change**: Accept a `soundManager` parameter and call `soundManager.play('sfx_power_unlock')` when a power is newly unlocked.

```
BEFORE:
  checkUnlocks(score) {
    if (!this._powers.freeze.unlocked && score >= CONSTANTS.POWER_UNLOCK_FREEZE) {
      this._powers.freeze.unlocked = true;
    }
    if (!this._powers.patch_bomb.unlocked && score >= CONSTANTS.POWER_UNLOCK_PATCH_BOMB) {
      this._powers.patch_bomb.unlocked = true;
    }
  }

AFTER:
  checkUnlocks(score, soundManager) {
    if (!this._powers.freeze.unlocked && score >= CONSTANTS.POWER_UNLOCK_FREEZE) {
      this._powers.freeze.unlocked = true;
      if (soundManager) soundManager.play('sfx_power_unlock');
    }
    if (!this._powers.patch_bomb.unlocked && score >= CONSTANTS.POWER_UNLOCK_PATCH_BOMB) {
      this._powers.patch_bomb.unlocked = true;
      if (soundManager) soundManager.play('sfx_power_unlock');
    }
  }
```

Also update the call site in `GameScene.create()`:

```
BEFORE:
  this._scoreSystem = new ScoreSystem((score) => {
    this._powerManager.checkUnlocks(score);
  });

AFTER:
  this._scoreSystem = new ScoreSystem((score) => {
    this._powerManager.checkUnlocks(score, this._soundManager);
  });
```

---

### Bug 4 — `src/scenes/GameScene.js` → `create()`

**Specific Change**: After registering the spacebar key with `addKey`, call `this.input.keyboard.addCapture` for the spacebar (and optionally other control keys) to prevent browser default behavior.

```
AFTER this._spaceKey = this.input.keyboard.addKey(...):
  this.input.keyboard.addCapture([
    Phaser.Input.Keyboard.KeyCodes.SPACE
  ]);
```

---

### Bug 5 — `index.html` → `<head>`

**Specific Change**: Add `<link rel="icon" href="favicon.ico">` inside `<head>`.

```
AFTER <title>Bug Busters</title>:
  <link rel="icon" href="favicon.ico" />
```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write unit tests that exercise each bug condition directly. Run on UNFIXED code to observe failures.

**Test Cases**:

1. **Bug 1 — Visibility after elimination** (will fail on unfixed code):
   Call `_eliminateBug(bug)` on a mock bug with `active: true, visible: true`. Assert `bug.visible === false` after the call.

2. **Bug 2 — Replicator in _bugs** (will fail on unfixed code):
   Call `_spawnEnemies` with a level config containing a Replicator. Assert `_bugs` contains a `Replicator` instance.

3. **Bug 3 — Unlock sound played** (will fail on unfixed code):
   Call `checkUnlocks(POWER_UNLOCK_FREEZE)` with a mock `soundManager`. Assert `soundManager.play` was called with `'sfx_power_unlock'`.

4. **Bug 4 — Keyboard capture registered** (will fail on unfixed code):
   After `GameScene.create()`, assert that `keyboard.captures` includes `SPACE`.

5. **Bug 5 — Favicon link present** (will fail on unfixed code):
   Parse `index.html` and assert a `<link rel="icon">` element exists in `<head>`.

**Expected Counterexamples**:
- `bug.visible` remains `true` after `_eliminateBug` (Bug 1).
- `_bugs` array has length 0 for a Replicator-only level (Bug 2).
- `soundManager.play` never called with `'sfx_power_unlock'` (Bug 3).
- `keyboard.captures` does not include `SPACE` (Bug 4).
- No `<link rel="icon">` found in `index.html` (Bug 5).

---

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL bug WHERE isBugCondition_1(bug) DO
  _eliminateBug_fixed(bug)
  ASSERT bug.active === false AND bug.visible === false
END FOR

FOR ALL levelConfig WHERE isBugCondition_2(levelConfig) DO
  _spawnEnemies_fixed(levelConfig)
  ASSERT _bugs contains Replicator instance
END FOR

FOR ALL (prevScore, newScore) WHERE isBugCondition_3(prevScore, newScore, powerName) DO
  checkUnlocks_fixed(newScore, soundManager)
  ASSERT soundManager.play called once with 'sfx_power_unlock'
END FOR

FOR ALL keyCode WHERE isBugCondition_4(keyCode) DO
  ASSERT keyboard.captures includes keyCode
END FOR

ASSERT isBugCondition_5(index.html) === false  // tag now present
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL bug WHERE NOT isBugCondition_1(bug) DO
  ASSERT _eliminateBug_original(bug) behavior = _eliminateBug_fixed(bug) behavior
END FOR

FOR ALL levelConfig WHERE NOT isBugCondition_2(levelConfig) DO
  ASSERT _spawnEnemies_original(levelConfig) result = _spawnEnemies_fixed(levelConfig) result
END FOR

FOR ALL score WHERE NOT isBugCondition_3(score) DO
  ASSERT checkUnlocks_original(score) side effects = checkUnlocks_fixed(score, soundManager) side effects
END FOR
```

**Testing Approach**: Property-based testing with `fast-check` is used for preservation checking because it generates many random inputs automatically and catches edge cases that manual tests miss.

**Test Cases**:

1. **Bomb fuse expiry preservation**: Verify that a bomb that expires without hitting an enemy still deactivates correctly and no score is awarded.
2. **Kiro damage preservation**: Verify that Kiro losing a life and triggering invincibility is unaffected.
3. **Wanderer/Seeker spawn preservation**: Verify that non-Replicator enemies still spawn and register collisions.
4. **Already-unlocked power preservation**: Verify that `checkUnlocks` called again after unlock does not re-play `sfx_power_unlock`.
5. **Power activation sound preservation**: Verify Q/E still plays `sfx_power_activate`.
6. **Arrow/WASD movement preservation**: Verify Kiro movement is unaffected by the keyboard capture change.
7. **Pause toggle preservation**: Verify ESC/P still toggles the pause overlay.
8. **Asset loading preservation**: Verify all other `<head>` elements in `index.html` are unchanged.

---

### Unit Tests

- Test `_eliminateBug` sets both `active` and `visible` to `false` on a mock bug.
- Test `_spawnEnemies` with a Replicator config pushes a `Replicator` instance into `_bugs`.
- Test `checkUnlocks` plays `sfx_power_unlock` exactly once when crossing each threshold.
- Test `checkUnlocks` does not play `sfx_power_unlock` when score is below threshold.
- Test `checkUnlocks` does not play `sfx_power_unlock` when power is already unlocked.
- Test `index.html` contains `<link rel="icon" href="favicon.ico">`.
- Test keyboard capture includes `SPACE` after `GameScene.create()`.

### Property-Based Tests

- Generate random enemy lists; for any enemy passed to `_eliminateBug`, assert `visible === false` after the call (fast-check, 100 runs).
- Generate random score sequences; for any sequence crossing an unlock threshold exactly once, assert `sfx_power_unlock` is played exactly once (fast-check, 100 runs).
- Generate random score sequences that never cross a threshold; assert `sfx_power_unlock` is never played (fast-check, 100 runs).
- Generate random level configs with only Wanderers/Seekers; assert `_bugs` count matches config count and no Replicator is present (fast-check, 100 runs).

### Integration Tests

- Full game loop: place bomb, hit enemy, verify enemy disappears and score increments exactly once.
- Full game loop: level with Replicator, verify Replicator appears, updates, and spawns Wanderers.
- Full game loop: score crosses `POWER_UNLOCK_FREEZE`, verify HUD updates and `sfx_power_unlock` plays.
- Browser load: open `index.html`, verify favicon appears in browser tab.
- Gameplay: press spacebar, verify page does not scroll and bomb is placed.
