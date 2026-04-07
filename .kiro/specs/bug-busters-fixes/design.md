# Bug Busters Fixes — Bugfix Design

## Overview

This document covers eight bugs in the Bug Busters game (Phaser 3). The bugs span enemy sprite visibility, projectile feedback, player spawn overlap, boundary enforcement for both Kiro and enemies, canvas centering, missing game-over audio, and absent control instructions on the main menu.

The fix strategy is minimal and targeted: each change addresses exactly one bug condition without altering unaffected code paths. Preservation of all existing correct behavior is verified through property-based and unit tests.

---

## Glossary

- **Bug_Condition (C)**: The condition that identifies a defective input or state — the specific scenario that triggers each bug.
- **Property (P)**: The desired correct behavior when the bug condition holds — what the fixed code must produce.
- **Preservation**: All existing correct behaviors that must remain unchanged after applying the fix.
- **Replicator**: Enemy entity in `src/entities/Replicator.js` that spawns Wanderers periodically.
- **ProjectileGroup**: Pool of projectile sprites in `src/entities/ProjectileGroup.js` managed by `fire()`.
- **GameScene**: Main gameplay scene in `src/scenes/GameScene.js` that orchestrates all entities.
- **MainMenuScene**: Pre-game scene in `src/scenes/MainMenuScene.js` that shows the title and start button.
- **SoundManager**: Audio wrapper in `src/managers/SoundManager.js` that plays keyed audio assets.
- **worldBounds**: The physics world boundary rectangle (0, 0, width, height) enforced by Phaser's arcade physics.
- **displayWidth / displayHeight**: The rendered pixel size of a Phaser sprite, distinct from the frame size.

---

## Bug Details

### Bug 1 — Replicator Sprite Not Visible

The bug manifests when a `Replicator` is instantiated in a scene. The sprite renders with no visible size because `setDisplaySize()` is never called, unlike `Wanderer` and `Seeker` which presumably have the correct size set.

**Formal Specification:**
```
FUNCTION isBugCondition_1(entity)
  INPUT: entity — a newly constructed game entity
  OUTPUT: boolean

  RETURN entity instanceof Replicator
         AND entity.displayWidth = 0 OR entity.displayHeight = 0
         OR entity display size ≠ 48 × 48
END FUNCTION
```

**Examples:**
- `new Replicator(scene, 350, 250)` → sprite is invisible (0×0 or wrong size). Expected: visible 48×48 sprite.
- `new Wanderer(scene, 100, 100)` → sprite is visible at 48×48. Must remain unchanged.
- `new Seeker(scene, 200, 400)` → sprite is visible at 48×48. Must remain unchanged.

---

### Bug 2 — Projectile Sprite Not Visible

The bug manifests when `ProjectileGroup.fire()` is called. The projectile object is created and activated but the sprite is not visible, likely because `setVisible(true)` is never called on reused pool objects, or the sprite key is not applied correctly.

**Formal Specification:**
```
FUNCTION isBugCondition_2(projectile)
  INPUT: projectile — object returned after calling fire()
  OUTPUT: boolean

  RETURN projectile.active = true
         AND (projectile.visible = false OR projectile has no rendered texture)
END FUNCTION
```

**Examples:**
- `projectiles.fire(80, 80, 'right')` → projectile active but invisible. Expected: visible sprite moving right.
- Firing when 3 projectiles are already active → no new projectile. Must remain unchanged (no-op).

---

### Bug 3 — Kiro Spawns Overlapping an Enemy

The bug manifests at game start when `GameScene.create()` places Kiro at `(80, 80)`, which coincides with the Wanderer spawn at `(100, 100)` in Level 1 (close enough to trigger immediate overlap collision). The exact overlap depends on sprite sizes, but the spawn positions are dangerously close.

**Formal Specification:**
```
FUNCTION isBugCondition_3(kiroSpawn, levelConfig)
  INPUT: kiroSpawn — {x, y} of Kiro's initial position
         levelConfig — the active level's enemy spawn list
  OUTPUT: boolean

  FOR EACH enemy IN levelConfig.enemies DO
    dist = sqrt((kiroSpawn.x - enemy.x)² + (kiroSpawn.y - enemy.y)²)
    IF dist < SAFE_SPAWN_DISTANCE THEN RETURN true
  END FOR
  RETURN false
END FUNCTION
```

