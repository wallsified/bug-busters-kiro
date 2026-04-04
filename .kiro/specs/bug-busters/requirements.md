# Requirements Document

## Introduction

Bug Busters is an arcade-style web game where the player controls "Kiro", a ghost avatar that moves through virtual circuit boards to find and eliminate software bugs before they corrupt critical modules. The game features three enemy types, three levels, unlockable powers, local progress persistence, and sound effects. It is built with HTML5 and JavaScript (Phaser framework) and was created for an IA-game contest showcasing Kiro's features: specs, steering rules, hooks, MCP, and powers.

## Glossary

- **Game**: The Bug Busters web application running in a browser.
- **Player**: The human user controlling the Kiro avatar.
- **Kiro**: The player-controlled ghost avatar character.
- **Bug**: An enemy entity that moves through the circuit board and threatens modules.
- **Wanderer**: A Bug type that moves randomly through the circuit board.
- **Seeker**: A Bug type that actively pursues Kiro's position.
- **Replicator**: A Bug type that periodically spawns additional Wanderer bugs.
- **Module**: A critical game object on the circuit board that must be protected from Bugs.
- **Level**: A discrete stage of the game with a defined circuit board layout, enemy set, and win condition.
- **Power**: An unlockable special ability that Kiro can activate during gameplay.
- **Freeze**: A Power that temporarily immobilizes all Bugs on screen.
- **Patch_Bomb**: A Power that eliminates all Bugs within a defined radius.
- **Loading_Screen**: The initial screen displayed before the main menu.
- **LocalStorage**: The browser's built-in key-value storage used to persist player progress.
- **Score**: A numeric value representing the player's performance in a Level.
- **HUD**: The heads-up display showing Score, lives, active Powers, and current Level.
- **Sound_Manager**: The subsystem responsible for playing and managing all game audio.
- **Progress_Manager**: The subsystem responsible for reading and writing player progress to LocalStorage.
- **Asset_Loader**: The subsystem responsible for loading fonts, images, audio, and sprite assets.

---

## Requirements

### Requirement 1: Loading Screen

**User Story:** As a Player, I want to see a branded loading screen when the game starts, so that I know the game is loading and feel engaged from the first moment.

#### Acceptance Criteria

1. WHEN the Game is launched in a browser, THE Loading_Screen SHALL display a black background with white pixelated text reading "Who you gonna call? Bug Hunters!".
2. WHEN all assets have finished loading, THE Loading_Screen SHALL transition to the main menu within 500ms.
3. WHILE assets are loading, THE Loading_Screen SHALL display a visible loading progress indicator.

---

### Requirement 2: Player Avatar (Kiro)

**User Story:** As a Player, I want to control the Kiro ghost avatar, so that I have a recognizable and thematic character to play as.

#### Acceptance Criteria

1. THE Game SHALL represent the player character as the Kiro ghost avatar sprite.
2. WHEN the Player presses a directional input (arrow keys or WASD), THE Game SHALL move Kiro in the corresponding direction at a consistent speed of 200 pixels per second.
3. WHEN Kiro collides with a circuit board wall, THE Game SHALL stop Kiro's movement in the direction of the collision.
4. WHEN Kiro's lives reach zero, THE Game SHALL transition to the Game Over screen.
5. WHILE Kiro is moving, THE Game SHALL animate the Kiro sprite using the defined walk animation frames.

---

### Requirement 3: Enemy Types

**User Story:** As a Player, I want to face three distinct enemy types, so that the game presents varied and escalating challenges.

#### Acceptance Criteria

1. THE Game SHALL include a Wanderer enemy that moves in a random direction, changing direction every 1 to 3 seconds.
2. THE Game SHALL include a Seeker enemy that recalculates a path toward Kiro's current position every 500ms.
3. THE Game SHALL include a Replicator enemy that spawns one new Wanderer at its current position every 8 seconds, up to a maximum of 3 spawned Wanderers per Replicator.
4. WHEN Kiro collides with any Bug, THE Game SHALL reduce Kiro's lives by one and trigger a brief invincibility period of 3 seconds.
5. WHEN a Bug collides with a Module, THE Game SHALL reduce the Module's integrity by one unit.
6. IF a Module's integrity reaches zero, THEN THE Game SHALL trigger the level-failure condition.

---

### Requirement 4: Levels

**User Story:** As a Player, I want to progress through three distinct levels, so that the game provides increasing difficulty and variety.

#### Acceptance Criteria

1. THE Game SHALL contain exactly three Levels, each with a unique circuit board layout.
2. WHEN the Player eliminates all Bugs in a Level, THE Game SHALL display the level-complete screen and advance to the next Level.
3. WHEN the Player completes Level 3, THE Game SHALL display the victory screen with the final Score.
4. THE victory screen will say "I ain't afraid a no bugs" in the same style as the
loading screen.
5. THE Game SHALL increase the number of Seeker and Replicator enemies in each successive Level relative to the previous Level.
6. WHEN a Level begins, THE Game SHALL spawn all defined enemies for that Level at their designated starting positions.

---

### Requirement 5: Shooting Mechanic

**User Story:** As a Player, I want to shoot at bugs to eliminate them, so that I have an active way to interact with and defeat enemies.

