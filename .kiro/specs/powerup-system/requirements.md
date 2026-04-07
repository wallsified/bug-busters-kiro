# Requirements Document

## Introduction

The powerup system introduces three score-triggered powerups to Bug Busters that activate automatically when the player reaches the required score threshold. Each powerup provides a distinct gameplay advantage: a larger projectile for 5 seconds, instant elimination of all bugs within a 50px radius, or an extra life. Powerup availability is shown in the HUD, audio feedback plays on unlock and activation, and a brief on-screen message appears when a powerup fires. A tutorial screen before the first level explains all three powerups to the player.

## Glossary

- **Powerup_System**: The subsystem responsible for tracking score thresholds, triggering powerup effects, and communicating state to the HUD and audio systems.
- **Blast_A_Bug**: The powerup unlocked at every 20-point milestone that enlarges the player's projectile for 5 seconds.
- **Bug_Free_Zone**: The powerup unlocked at every 40-point milestone that instantly eliminates all bugs within a 50px radius of Kiro.
- **Extra_Life**: The powerup unlocked at every 100-point milestone that grants the player one additional life.
- **HUD**: The heads-up display rendered in GameScene that shows score, lives, level, and powerup availability.
- **Tutorial_Screen**: A scene displayed before the first level that explains the three powerups to the player.
- **Powerup_Banner**: A brief text message displayed on screen when a powerup activates, which disappears automatically after a short duration.
- **ScoreSystem**: The existing manager that tracks the player's current score and fires a callback on each change.
- **PowerManager**: The existing manager responsible for powerup state, unlock logic, and activation effects.
- **SoundManager**: The existing manager that plays audio assets by key.
- **AssetLoader**: The existing manager that preloads all game assets in LoadingScene.
- **Kiro**: The player-controlled character entity.
- **ProjectileGroup**: The group managing all active projectiles fired by Kiro.

---

## Requirements

### Requirement 1: Blast-a-Bug Powerup

**User Story:** As a player, I want a bigger projectile to fire automatically when I reach every 20-point milestone, so that I can eliminate bugs more easily for a short burst.

#### Acceptance Criteria

1. WHEN the player's score reaches a multiple of 20, THE Powerup_System SHALL activate the Blast_A_Bug powerup automatically without requiring player input.
2. WHILE the Blast_A_Bug powerup is active, THE ProjectileGroup SHALL fire projectiles scaled to 2.5× the normal projectile size.
3. WHILE the Blast_A_Bug powerup is active, THE Powerup_System SHALL maintain the enlarged projectile effect for exactly 5000 milliseconds.
4. WHEN the Blast_A_Bug duration expires, THE ProjectileGroup SHALL revert projectiles to their normal size immediately.
5. WHEN the Blast_A_Bug powerup activates, THE Powerup_Banner SHALL display the text "BLAST-A-BUG!" on screen and disappear after 1500 milliseconds.
6. WHEN the Blast_A_Bug powerup activates, THE SoundManager SHALL play the `sfx_power_activate` audio asset.

---

### Requirement 2: Bug Free Zone Powerup

**User Story:** As a player, I want all nearby bugs eliminated automatically when I reach every 40-point milestone, so that I get a moment of relief from surrounding threats.

#### Acceptance Criteria

1. WHEN the player's score reaches a multiple of 40, THE Powerup_System SHALL activate the Bug_Free_Zone powerup automatically without requiring player input.
2. WHEN the Bug_Free_Zone powerup activates, THE Powerup_System SHALL eliminate all bugs whose center is within 50 pixels of Kiro's center.
3. WHEN the Bug_Free_Zone powerup activates, THE Powerup_Banner SHALL display the text "BUG FREE ZONE!" on screen and disappear after 1500 milliseconds.
4. WHEN the Bug_Free_Zone powerup activates, THE SoundManager SHALL play the `sfx_power_activate` audio asset.
5. IF no bugs are within 50 pixels of Kiro when Bug_Free_Zone activates, THEN THE Powerup_System SHALL still play the activation sound and show the banner without error.

---

### Requirement 3: Extra Life Powerup

**User Story:** As a player, I want to receive an extra life automatically when I reach every 100-point milestone, so that I can continue playing longer after taking damage.

#### Acceptance Criteria

1. WHEN the player's score reaches a multiple of 100, THE Powerup_System SHALL grant the player one additional life automatically.
2. WHEN the Extra_Life powerup activates, THE Powerup_Banner SHALL display the text "EXTRA LIFE!" on screen and disappear after 1500 milliseconds.
3. WHEN the Extra_Life powerup activates, THE SoundManager SHALL play the `sfx_power_activate` audio asset.
4. THE Powerup_System SHALL grant the Extra_Life powerup independently of the Blast_A_Bug and Bug_Free_Zone powerups when the score is a multiple of both 20 and 100, or both 40 and 100.