**Examples:**
- Level 1: Kiro at `(80, 80)`, Wanderer at `(100, 100)` → distance ≈ 28px, triggers immediate collision. Expected: Kiro spawns at a safe position (e.g., `(80, 300)`).
- Level 2 and 3: same Kiro spawn must not overlap any enemy in those configs.

---

### Bug 4 — Kiro Can Leave Canvas Boundaries

The bug manifests when Kiro moves toward a screen edge. The physics body has no world bounds collision enabled, so Kiro exits the visible area.

**Formal Specification:**
```
FUNCTION isBugCondition_4(kiro, worldBounds)
  INPUT: kiro — Kiro entity after update()
         worldBounds — {x:0, y:0, width:800, height:600}
  OUTPUT: boolean

  RETURN kiro.x < worldBounds.x
      OR kiro.x > worldBounds.width
      OR kiro.y < worldBounds.y
      OR kiro.y > worldBounds.height
END FUNCTION
```

**Examples:**
- Kiro at x=790 moving right → exits to x=810. Expected: clamped at x=800.
- Kiro at y=5 moving up → exits to y=-10. Expected: clamped at y=0.
- Kiro moving freely in the center → unaffected. Must remain unchanged.

---

### Bug 5 — Enemies Can Leave Canvas Boundaries

Same as Bug 4 but for all enemy types (Wanderer, Seeker, Replicator). Their physics bodies also lack world bounds collision.

**Formal Specification:**
```
FUNCTION isBugCondition_5(enemy, worldBounds)
  INPUT: enemy — any Bug subclass instance after update()
         worldBounds — {x:0, y:0, width:800, height:600}
  OUTPUT: boolean

  RETURN enemy.x < worldBounds.x
      OR enemy.x > worldBounds.width
      OR enemy.y < worldBounds.y
      OR enemy.y > worldBounds.height
END FUNCTION
```

**Examples:**
- Wanderer moving left from x=5 → exits to x=-10. Expected: clamped at x=0.
- Seeker chasing Kiro near top edge → exits upward. Expected: clamped at y=0.
- Enemy moving in center of play area → unaffected. Must remain unchanged.

---

### Bug 6 — Canvas Not Centered in Browser

The bug manifests when the game renders in the browser. The Phaser `scale` config in `index.html` is either missing or uses incorrect centering values, causing the canvas to align to the right instead of center.

**Formal Specification:**
```
FUNCTION isBugCondition_6(phaserConfig)
  INPUT: phaserConfig — the Phaser.Game config object
  OUTPUT: boolean

  RETURN phaserConfig.scale IS UNDEFINED
      OR phaserConfig.scale.autoCenter ≠ Phaser.Scale.CENTER_BOTH
END FUNCTION
```

**Examples:**
- `index.html` config missing `scale.autoCenter` → canvas right-aligned. Expected: canvas centered both axes.
- Config with `autoCenter: Phaser.Scale.CENTER_BOTH` → canvas centered. This is the correct state.

---

### Bug 7 — game_over.mp3 Not Played on Game Over

The bug manifests when `GameScene._gameOver()` is called. The method transitions to `GameOverScene` without calling `this._soundManager.play('game_over')`.

**Formal Specification:**
```
FUNCTION isBugCondition_7(gameOverTrigger)
  INPUT: gameOverTrigger — the event of lives reaching 0
  OUTPUT: boolean

  RETURN _gameOver() was called
         AND soundManager.play('game_over') was NOT called
         AND scene.start('GameOverScene') was called
END FUNCTION
```

**Examples:**
- Kiro loses last life → `_gameOver()` runs → no `game_over` sound plays. Expected: `game_over` sound plays before/during transition.
- `sfx_life_lost` plays when Kiro takes damage → must remain unchanged.
- `sfx_eliminate` plays when enemy is eliminated → must remain unchanged.

---

### Bug 8 — No Control Instructions on Main Menu

The bug manifests when `MainMenuScene` is displayed. No on-screen panel listing the control bindings is rendered, leaving the player without guidance.

**Formal Specification:**
```
FUNCTION isBugCondition_8(mainMenuScene)
  INPUT: mainMenuScene — MainMenuScene after create()
  OUTPUT: boolean

  RETURN no text object exists in the scene
         containing control binding descriptions
         (arrow keys / WASD, Space / click, Q, E)
END FUNCTION
```