#### Acceptance Criteria

1. WHEN the Player presses the designated fire input (spacebar or mouse click), THE Game SHALL fire a projectile from Kiro's current position in the direction Kiro is facing.
2. WHEN a projectile collides with a Bug, THE Game SHALL eliminate the Bug, remove the projectile, increment the Score by the Bug's defined point value, and play the elimination sound effect.
3. THE Game SHALL assign point values of 10 for Wanderer, 20 for Seeker, and 30 for Replicator.
4. WHEN a projectile travels beyond the circuit board boundary, THE Game SHALL remove the projectile.
5. THE Game SHALL limit the number of simultaneous active projectiles to 3.

---

### Requirement 6: Unlockable Powers

**User Story:** As a Player, I want to unlock and use special powers, so that I have strategic options to overcome difficult situations.

#### Acceptance Criteria

1. THE Game SHALL include at least two unlockable Powers: Freeze and Patch_Bomb.
2. WHEN the Player's Score reaches 150 points, THE Game SHALL unlock the Freeze Power and notify the Player via a HUD indicator.
3. WHEN the Player's Score reaches 300 points, THE Game SHALL unlock the Patch_Bomb Power and notify the Player via a HUD indicator.
4. WHEN the Player activates the Freeze Power, THE Game SHALL immobilize all Bugs on screen for 5 seconds and play the power activation sound effect.
5. WHEN the Player activates the Patch_Bomb Power, THE Game SHALL eliminate all Bugs within a radius of 250 pixels from Kiro's position and play the power activation sound effect.
6. WHILE a Power is on cooldown, THE Game SHALL display the remaining cooldown duration in the HUD and prevent the Player from activating that Power.
7. THE Game SHALL set the Freeze cooldown to 15 seconds and the Patch_Bomb cooldown to 20 seconds after each use.

---

### Requirement 7: HUD

**User Story:** As a Player, I want a clear heads-up display, so that I can monitor my score, lives, and available powers at all times.

#### Acceptance Criteria

1. THE HUD SHALL display the current Score, remaining lives, current Level number, and the status of each unlocked Power at all times during gameplay.
2. WHEN a Power is available, THE HUD SHALL display the Power icon in an active state.
3. WHEN a Power is on cooldown, THE HUD SHALL display the Power icon in a dimmed state alongside the remaining cooldown time in seconds.
4. WHEN Kiro loses a life, THE HUD SHALL update the lives display within one rendered frame.

---

### Requirement 8: Sound Effects

**User Story:** As a Player, I want audio feedback for game events, so that the game feels responsive and immersive.

#### Acceptance Criteria

1. THE Sound_Manager SHALL play a distinct sound effect when a projectile is fired.
2. THE Sound_Manager SHALL play a distinct sound effect when a Bug is eliminated.
3. THE Sound_Manager SHALL play a distinct sound effect when a Power is unlocked.
4. THE Sound_Manager SHALL play a distinct sound effect when a Power is activated.
5. THE Sound_Manager SHALL play a distinct sound effect when Kiro loses a life.
6. THE Sound_Manager SHALL play looping background music during gameplay.
7. WHERE the Player has disabled audio in the game settings, THE Sound_Manager SHALL mute all sound output.

---

### Requirement 9: Progress Persistence

**User Story:** As a Player, I want my progress saved locally, so that I can return to the game and continue from where I left off.

#### Acceptance Criteria

1. WHEN the Player completes a Level, THE Progress_Manager SHALL write the highest Score achieved and the highest Level reached to LocalStorage.
2. WHEN the Game is launched, THE Progress_Manager SHALL read saved progress from LocalStorage and restore the highest Level reached and highest Score.
3. IF LocalStorage is unavailable or the stored data is malformed, THEN THE Progress_Manager SHALL initialize progress to default values (Level 1, Score 0) without throwing an error.
4. THE Progress_Manager SHALL store progress data under a namespaced key "bugbusters_progress" to avoid conflicts with other LocalStorage entries.
5. FOR ALL valid progress objects, serializing then deserializing the progress data SHALL produce an equivalent progress object (round-trip property).

---

### Requirement 10: Asset Loading

**User Story:** As a developer, I want all game assets loaded from open/free sources or generated locally, so that the game has no licensing issues.

#### Acceptance Criteria

1. THE Asset_Loader SHALL load all fonts, background images, sprite sheets, and audio files from open-licensed or procedurally generated sources.
2. WHEN an asset fails to load, THE Asset_Loader SHALL log the asset path and error to the browser console and substitute a fallback placeholder asset.
3. THE Game SHALL use a pixelated font (such as "Press Start 2P" from Google Fonts) for all in-game text rendering.

---

### Requirement 11: Kiro Feature Documentation

**User Story:** As a contest judge, I want to see how Kiro's IDE features were used to build the game, so that I can evaluate the submission's use of the platform.

#### Acceptance Criteria

1. THE Game repository SHALL include a README.md written in Spanish that explains the game, its controls, and its features.
2. THE README.md SHALL document how each of the following Kiro features was used during development: specs, steering rules, hooks, MCP, and powers.
3. THE Game source code SHALL include comments written in Spanish explaining the logic of each major system.
4. THE Game logic and variable names SHALL be written in English.
