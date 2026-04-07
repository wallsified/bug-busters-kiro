# Requirements Document

## Introduction

This feature overhauls the core gameplay loop of Bug Busters, a Phaser 3 browser game. The changes cover six areas: replacing the projectile mechanic with Bomberman-style bombs, introducing a score-based enemy spawn limit per level, fixing the Wanderer enemy not appearing, improving CRT shader readability for white text, fixing an auto game-over bug triggered when the player has zero points, and adding a pause mechanic with a dedicated pause screen.

## Glossary

- **Game_Scene**: The main gameplay scene (`GameScene.js`) that manages the core loop.
- **Kiro**: The player-controlled character entity.
- **Bomb**: A stationary explosive placed by Kiro that detonates when a Bug walks into it or after a timer expires.
- **Bug**: Any enemy entity (Wanderer, Seeker, Replicator).
- **Wanderer**: A Bug that moves in random directions and changes direction at random intervals.
- **Replicator**: A Bug that periodically spawns new Wanderers.
- **Spawn_System**: The subsystem inside Game_Scene responsible for creating Bug instances during a level.
- **Score_Threshold**: The total point value of enemies that must be eliminated to complete a level's spawn quota.
- **HUD**: The heads-up display managed by `HUDManager`, showing score, lives, level, and power states.
- **CRT_Shader**: The WebGL post-processing pipeline (`CRTShader.js`) that applies vignette and scanline effects.
- **Pause_Screen**: An overlay scene or UI layer displayed when the game is paused.
- **Score_System**: The `ScoreSystem` manager that tracks and accumulates the player's score.
- **CONSTANTS**: The global configuration object in `src/config/constants.js`.
- **LEVELS**: The level configuration array in `src/config/levels.js`.

---

## Requirements

### Requirement 1: Bomb Placement Mechanic

**User Story:** As a player, I want to place bombs instead of firing projectiles, so that the gameplay feels more strategic and Bomberman-like.

#### Acceptance Criteria

1. WHEN Kiro triggers the fire action (Space key or mouse click), THE Game_Scene SHALL place a Bomb at Kiro's current tile position instead of firing a projectile.
2. THE Bomb SHALL remain stationary at the position where it was placed.
3. WHEN a Bug's physics body overlaps with a Bomb, THE Game_Scene SHALL trigger an explosion that eliminates the Bug and destroys the Bomb.
4. WHEN a Bomb has been active for a duration defined in CONSTANTS as `BOMB_FUSE_DURATION` without being triggered by a Bug, THE Game_Scene SHALL detonate the Bomb, producing an explosion effect with no Bug elimination.
5. THE Game_Scene SHALL enforce a maximum of `BOMB_LIMIT` simultaneously active Bombs as defined in CONSTANTS; WHEN the limit is reached, Kiro SHALL NOT be able to place additional Bombs.
6. WHEN a Bomb explodes (by Bug contact or fuse timeout), THE Game_Scene SHALL play the existing `sfx_eliminate` sound and trigger the `EffectsManager.spawnParticleBurst` effect at the Bomb's position.
7. THE Game_Scene SHALL remove the `ProjectileGroup` system and all references to projectile firing from the gameplay loop.

---

### Requirement 2: Score-Based Enemy Spawn Limit Per Level

**User Story:** As a player, I want enemy spawning to stop once I've eliminated enough enemies to reach the level's point threshold, so that each level has a clear and achievable completion condition.

#### Acceptance Criteria

1. THE LEVELS configuration SHALL define a `spawnThreshold` property for each level: Level 1 = 10 points, Level 2 = 15 points, Level 3 = 20 points.
2. WHEN the Spawn_System initialises a level, THE Spawn_System SHALL spawn enemies from the level's enemy list one at a time, tracking the cumulative point value of all spawned enemies.
3. WHEN the cumulative point value of spawned enemies reaches or exceeds the level's `spawnThreshold`, THE Spawn_System SHALL stop spawning additional enemies.
4. WHEN all active Bugs have been eliminated AND the `spawnThreshold` has been reached, THE Game_Scene SHALL trigger the level-complete transition.
5. THE Replicator SHALL NOT count its dynamically spawned Wanderers toward the `spawnThreshold`; only enemies from the initial level configuration SHALL count.
6. IF the `spawnThreshold` is reached before all enemies in the level configuration have been spawned, THEN THE Spawn_System SHALL discard the remaining unspawned enemies for that level.

