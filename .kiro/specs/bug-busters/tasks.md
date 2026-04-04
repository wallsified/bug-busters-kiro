# Implementation Plan: Bug Busters

## Overview

Implementación incremental del juego Bug Busters usando Phaser 3 (CDN), JavaScript ES6+ y Jest + fast-check para pruebas. Cada tarea construye sobre la anterior, terminando con la integración completa y el README en español.

## Tasks

- [x] 1. Scaffolding del proyecto y estructura de archivos
  - Crear `index.html` con CDN de Phaser 3, Google Fonts (Press Start 2P) y carga de módulos JS
  - Crear estructura de directorios: `src/scenes/`, `src/managers/`, `src/entities/`, `src/config/`, `assets/`, `tests/unit/`
  - Crear `src/config/levels.js` con las configuraciones de los tres niveles (tilemapKey, enemies, modules)
  - Crear `src/config/constants.js` con constantes del juego (velocidades, umbrales, cooldowns, puntos)
  - Crear `package.json` con dependencias de desarrollo: jest, fast-check, babel-jest, @babel/preset-env
  - Crear `babel.config.js` y `jest.config.js` para soporte de módulos ES6 en tests
  - _Requirements: 4.1, 4.5, 10.1_

- [x] 2. ProgressManager
  - [x] 2.1 Implementar `src/managers/ProgressManager.js` con métodos `load()` y `save(level, score)`
    - Usar clave `bugbusters_progress`, manejar errores de localStorage y JSON malformado
    - `load()` retorna `{ level: 1, score: 0 }` como valores por defecto ante cualquier fallo
    - `save()` persiste solo si los nuevos valores superan los almacenados
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 2.2 Escribir property tests para ProgressManager (Property 11, 12, 13)
    - **Property 11: Progress persistence saves maximum values** — Validates: Requirements 9.1
    - **Property 12: Progress round-trip** — Validates: Requirements 9.5
    - **Property 13: Malformed localStorage defaults gracefully** — Validates: Requirements 9.3
    - Archivo: `tests/unit/ProgressManager.test.js`
  - [x] 2.3 Escribir unit tests de ejemplo para ProgressManager
    - Casos: localStorage no disponible, datos válidos, sobrescritura con score menor
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. SoundManager
  - [x] 3.1 Implementar `src/managers/SoundManager.js` con métodos `play(key)`, `startMusic()`, `setMuted(muted)`
    - Envolver el sistema de audio de Phaser; respetar el estado de mute global
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  - [x] 3.2 Escribir property test para SoundManager (Property 10)
    - **Property 10: Muted audio produces no sound output** — Validates: Requirements 8.7
    - Archivo: `tests/unit/SoundManager.test.js`

- [x] 4. AssetLoader
  - [x] 4.1 Implementar `src/managers/AssetLoader.js` con métodos `preload(scene)` y `getFallback(key)`
    - Registrar todos los assets del manifiesto (sprites, tilemaps, audio)
    - Manejar fallos de carga: loguear al console y sustituir con placeholder
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 4.2 Escribir property test para AssetLoader (Property 14)
    - **Property 14: Asset load failure uses fallback** — Validates: Requirements 10.2
    - Archivo: `tests/unit/AssetLoader.test.js`

- [x] 5. Checkpoint — Asegurar que todos los tests de managers pasen
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Entidades del juego: Kiro y proyectiles
  - [x] 6.1 Implementar `src/entities/Kiro.js` extendiendo `Phaser.Physics.Arcade.Sprite`
    - Métodos: `update(cursors, wasd)`, `triggerInvincibility()`, getters `isInvincible` y `facing`
    - Movimiento a 200px/s, animación de caminar, período de invencibilidad de 3 segundos
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - [x] 6.2 Escribir property test para Kiro (Property 3)
    - **Property 3: Bug collision reduces Kiro's lives by exactly one** — Validates: Requirements 3.4
    - Archivo: `tests/unit/Kiro.test.js`
  - [x] 6.3 Implementar `src/entities/ProjectileGroup.js` extendiendo `Phaser.Physics.Arcade.Group`
    - Método `fire(x, y, direction)` con límite de 3 proyectiles activos simultáneos
    - _Requirements: 5.1, 5.4, 5.5_
  - [x] 6.4 Escribir property test para ProjectileGroup (Property 7)
    - **Property 7: Active projectile count never exceeds 3** — Validates: Requirements 5.5
    - Archivo: `tests/unit/ProjectileGroup.test.js`