**Examples:**
- `MainMenuScene.create()` runs → no controls panel visible. Expected: panel listing all bindings.
- Start button click → transitions to GameScene. Must remain unchanged.
- High score display → must remain unchanged.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Wanderer and Seeker sprites render correctly at 48×48 (Bug 1 fix must not affect them).
- Projectile limit of 3 active projectiles is enforced — firing beyond the limit is a no-op (Bug 2 fix must not change this).
- Kiro moves freely in all four directions when away from boundaries (Bug 4 fix must not restrict interior movement).
- Enemies follow their AI behavior (wander, seek, replicate) when away from boundaries (Bug 5 fix must not alter AI logic).
- Kiro loses a life and triggers invincibility when colliding with an enemy outside the invincibility window (Bug 3 fix must not affect collision handling).
- GameOverScene receives the correct score and level on transition (Bug 7 fix must not alter transition data).
- Start button on main menu transitions to GameScene with saved level data (Bug 8 fix must not affect button behavior).
- All existing sounds (`sfx_fire`, `sfx_eliminate`, `sfx_life_lost`, `sfx_power_activate`) continue to play correctly.
- Level-complete transition triggers when all enemies are eliminated.
- Replicator continues to spawn Wanderers at its position when the interval elapses and spawn count is below maximum.

**Scope:**
All inputs and states that do NOT match the eight bug conditions above must be completely unaffected by these fixes.

---

## Hypothesized Root Cause

### Bug 1 — Replicator Sprite Not Visible
1. **Missing `setDisplaySize()` call**: The `Replicator` constructor does not call `this.setDisplaySize(48, 48)` after `super()`, unlike the other enemy types. The spritesheet frame is 32×32 but the display size should be 48×48 to match the game's visual scale.

### Bug 2 — Projectile Sprite Not Visible
1. **Missing `setVisible(true)` on pool reuse**: When a pooled projectile is reactivated via `setActive(true)`, `setVisible(true)` is not called. Phaser's `setActive` does not automatically restore visibility.
2. **Alternatively**: The `create()` call in the fallback base class does not set a texture key, so the sprite has no rendered image.

### Bug 3 — Kiro Spawns Overlapping an Enemy
1. **Hardcoded spawn at (80, 80)**: `GameScene.create()` passes `(80, 80)` to `new Kiro(...)`. Level 1 has a Wanderer at `(100, 100)`, which is ~28px away — within collision range for 48×48 sprites. The fix is to move Kiro's spawn to a position that is safely distant from all enemy spawns in all levels (e.g., `(80, 300)`).

### Bug 4 — Kiro Can Leave Canvas Boundaries
1. **`collideWorldBounds` not enabled**: `Kiro`'s physics body does not have `setCollideWorldBounds(true)` called after physics is enabled. The world bounds exist but collision against them is not activated for Kiro.

### Bug 5 — Enemies Can Leave Canvas Boundaries
1. **`collideWorldBounds` not enabled for enemies**: Same root cause as Bug 4 — `Bug` base class or individual enemy constructors do not call `this.body.setCollideWorldBounds(true)`.

### Bug 6 — Canvas Not Centered in Browser
1. **Missing or incorrect `scale` config**: The `scale` block in `index.html`'s Phaser config is either absent or has `autoCenter` set to a value other than `Phaser.Scale.CENTER_BOTH`. Looking at the current `index.html`, the `scale` block is actually present with `CENTER_BOTH` — the bug may instead be a missing CSS rule or the `scale.mode` is not `FIT`. The CSS `body` already has `display: flex; justify-content: center; align-items: center` which should center it. The actual issue may be that `Phaser.Scale.FIT` with `CENTER_BOTH` is already in the config but the canvas `display: block` overrides flex centering. The fix is to ensure the scale config is correct and the CSS does not conflict.

### Bug 7 — game_over.mp3 Not Played on Game Over
1. **Missing `play('game_over')` call**: `GameScene._gameOver()` calls `this.scene.start('GameOverScene', ...)` but never calls `this._soundManager.play('game_over')`. The audio asset key is `game_over` (from `assets/audio/game_over.mp3`), but it is not registered in `AssetLoader.preload()` either — both the load call and the play call are missing.

### Bug 8 — No Control Instructions on Main Menu
1. **No controls panel in `MainMenuScene.create()`**: The scene renders title, high score, and start button, but no text block describing the keyboard/mouse bindings. The fix is to add a text element listing: arrow keys / WASD to move, Space / click to fire, Q for Freeze, E for Patch Bomb.

---

