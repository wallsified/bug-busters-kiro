# Bugfix Requirements Document

## Introduction

This document covers five bugs reported in the Bug Busters game. The bugs affect core gameplay mechanics: bomb placement and enemy elimination, Replicator enemy spawning, power-up unlock feedback, unintended browser behavior from non-control keys (spacebar freezing the game), and a missing favicon. Together these issues degrade the playability and polish of the game.

---

## Bug Analysis

### Bug 1 — Bombs not eliminating enemies / no score points

#### Current Behavior (Defect)

1.1 WHEN a bomb overlaps an active enemy THEN the system does not eliminate the enemy because `_eliminateBug` calls `bug.setActive(false)` but never calls `bug.setVisible(false)`, leaving the sprite visible and the physics body still triggering overlaps on subsequent frames.

1.2 WHEN an enemy is eliminated THEN the system does not award score points reliably because the still-visible inactive sprite continues to trigger the overlap callback, causing `_onBombHitBug` to be called repeatedly on an already-inactive bomb/bug pair.

1.3 WHEN a bomb detonates near an enemy THEN the system cannot visually confirm the hit because the enemy sprite remains rendered at full opacity after `setActive(false)`.

#### Expected Behavior (Correct)

2.1 WHEN a bomb overlaps an active enemy THEN the system SHALL call both `bug.setActive(false)` and `bug.setVisible(false)` so the sprite is removed from view and stops triggering further overlaps.

2.2 WHEN an enemy is eliminated THEN the system SHALL award the correct point value exactly once per elimination event.

2.3 WHEN a bomb detonates near an enemy THEN the system SHALL visually remove the enemy sprite immediately upon elimination.

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a bomb is placed and its fuse expires without hitting an enemy THEN the system SHALL CONTINUE TO deactivate the bomb without affecting any enemy or score.

3.2 WHEN Kiro is hit by an enemy THEN the system SHALL CONTINUE TO deduct a life and trigger invincibility correctly.

3.3 WHEN the patch_bomb power is activated THEN the system SHALL CONTINUE TO eliminate all enemies within the defined radius.

---

### Bug 2 — Replicator enemy not spawning

#### Current Behavior (Defect)

1.4 WHEN a level configuration includes a Replicator enemy THEN the system does not add the Replicator to the `_bugs` array because the `new Replicator(...)` instance is never assigned to the `bug` variable in `_spawnEnemies`, so the `if (bug)` guard evaluates to false and the Replicator is silently dropped.

1.5 WHEN a Replicator is missing from `_bugs` THEN the system does not set up collision detection for it, making it impossible to eliminate.

#### Expected Behavior (Correct)

2.4 WHEN a level configuration includes a Replicator enemy THEN the system SHALL assign the `new Replicator(...)` instance to the `bug` variable and push it into `_bugs` so it participates in the game loop and collision system.

2.5 WHEN a Replicator is active in `_bugs` THEN the system SHALL call its `update(scene)` each frame and set up bomb/kiro/module overlap callbacks for it.

#### Unchanged Behavior (Regression Prevention)

3.4 WHEN a level configuration includes Wanderer or Seeker enemies THEN the system SHALL CONTINUE TO spawn them correctly and register their collisions.

3.5 WHEN a Replicator spawns a new Wanderer via its `_onSpawn` callback THEN the system SHALL CONTINUE TO add the new Wanderer to `_bugs` and set up its collisions.

---

### Bug 3 — Power-up unlock has no audio feedback

#### Current Behavior (Defect)

1.6 WHEN the player's score reaches the freeze unlock threshold (`POWER_UNLOCK_FREEZE`) THEN the system unlocks the freeze power silently without playing `sfx_power_unlock`.

1.7 WHEN the player's score reaches the patch_bomb unlock threshold (`POWER_UNLOCK_PATCH_BOMB`) THEN the system unlocks the patch_bomb power silently without playing `sfx_power_unlock`.

#### Expected Behavior (Correct)

2.6 WHEN the player's score reaches `POWER_UNLOCK_FREEZE` for the first time THEN the system SHALL play the `sfx_power_unlock` sound effect to confirm the unlock.

2.7 WHEN the player's score reaches `POWER_UNLOCK_PATCH_BOMB` for the first time THEN the system SHALL play the `sfx_power_unlock` sound effect to confirm the unlock.

#### Unchanged Behavior (Regression Prevention)

3.6 WHEN a power is already unlocked and the score increases further THEN the system SHALL CONTINUE TO not re-trigger the unlock sound.

3.7 WHEN a power is activated with Q or E THEN the system SHALL CONTINUE TO play `sfx_power_activate` (not `sfx_power_unlock`).

3.8 WHEN the score changes but does not cross an unlock threshold THEN the system SHALL CONTINUE TO update the HUD score display without playing any sound.

---

### Bug 4 — Non-control keys (e.g. spacebar) cause unintended browser behavior / game freeze

#### Current Behavior (Defect)

1.8 WHEN the player presses the spacebar during gameplay THEN the browser intercepts the keydown event and scrolls the page, causing the game viewport to shift and the game to appear frozen or unresponsive.

1.9 WHEN any non-captured key is pressed THEN the system propagates the event to the browser, potentially triggering default browser shortcuts that disrupt gameplay.

#### Expected Behavior (Correct)

2.8 WHEN the player presses the spacebar or any registered control key during gameplay THEN the system SHALL prevent the default browser behavior for those keys so the game remains the sole handler.

2.9 WHEN a non-control key is pressed THEN the system SHALL ignore it without disrupting the game loop or browser state.

#### Unchanged Behavior (Regression Prevention)

3.9 WHEN the player presses arrow keys or WASD THEN the system SHALL CONTINUE TO move Kiro correctly.

3.10 WHEN the player presses Q or E THEN the system SHALL CONTINUE TO activate the corresponding power if unlocked.

3.11 WHEN the player presses ESC or P THEN the system SHALL CONTINUE TO toggle the pause overlay.

---

### Bug 5 — Favicon not loading

#### Current Behavior (Defect)

1.10 WHEN the game is opened in a browser THEN the system does not display a favicon in the browser tab because `index.html` contains no `<link rel="icon">` element pointing to `favicon.ico`.

#### Expected Behavior (Correct)

2.10 WHEN the game is opened in a browser THEN the system SHALL display the favicon by including a `<link rel="icon" href="favicon.ico">` element in the `<head>` of `index.html`.

#### Unchanged Behavior (Regression Prevention)

3.12 WHEN the game page loads THEN the system SHALL CONTINUE TO load all other assets (fonts, Phaser CDN, game modules) without interference from the favicon link tag.