- [x] 7. Entidades enemigas
  - [x] 7.1 Implementar `src/entities/Bug.js` como clase base extendiendo `Phaser.Physics.Arcade.Sprite`
    - Getter abstracto `pointValue`, método abstracto `update(kiroX, kiroY)`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 Implementar `src/entities/Wanderer.js`
    - Cambio de dirección aleatoria cada 1–3 segundos, `pointValue` = 10
    - _Requirements: 3.1, 5.3_
  - [x] 7.3 Escribir property test para Wanderer (Property 1)
    - **Property 1: Wanderer direction-change interval is within bounds** — Validates: Requirements 3.1
    - Archivo: `tests/unit/Wanderer.test.js`
  - [x] 7.4 Implementar `src/entities/Seeker.js`
    - Recalcula ruta hacia Kiro cada 500ms, `pointValue` = 20
    - _Requirements: 3.2, 5.3_
  - [x] 7.5 Implementar `src/entities/Replicator.js`
    - Genera un Wanderer cada 8 segundos, máximo 3 spawns, `pointValue` = 30
    - _Requirements: 3.3, 5.3_
  - [x] 7.6 Escribir property test para Replicator (Property 2)
    - **Property 2: Replicator spawn cap** — Validates: Requirements 3.3
    - Archivo: `tests/unit/Replicator.test.js`

- [x] 8. Module (objeto protegible)
  - [x] 8.1 Implementar `src/entities/Module.js` con propiedad `integrity` y método `hit()`
    - `hit()` reduce `integrity` en 1; cuando llega a 0 emite evento de fallo de nivel
    - _Requirements: 3.5, 3.6_
  - [x] 8.2 Escribir property test para Module (Property 4)
    - **Property 4: Bug-Module collision reduces integrity by exactly one** — Validates: Requirements 3.5
    - Archivo: `tests/unit/Module.test.js`

- [x] 9. PowerManager y sistema de puntuación
  - [x] 9.1 Implementar `src/managers/PowerManager.js` con métodos `checkUnlocks(score)`, `activate(powerName, kiroPosition, bugs)`, `getState()`
    - Umbrales: Freeze en 150 pts (cooldown 15s), Patch_Bomb en 300 pts (cooldown 20s)
    - `activate()` retorna `false` si el poder está en cooldown o no desbloqueado
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 9.2 Escribir property tests para PowerManager (Properties 8, 9)
    - **Property 8: Freeze immobilizes all bugs** — Validates: Requirements 6.4
    - **Property 9: Patch_Bomb eliminates bugs within radius only** — Validates: Requirements 6.5
    - Archivo: `tests/unit/PowerManager.test.js`
  - [x] 9.3 Implementar sistema de puntuación en `src/managers/ScoreSystem.js`
    - Incrementa score según `pointValue` del bug eliminado; verifica desbloqueos de poderes
    - _Requirements: 5.2, 5.3, 6.2, 6.3_
  - [x] 9.4 Escribir property tests para ScoreSystem (Properties 5, 6)
    - **Property 5: Enemy escalation across levels** — Validates: Requirements 4.5
    - **Property 6: Score increment matches bug point value** — Validates: Requirements 5.2, 5.3
    - Archivo: `tests/unit/ScoreSystem.test.js`