## Correctness Properties

Property 1: Bug Condition — Replicator Display Size

_For any_ `Replicator` instance constructed with valid scene, x, and y parameters, the fixed constructor SHALL result in `displayWidth === 48` and `displayHeight === 48`, matching the visual scale of all other enemy sprites.

**Validates: Requirements 2.1**

Property 2: Preservation — Wanderer and Seeker Display Size

_For any_ `Wanderer` or `Seeker` instance constructed with valid parameters, the fixed code SHALL produce the same display size as before the fix, preserving correct enemy sprite rendering.

**Validates: Requirements 3.1**

Property 3: Bug Condition — Projectile Visibility After Fire

_For any_ call to `ProjectileGroup.fire(x, y, direction)` where the active projectile count is below the limit, the fixed `fire()` SHALL produce a projectile with `active === true` and `visible === true` and a non-zero velocity in the specified direction.

**Validates: Requirements 2.2**

Property 4: Preservation — Projectile Limit Enforcement

_For any_ call to `ProjectileGroup.fire()` when 3 projectiles are already active, the fixed code SHALL continue to be a no-op, preserving the projectile cap behavior.

**Validates: Requirements 3.2**

Property 5: Bug Condition — Kiro Spawn Does Not Overlap Enemies

_For any_ level configuration in `LEVELS`, the fixed Kiro spawn position SHALL be at a distance greater than `SAFE_SPAWN_DISTANCE` (≥ 96px) from every enemy spawn coordinate defined in that level's `enemies` array.

**Validates: Requirements 2.3**

Property 6: Preservation — Kiro Collision Handling Unchanged

_For any_ scenario where Kiro collides with an enemy outside the invincibility window, the fixed code SHALL continue to deduct one life and trigger the invincibility period, preserving existing damage behavior.

**Validates: Requirements 3.5**

Property 7: Bug Condition — Kiro Stays Within World Bounds

_For any_ movement input applied to Kiro when positioned near a canvas edge, the fixed physics configuration SHALL keep Kiro's position within `[0, 800] × [0, 600]` after each update.

**Validates: Requirements 2.4**

Property 8: Preservation — Kiro Free Movement in Interior

_For any_ movement input applied to Kiro when positioned away from canvas edges, the fixed code SHALL produce the same velocity and position delta as the original code, preserving free movement behavior.

**Validates: Requirements 3.3**

Property 9: Bug Condition — Enemies Stay Within World Bounds

_For any_ enemy update cycle where the enemy is positioned near a canvas edge, the fixed physics configuration SHALL keep the enemy's position within `[0, 800] × [0, 600]`.

**Validates: Requirements 2.5**

Property 10: Preservation — Enemy AI Behavior in Interior

_For any_ enemy update cycle where the enemy is positioned away from canvas edges, the fixed code SHALL produce the same velocity and movement behavior as the original code, preserving AI logic.

**Validates: Requirements 3.4**

Property 11: Bug Condition — game_over Sound Plays on Game Over

_For any_ trigger of the game-over condition (lives reaching 0), the fixed `_gameOver()` SHALL call `soundManager.play('game_over')` before or during the transition to `GameOverScene`.

**Validates: Requirements 2.7**

Property 12: Preservation — Existing Sounds Unaffected

_For any_ trigger of `sfx_fire`, `sfx_eliminate`, `sfx_life_lost`, or `sfx_power_activate`, the fixed code SHALL continue to play those sounds correctly, preserving all existing audio behavior.

**Validates: Requirements 3.10**

Property 13: Bug Condition — Controls Panel Present on Main Menu

_For any_ render of `MainMenuScene`, the fixed `create()` SHALL add at least one text object to the scene that contains descriptions of the control bindings (move, fire, Freeze, Patch Bomb).

**Validates: Requirements 2.8**

Property 14: Preservation — Main Menu Start Button Behavior

_For any_ pointer-down event on the start button in `MainMenuScene`, the fixed code SHALL continue to call `this.scene.start('GameScene', { level: progress.level })`, preserving the existing navigation behavior.

**Validates: Requirements 3.8**

---

## Fix Implementation

### Changes Required

**Bug 1 — Replicator Sprite Not Visible**

File: `src/entities/Replicator.js`
Function: `constructor`

1. After `super(scene, x, y, 'replicator')`, add `this.setDisplaySize(48, 48)` to match the display size of Wanderer and Seeker.

---

**Bug 2 — Projectile Sprite Not Visible**

