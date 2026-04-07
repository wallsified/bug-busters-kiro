# Bugfix Requirements Document

## Introduction

This document covers seven bugs reported in the Bug Busters game (Phaser 3). The issues span enemy visibility, missing audio/visual feedback, player spawn position, boundary enforcement, canvas centering, and missing pre-game UI. Together they degrade the core gameplay experience and must be resolved without breaking existing correct behavior.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Replicator enemy is instantiated in a scene THEN the system renders it with no visible sprite on screen due to a missing or incorrect display size configuration.

1.2 WHEN Kiro fires a projectile THEN the system produces no visual feedback — the projectile sprite is not visible or no muzzle/flash effect is shown.

1.3 WHEN a new game session starts THEN the system places Kiro at coordinates (80, 80), which overlaps with an enemy spawn position, causing Kiro to immediately collide with an enemy and lose a life.

1.4 WHEN Kiro moves toward a screen edge THEN the system allows Kiro to travel beyond the canvas boundaries and leave the visible play area.

1.5 WHEN an enemy moves toward a screen edge THEN the system allows the enemy to travel beyond the canvas boundaries and leave the visible play area.

1.6 WHEN the game canvas is rendered in the browser THEN the system positions it aligned to the right side of the viewport instead of centered.

1.7 WHEN Kiro loses all lives and the game-over condition is triggered THEN the system transitions to GameOverScene without playing the `game_over.mp3` sound effect.

1.8 WHEN the game is about to start (on the main menu or a pre-game screen) THEN the system shows no on-screen control instructions, leaving the player unaware of the keyboard/mouse bindings.

### Expected Behavior (Correct)

2.1 WHEN the Replicator enemy is instantiated in a scene THEN the system SHALL render it with a visible sprite at the correct size (matching the 48×48 spritesheet frame config used by all other enemies).

2.2 WHEN Kiro fires a projectile THEN the system SHALL display a visible projectile sprite traveling in the firing direction, providing clear visual feedback of the shot.

2.3 WHEN a new game session starts THEN the system SHALL place Kiro at a spawn position that does not overlap any enemy spawn coordinate defined in the level config, so no life is lost at game start.

2.4 WHEN Kiro moves toward a screen edge THEN the system SHALL stop Kiro at the canvas boundary, keeping the player sprite fully within the visible play area.

2.5 WHEN an enemy moves toward a screen edge THEN the system SHALL stop the enemy at the canvas boundary, keeping all enemy sprites fully within the visible play area.

2.6 WHEN the game canvas is rendered in the browser THEN the system SHALL center the canvas horizontally and vertically within the viewport.

2.7 WHEN Kiro loses all lives and the game-over condition is triggered THEN the system SHALL play the `game_over` audio asset before or during the transition to GameOverScene.

2.8 WHEN the main menu is displayed before the game starts THEN the system SHALL show an on-screen panel listing the active control bindings (arrow keys / WASD to move, Space / click to fire, Q for Freeze, E for Patch Bomb).

### Unchanged Behavior (Regression Prevention)

3.1 WHEN Wanderer and Seeker enemies are instantiated THEN the system SHALL CONTINUE TO render them with correct visible sprites at 48×48 frame size.

3.2 WHEN Kiro fires a projectile and the active projectile count is already at the limit (3) THEN the system SHALL CONTINUE TO ignore the fire input without spawning an extra projectile.

3.3 WHEN Kiro is within the play area and away from boundaries THEN the system SHALL CONTINUE TO move Kiro freely in all four directions at the configured speed.

3.4 WHEN an enemy is within the play area and away from boundaries THEN the system SHALL CONTINUE TO move the enemy according to its AI behavior (wander, seek, replicate).

3.5 WHEN Kiro has lives remaining and collides with an enemy outside the invincibility window THEN the system SHALL CONTINUE TO deduct one life and trigger the invincibility period.

3.6 WHEN the game-over condition is triggered THEN the system SHALL CONTINUE TO transition to GameOverScene passing the current score and level.

3.7 WHEN the Replicator's spawn interval elapses and the spawn count is below the maximum THEN the system SHALL CONTINUE TO spawn a new Wanderer at the Replicator's position.

3.8 WHEN the player clicks the start button on the main menu THEN the system SHALL CONTINUE TO transition to GameScene with the saved level data.

3.9 WHEN all enemies are eliminated THEN the system SHALL CONTINUE TO trigger the level-complete transition.

3.10 WHEN the `sfx_fire`, `sfx_eliminate`, `sfx_life_lost`, and `sfx_power_activate` sounds are triggered THEN the system SHALL CONTINUE TO play them correctly.