---

### Requirement 3: Wanderer Spawn Fix

**User Story:** As a player, I want to see Wanderer enemies in the game, so that the intended variety of enemy types is present during gameplay.

#### Acceptance Criteria

1. WHEN Game_Scene initialises a level that includes Wanderer entries in its enemy list, THE Spawn_System SHALL create and register a Wanderer instance for each such entry.
2. WHEN a Wanderer is created, THE Wanderer SHALL be added to the physics world and rendered visibly using the `wanderer` sprite key.
3. WHEN a Wanderer is active, THE Wanderer SHALL move at `ENEMY_SPEED` pixels per second and change direction at a random interval between `WANDERER_DIR_CHANGE_MIN` and `WANDERER_DIR_CHANGE_MAX` milliseconds.
4. THE Spawn_System SHALL register collision and overlap handlers for each Wanderer with Kiro, Bombs, and Module entities at the time of creation.

---

### Requirement 4: CRT Effect Readability for White Text

**User Story:** As a player, I want white text in the HUD and start screen to be clearly readable, so that I can see game information without straining.

#### Acceptance Criteria

1. THE CRT_Shader SHALL apply a vignette effect with a `vignetteStrength` value low enough that white text rendered at the screen centre retains a brightness multiplier of at least 0.75.
2. THE CRT_Shader SHALL apply scanline darkening with a `scanlineAlpha` value low enough that white text on odd-row pixels retains a brightness multiplier of at least 0.80.
3. WHEN the CRT_Shader is active, THE HUD text elements (score, lives, level, power states) SHALL remain legible at their standard white (`#ffffff`) fill colour.
4. WHEN the CRT_Shader is active on the MainMenuScene, THE controls panel text and high score text SHALL remain legible at their standard white fill colour.
5. THE CRT_Shader SHALL preserve the visual CRT aesthetic (vignette darkening toward edges, visible scanline pattern) while satisfying criteria 1 and 2.

---

### Requirement 5: Auto Game-Over Bug Fix

**User Story:** As a player, I want the game not to trigger a game over immediately after starting, so that I can actually play the game.

#### Acceptance Criteria

1. THE Game_Scene SHALL NOT evaluate any game-over condition based on the player's score value.
2. THE Game_Scene SHALL trigger a game over ONLY WHEN Kiro's remaining lives reach zero OR WHEN all Module entities have been destroyed.
3. WHEN Game_Scene initialises, THE Score_System SHALL start at zero points and THE game-over condition SHALL NOT be evaluated until at least one Bug-Kiro collision or Module destruction event has occurred.
4. IF a timer or deferred callback exists in Game_Scene that checks score and triggers game over, THEN THE Game_Scene SHALL remove that timer or callback entirely.

---

### Requirement 6: Pause Mechanic

**User Story:** As a player, I want to pause the game and see a pause screen with resume and quit options, so that I can take a break without losing my progress.

#### Acceptance Criteria

1. WHEN the player presses the ESC key or the P key during active gameplay, THE Game_Scene SHALL pause the Phaser scene time and display the Pause_Screen.
2. THE Pause_Screen SHALL display the text "PAUSED" centred on screen using the `"Press Start 2P"` font at 24px.
3. THE Pause_Screen SHALL display a "RESUME" option and a "QUIT" option, each interactive and styled with the `"Press Start 2P"` font.
4. WHEN the player selects "RESUME" or presses the ESC or P key again while paused, THE Game_Scene SHALL resume scene time and hide the Pause_Screen.
5. WHEN the player selects "QUIT" from the Pause_Screen, THE Game_Scene SHALL stop the current scene and transition to MainMenuScene.
6. WHILE the game is paused, THE Game_Scene SHALL halt all Bug movement, Kiro movement, Bomb fuse timers, and HUD updates.
7. THE Pause_Screen SHALL render above all gameplay elements and the HUD using a semi-transparent dark overlay behind the pause menu text.
