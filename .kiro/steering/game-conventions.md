# Bug Busters — Convenciones del Proyecto

## Idioma del código

- **Comentarios e inline docs**: siempre en **español**. Esto incluye JSDoc (`@param`, `@returns`, descripciones), comentarios de bloque y comentarios inline.
- **Identificadores**: siempre en **inglés**. Nombres de variables, funciones, clases, constantes, claves de assets y strings de lógica de juego.

```js
// ✅ Correcto
// Velocidad de movimiento del jugador en píxeles por segundo
const PLAYER_SPEED = 200;

// ❌ Incorrecto
// Player movement speed in pixels per second
const velocidadJugador = 200;
```

## Constantes y valores numéricos

- **Nunca** usar magic numbers directamente en el código. Siempre referenciar `CONSTANTS` desde `src/config/constants.js`.
- Si necesitas un nuevo valor configurable, agrégalo a `CONSTANTS` primero.

```js
// ✅ Correcto
this.body.velocity.x = CONSTANTS.PLAYER_SPEED;

// ❌ Incorrecto
this.body.velocity.x = 200;
```

## Estructura de archivos

```
src/
  config/       → constants.js, levels.js
  entities/     → Bug.js (base), Kiro.js, Wanderer.js, Seeker.js, Replicator.js, Module.js, ProjectileGroup.js
  managers/     → AssetLoader.js, HUDManager.js, PowerManager.js, ProgressManager.js, ScoreSystem.js, SoundManager.js
  scenes/       → BootScene.js, LoadingScene.js, MainMenuScene.js, GameScene.js, LevelCompleteScene.js, GameOverScene.js, VictoryScene.js
assets/
  sprites/      → PNG spritesheets (32×32 frames)
  tilemaps/     → circuit_1.json, circuit_2.json, circuit_3.json
  audio/        → MP3 files
tests/unit/     → un archivo .test.js por cada módulo
```

## Compatibilidad con entornos sin Phaser (Jest)

Todas las entidades que extienden clases de Phaser deben usar el patrón de clase base condicional:

```js
const BaseSprite = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Sprite
  : class {
      constructor() {
        this.body = { velocity: { x: 0, y: 0 } };
        this.anims = { play: () => {}, stop: () => {} };
      }
    };

export class MyEntity extends BaseSprite { ... }
```

## Gestión de estado de escena

- Usar `this._transitioning = true` como guard antes de cualquier `this.scene.start()` para evitar transiciones dobles.
- Verificar siempre `if (this._transitioning) return;` al inicio de `update()`.

## Eliminación de entidades

- Usar `setActive(false)` + detener velocidad en lugar de `destroy()` para entidades en grupos de física.
- Verificar `if (!entity || entity.active === false) return;` antes de procesar colisiones.

## Fuente tipográfica

- Usar siempre `"Press Start 2P"` (Google Fonts, cargada vía CDN en `index.html`) para todo texto en pantalla.
- Tamaños recomendados: títulos 24px, subtítulos 16px, HUD 12px, detalles 8px.

## Tests

- Property tests con `fast-check`, mínimo `{ numRuns: 100 }`.
- Unit tests con Jest, entorno Phaser mockeado.
- Un archivo de test por módulo en `tests/unit/`.
- Ejecutar con `npm test` (alias de `jest --runInBand`).