File: `src/entities/ProjectileGroup.js`
Function: `fire`

1. When reactivating a pooled projectile (`existing`), add `projectile.setVisible(true)` alongside `setActive(true)`.
2. When creating a new projectile via `this.create()`, call `projectile.setVisible(true)` after creation.

---

**Bug 3 — Kiro Spawns Overlapping an Enemy**

File: `src/scenes/GameScene.js`
Function: `create`

1. Change `new Kiro(this, 80, 80)` to `new Kiro(this, 80, 300)`. This position is safely distant (≥ 96px) from all enemy spawns across all three level configs.

---

**Bug 4 — Kiro Can Leave Canvas Boundaries**

File: `src/entities/Kiro.js`
Function: `constructor`

1. After `scene.physics.add.existing(this)`, add `this.setCollideWorldBounds(true)` to enable world bounds collision for Kiro's physics body.

---

**Bug 5 — Enemies Can Leave Canvas Boundaries**

File: `src/entities/Bug.js`
Function: `constructor`

1. After `scene.physics.add.existing(this)`, add `this.setCollideWorldBounds(true)`. This applies to all Bug subclasses (Wanderer, Seeker, Replicator) via inheritance.

---

**Bug 6 — Canvas Not Centered in Browser**

File: `index.html`

1. Verify the `scale` config block contains `mode: Phaser.Scale.FIT` and `autoCenter: Phaser.Scale.CENTER_BOTH`. If already present, the CSS `body` flex centering combined with `canvas { display: block }` may be conflicting. Remove `display: block` from the canvas CSS rule or ensure the scale config is the sole centering mechanism.

---

**Bug 7 — game_over.mp3 Not Played on Game Over**

File: `src/managers/AssetLoader.js`
Function: `preload`

1. Add `scene.load.audio('game_over', 'assets/audio/game_over.mp3')` to register the asset.

File: `src/scenes/GameScene.js`
Function: `_gameOver`

2. Add `this._soundManager.play('game_over')` before `this.scene.start('GameOverScene', ...)`.

---

**Bug 8 — No Control Instructions on Main Menu**

File: `src/scenes/MainMenuScene.js`
Function: `create`

1. Add a text block below the start button listing the control bindings:
   - Move: Arrow Keys / WASD
   - Fire: Space / Click
   - Freeze: Q
   - Patch Bomb: E
   Use `"Press Start 2P"` font at 8px, styled consistently with the rest of the menu.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed code, then verify the fix works correctly and preserves existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Cases**:
1. **Replicator display size**: Construct a `Replicator` and assert `displayWidth === 48`. Will fail on unfixed code (returns 0 or 32).
2. **Projectile visibility**: Call `fire()` and assert the returned projectile has `visible === true`. Will fail on unfixed code.
3. **Kiro spawn overlap**: Assert that Kiro's spawn `(80, 80)` is ≥ 96px from all Level 1 enemy spawns. Will fail on unfixed code.
4. **Kiro world bounds**: Simulate Kiro at `(799, 300)` moving right and assert `x ≤ 800`. Will fail on unfixed code.
5. **Enemy world bounds**: Simulate a Wanderer at `(1, 300)` moving left and assert `x ≥ 0`. Will fail on unfixed code.
6. **game_over sound**: Mock `SoundManager.play` and trigger `_gameOver()`, assert `play('game_over')` was called. Will fail on unfixed code.
7. **Controls panel**: After `MainMenuScene.create()`, assert at least one text object contains 'WASD' or 'MOVE'. Will fail on unfixed code.

**Expected Counterexamples**:
- Replicator `displayWidth` returns 0 or 32 instead of 48.
- Projectile `visible` is `false` after `fire()`.
- Distance from `(80,80)` to `(100,100)` is ~28px, below the safe threshold.
- Kiro position exceeds world bounds after movement.
- Enemy position exceeds world bounds after AI update.
- `play('game_over')` is never called during `_gameOver()`.
- No text object with control binding content exists in `MainMenuScene`.

---

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL entity WHERE isBugCondition_1(entity) DO
  ASSERT entity.displayWidth = 48 AND entity.displayHeight = 48
END FOR

FOR ALL fire_call WHERE isBugCondition_2(projectile) DO
  result := fire_fixed(x, y, direction)
  ASSERT result.active = true AND result.visible = true AND velocity ≠ 0
END FOR