---

### Requirement 4: Powerup Banner Display

**User Story:** As a player, I want a brief message to appear on screen when a powerup fires, so that I know which powerup was triggered.

#### Acceptance Criteria

1. WHEN any powerup activates, THE Powerup_Banner SHALL appear centered on screen at a depth above all gameplay elements.
2. WHEN the Powerup_Banner appears, THE Powerup_Banner SHALL remain visible for 1500 milliseconds and then disappear.
3. THE Powerup_Banner SHALL use the `"Press Start 2P"` font at 20px size with a yellow fill color (`#ffff00`).
4. IF a second powerup activates while a Powerup_Banner is already visible, THEN THE Powerup_Banner SHALL replace the current text with the new powerup name and reset the 1500 millisecond timer.

---

### Requirement 5: HUD Powerup Availability

**User Story:** As a player, I want to see which powerups are available or approaching in the HUD, so that I can anticipate upcoming powerup activations.

#### Acceptance Criteria

1. THE HUD SHALL display the score threshold for the next Blast_A_Bug activation (next multiple of 20 above current score).
2. THE HUD SHALL display the score threshold for the next Bug_Free_Zone activation (next multiple of 40 above current score).
3. THE HUD SHALL display the score threshold for the next Extra_Life activation (next multiple of 100 above current score).
4. WHEN a powerup is currently active (Blast_A_Bug), THE HUD SHALL display the remaining active duration in whole seconds.
5. THE HUD SHALL update the powerup availability display on every frame to reflect the current score and active state.

---

### Requirement 6: Audio Assets for Powerups

**User Story:** As a player, I want audio feedback when a powerup unlocks and when it activates, so that I have clear sensory confirmation of powerup events.

#### Acceptance Criteria

1. THE AssetLoader SHALL load the `sfx_power_unlock` audio asset from `assets/audio/sfx_power_unlock.mp3` during the loading phase.
2. THE AssetLoader SHALL load the `sfx_power_activate` audio asset from `assets/audio/sfx_power_activate.mp3` during the loading phase.
3. WHEN a powerup activates, THE SoundManager SHALL play `sfx_power_activate` exactly once per activation event.
4. IF the SoundManager is muted when a powerup activates, THEN THE SoundManager SHALL not play any audio for that event.

---

### Requirement 7: Tutorial Screen

**User Story:** As a new player, I want to see an explanation of all three powerups before the first level starts, so that I understand how the powerup system works before I need to use it.

#### Acceptance Criteria

1. WHEN the player starts a new game from the main menu at level 1, THE Tutorial_Screen SHALL be displayed before GameScene loads.
2. THE Tutorial_Screen SHALL describe the Blast_A_Bug powerup: "Every 20 pts — BLAST-A-BUG! Bigger projectile for 5 seconds".
3. THE Tutorial_Screen SHALL describe the Bug_Free_Zone powerup: "Every 40 pts — BUG FREE ZONE! Eliminates bugs within 50px".
4. THE Tutorial_Screen SHALL describe the Extra_Life powerup: "Every 100 pts — EXTRA LIFE! +1 life".
5. THE Tutorial_Screen SHALL provide a dismissal control (button or key press) that transitions the player to GameScene at level 1.
6. WHEN the player continues a saved game at a level greater than 1, THE Tutorial_Screen SHALL not be displayed.
7. THE Tutorial_Screen SHALL use the `"Press Start 2P"` font consistent with the rest of the game UI.

---

### Requirement 8: Auto-Use on Unlock

**User Story:** As a player, I want powerups to fire automatically the moment I earn them, so that I don't need to manage a separate activation input.

#### Acceptance Criteria

1. WHEN the Powerup_System detects a score milestone, THE Powerup_System SHALL activate the corresponding powerup in the same frame the score threshold is crossed.
2. THE Powerup_System SHALL evaluate all three powerup thresholds (20, 40, 100) on every score change callback from ScoreSystem.
3. WHEN a score value is simultaneously a multiple of 20 and 40 (i.e., a multiple of 40), THE Powerup_System SHALL activate both Blast_A_Bug and Bug_Free_Zone in the same score event.
4. WHEN a score value is simultaneously a multiple of 20 and 100, THE Powerup_System SHALL activate both Blast_A_Bug and Extra_Life in the same score event.
5. THE Powerup_System SHALL track the last score at which each powerup was triggered to prevent re-triggering on the same threshold value.
