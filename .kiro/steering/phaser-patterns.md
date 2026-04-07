# Bug Busters — Patrones Phaser 3

Patrones establecidos en el proyecto. Seguirlos consistentemente en todo código nuevo.

## Ciclo de vida de escenas

El orden de métodos en una escena es siempre: `constructor → init → preload → create → update`.

- `init(data)` — recibir datos entre escenas (nivel, score, vidas). Inicializar estado de la escena aquí.
- `create()` — instanciar entidades, managers, controles y colisiones.
- `update()` — loop principal. Siempre empezar con el guard de transición.

```js
update() {
  if (this._transitioning) return;
  // ... lógica del frame
}
```

## Transiciones entre escenas

Siempre usar el flag `_transitioning` para evitar llamadas dobles a `scene.start()`:

```js
_levelComplete() {
  if (this._transitioning) return;
  this._transitioning = true;
  this.scene.start('LevelCompleteScene', { level: this._currentLevel, score: this._scoreSystem.getScore() });
}
```

## Entidades físicas

### Creación
Registrar en la escena y habilitar física en el constructor de la entidad:

```js
if (typeof Phaser !== 'undefined' && scene && scene.add) {
  scene.add.existing(this);
  scene.physics.add.existing(this);
}
```

### Eliminación
Usar `setActive(false)` + detener velocidad. No usar `destroy()` en entidades de grupos de física:

```js
_eliminateBug(bug) {
  if (!bug || bug.active === false) return;
  bug.setActive(false);
  if (bug.body) { bug.body.velocity.x = 0; bug.body.velocity.y = 0; }
}
```

### Colisiones
Verificar `active` antes de procesar cualquier overlap:

```js
this.physics.add.overlap(projectiles, bug, (projectile, hitBug) => {
  if (!hitBug || hitBug.active === false) return;
  if (!projectile || projectile.active === false) return;
  // procesar colisión
});
```

## Cámara y HUD

Anclar elementos del HUD a la cámara con `setScrollFactor(0)`:

```js
const scoreText = this.add.text(16, 16, 'SCORE: 0', { ... }).setScrollFactor(0);
```

Para efectos de shake de cámara:

```js
this.cameras.main.shake(duration_ms, intensity);
// Ejemplo: this.cameras.main.shake(200, 0.01);
```

## Tweens

Patrón estándar para efectos de parpadeo (blink):

```js
this.tweens.add({
  targets: sprite,
  alpha: 0,
  duration: 100,
  yoyo: true,
  repeat: 5,
});
```

Patrón para fade-in de escena:

```js
this.cameras.main.fadeIn(500, 0, 0, 0);
```

## Timers

Usar `this.time.delayedCall` para acciones únicas diferidas:

```js
this.time.delayedCall(500, () => { this.scene.start('NextScene'); });
```

Usar `this.time.addEvent` para acciones repetidas:

```js
this.time.addEvent({ delay: 50, repeat: 9, callback: () => { /* ... */ } });
```

## Partículas (Phaser 3.60+)

Para efectos de explosión al eliminar enemigos:

```js
const particles = this.add.particles(x, y, 'projectile', {
  speed: { min: 50, max: 150 },
  scale: { start: 0.5, end: 0 },
  lifespan: 400,
  quantity: 8,
  emitting: false,
});
particles.explode(8);
```

## Efectos de pantalla arcade

### Screen shake al recibir daño
```js
this.cameras.main.shake(150, 0.008);
```

### Hit-stop (freeze frame breve al eliminar enemigo)
```js
this.time.timeScale = 0.05;
this.time.delayedCall(80, () => { this.time.timeScale = 1; });
```

### Flash de pantalla
```js
this.cameras.main.flash(200, 255, 255, 255, false);
```

## Tilemap

Estructura esperada de los tilemaps JSON (Tiled):
- Capa: `"ground"`
- Tileset: `"tileset"` (referencia a `assets/sprites/tileset.png`)
- Propiedad de colisión: `collides: true` en tiles que bloquean

```js
const map = this.make.tilemap({ key: 'circuit_1' });
const tileset = map.addTilesetImage('tileset', 'tileset');
const layer = map.createLayer('ground', tileset, 0, 0);
map.setCollisionByProperty({ collides: true });
```

## Fuente tipográfica

Siempre usar `"Press Start 2P"` (cargada vía Google Fonts en `index.html`):

```js
this.add.text(x, y, 'TEXTO', {
  fontFamily: '"Press Start 2P"',
  fontSize: '16px',
  fill: '#ffffff',
}).setOrigin(0.5);
```

## Teclado

Patrón para detectar flanco de subida (key just pressed, no held):

```js
// En create():
this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
this._spaceWasDown = false;

// En update():
const spaceDown = this._spaceKey.isDown;
if (spaceDown && !this._spaceWasDown) { /* acción */ }
this._spaceWasDown = spaceDown;
```

Para detección simple de "just pressed":

```js
if (Phaser.Input.Keyboard.JustDown(this._qKey)) { /* acción */ }
```