FOR ALL levelConfig WHERE isBugCondition_3(kiroSpawn, levelConfig) DO
  ASSERT distance(kiroSpawn_fixed, every enemy spawn) ≥ 96
END FOR

FOR ALL movement WHERE isBugCondition_4(kiro, worldBounds) DO
  ASSERT kiro.x IN [0, 800] AND kiro.y IN [0, 600]
END FOR

FOR ALL update WHERE isBugCondition_5(enemy, worldBounds) DO
  ASSERT enemy.x IN [0, 800] AND enemy.y IN [0, 600]
END FOR

FOR ALL gameOver WHERE isBugCondition_7(trigger) DO
  ASSERT soundManager.play('game_over') was called
END FOR

FOR ALL render WHERE isBugCondition_8(mainMenuScene) DO
  ASSERT controls panel text exists in scene
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL entity WHERE NOT isBugCondition_1(entity) DO
  ASSERT entity_original.displayWidth = entity_fixed.displayWidth
END FOR

FOR ALL fire_call WHERE NOT isBugCondition_2(projectile) DO
  ASSERT fire_original(x, y, d) = fire_fixed(x, y, d)
END FOR

FOR ALL movement WHERE NOT isBugCondition_4(kiro, worldBounds) DO
  ASSERT kiro_original.velocity = kiro_fixed.velocity
END FOR

FOR ALL update WHERE NOT isBugCondition_5(enemy, worldBounds) DO
  ASSERT enemy_original.velocity = enemy_fixed.velocity
END FOR

FOR ALL sound_trigger WHERE NOT isBugCondition_7(trigger) DO
  ASSERT soundManager_original.play(key) = soundManager_fixed.play(key)
END FOR
```

**Testing Approach**: Property-based testing with `fast-check` (`{ numRuns: 100 }`) is used for preservation checking of movement and physics behaviors, generating random positions and inputs to verify no regressions.

**Test Cases**:
1. **Wanderer/Seeker display size preservation**: Verify `displayWidth === 48` still holds after Bug 1 fix.
2. **Projectile limit preservation**: Verify that firing when 3 projectiles are active remains a no-op after Bug 2 fix.
3. **Kiro interior movement preservation**: Generate random positions away from edges, verify velocity is unchanged after Bug 4 fix.
4. **Enemy AI preservation**: Generate random positions away from edges, verify AI velocity output is unchanged after Bug 5 fix.
5. **Existing sounds preservation**: Verify `sfx_fire`, `sfx_eliminate`, `sfx_life_lost`, `sfx_power_activate` still play after Bug 7 fix.
6. **Start button preservation**: Verify `scene.start('GameScene', ...)` is still called on pointer-down after Bug 8 fix.

---

### Unit Tests

- Test `Replicator` constructor sets `displayWidth` and `displayHeight` to 48.
- Test `ProjectileGroup.fire()` produces a projectile with `visible === true` and correct velocity.
- Test that Kiro's spawn position in `GameScene` is ≥ 96px from all enemy spawns in all three levels.
- Test `Kiro` constructor enables `collideWorldBounds` on the physics body.
- Test `Bug` base class constructor enables `collideWorldBounds` on the physics body.
- Test `GameScene._gameOver()` calls `soundManager.play('game_over')`.
- Test `AssetLoader.preload()` registers the `game_over` audio asset.
- Test `MainMenuScene.create()` adds a text object containing control binding descriptions.

### Property-Based Tests

- Generate random `(x, y)` positions for Replicator and assert `displayWidth === 48` always holds (Property 1).
- Generate random fire directions and positions, assert projectile is always visible and has correct velocity (Property 3).
- Generate random positions near canvas edges for Kiro, assert position stays within bounds after movement (Property 7).
- Generate random positions near canvas edges for each enemy type, assert position stays within bounds after update (Property 9).
- Generate random interior positions for Kiro, assert velocity output matches original behavior (Property 8).
- Generate random interior positions for enemies, assert AI velocity output matches original behavior (Property 10).

### Integration Tests

- Full game start: verify Kiro spawns without immediately losing a life in Level 1.
- Full game over flow: verify `game_over` sound plays and `GameOverScene` receives correct score/level.
- Main menu render: verify controls panel is visible alongside title and start button.
- Enemy boundary: run a game loop tick with enemies near edges, verify they do not exit the canvas.
- Kiro boundary: run a game loop tick with Kiro near edges, verify Kiro does not exit the canvas.