- [x] 10. Checkpoint — Asegurar que todos los tests de entidades y managers pasen
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. HUDManager
  - [x] 11.1 Implementar `src/managers/HUDManager.js` con método `update(score, lives, level, powerState)`
    - Mostrar score, vidas, nivel actual y estado de poderes (activo/cooldown con tiempo restante)
    - Usar fuente Press Start 2P; anclar elementos a la cámara
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 11.2 Escribir unit tests para HUDManager
    - Verificar actualización correcta del HUD tras eventos de juego
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Escenas de Phaser
  - [x] 12.1 Implementar `src/scenes/BootScene.js`
    - Registrar todas las claves de assets usando AssetLoader; iniciar LoadingScene
    - _Requirements: 10.1, 10.2_
  - [x] 12.2 Implementar `src/scenes/LoadingScene.js`
    - Fondo negro, texto pixelado "Who you gonna call? Bug Hunters!", barra de progreso visible
    - Transición a MainMenuScene dentro de 500ms tras completar la carga
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 12.3 Implementar `src/scenes/MainMenuScene.js`
    - Título del juego, botón de inicio, mostrar high score restaurado desde ProgressManager
    - _Requirements: 9.2_
  - [x] 12.4 Implementar `src/scenes/GameScene.js` — núcleo del gameplay
    - Instanciar todos los managers (SoundManager, HUDManager, PowerManager, ScoreSystem)
    - Cargar tilemap del nivel actual, spawnear enemigos en posiciones definidas
    - Loop de juego: update de Kiro, enemies, colisiones, HUD, poderes
    - Manejar condición de victoria de nivel (todos los bugs eliminados) y derrota (módulo destruido o vidas = 0)
    - _Requirements: 2.2, 2.3, 2.4, 3.4, 3.5, 3.6, 4.2, 4.6, 5.1, 5.2, 6.4, 6.5, 8.1–8.6_
  - [x] 12.5 Implementar `src/scenes/LevelCompleteScene.js`
    - Mostrar resumen del nivel, guardar progreso con ProgressManager, avanzar al siguiente nivel o VictoryScene
    - _Requirements: 4.2, 4.3, 9.1_
  - [x] 12.6 Implementar `src/scenes/GameOverScene.js`
    - Mostrar pantalla de game over con opción de reinicio
    - _Requirements: 2.4_
  - [x] 12.7 Implementar `src/scenes/VictoryScene.js`
    - Mostrar "I ain't afraid of no bugs" en estilo pixelado con score final
    - _Requirements: 4.3, 4.4_

- [x] 13. Integración final y assets
  - [x] 13.1 Crear tilemaps JSON para los tres niveles en `assets/tilemaps/`
    - Diseñar layouts únicos de circuit board para circuit_1.json, circuit_2.json, circuit_3.json
    - _Requirements: 4.1_
  - [x] 13.2 Crear o referenciar sprites y audio open-licensed
    - Documentar fuentes de cada asset en un archivo `assets/CREDITS.txt`
    - Verificar que todos los assets del manifiesto estén presentes o tengan fallback
    - _Requirements: 10.1, 10.3_
  - [x] 13.3 Conectar todas las escenas en `index.html` con la configuración de Phaser
    - Registrar todas las escenas, configurar física arcade, resolución y escala
    - _Requirements: 2.1, 4.6_

- [x] 14. Checkpoint — Verificar flujo completo del juego
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. README.md en español
  - Crear `README.md` en español con descripción del juego, controles y características
  - Documentar el uso de cada feature de Kiro IDE: specs, steering rules, hooks, MCP y powers
  - _Requirements: 11.1, 11.2_

- [x] 16. Checkpoint final — Revisión completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los comentarios en el código fuente deben estar en español; el código y nombres de variables en inglés
- Los property tests usan fast-check con mínimo 100 iteraciones (`{ numRuns: 100 }`)
- Los tests unitarios usan Jest con entorno Phaser mockeado
