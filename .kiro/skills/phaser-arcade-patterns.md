---
inclusion: manual
---

# Phaser 3 Arcade Feel — Snippets de Referencia

Usa este skill cuando implementes efectos visuales o de juego de estilo arcade en Bug Busters.

## Screen Shake

```js
// Shake suave al recibir daño
this.cameras.main.shake(150, 0.008);

// Shake fuerte para game over o explosión grande
this.cameras.main.shake(300, 0.02);
```

## Flash de pantalla

```js
// Flash blanco breve (hit confirm)
this.cameras.main.flash(150, 255, 255, 255, false);

// Flash rojo (daño recibido)
this.cameras.main.flash(200, 255, 0, 0, false);
```

## Hit-stop (freeze frame)

Pausa brevemente el tiempo del juego para dar peso a los impactos:

```js
// En GameScene, al eliminar un enemigo:
this.time.timeScale = 0.05;
this.time.delayedCall(80, () => { this.time.timeScale = 1; });
```

## Partículas de explosión

```js
// Al eliminar un bug en GameScene._eliminateBug():
const emitter = this.add.particles(bug.x, bug.y, 'projectile', {
  speed: { min: 60, max: 180 },
  scale: { start: 0.6, end: 0 },
  alpha: { start: 1, end: 0 },
  lifespan: 350,
  quantity: 10,
  emitting: false,
});
emitter.explode(10);
// Limpiar el emitter después de que las partículas mueran
this.time.delayedCall(400, () => emitter.destroy());
```

## Score pop-up flotante

Texto que sube y desaparece al eliminar un enemigo:

```js
// En GameScene._eliminateBug(), después de addPoints():
const popup = this.add.text(bug.x, bug.y, `+${points}`, {
  fontFamily: '"Press Start 2P"',
  fontSize: '10px',
  fill: '#ffff00',
}).setOrigin(0.5).setDepth(10);

this.tweens.add({
  targets: popup,
  y: bug.y - 40,
  alpha: 0,
  duration: 700,
  ease: 'Power2',
  onComplete: () => popup.destroy(),
});
```

## Blink de invencibilidad

Parpadeo del sprite de Kiro durante el período de invencibilidad:

```js
// En Kiro.triggerInvincibility():
this._invincibleUntil = this.scene.time.now + CONSTANTS.INVINCIBILITY_DURATION;
this.scene.tweens.add({
  targets: this,
  alpha: 0.2,
  duration: 100,
  yoyo: true,
  repeat: Math.floor(CONSTANTS.INVINCIBILITY_DURATION / 200) - 1,
  onComplete: () => { this.alpha = 1; },
});
```

## Pantalla de carga con efecto arcade

Loading screen extendida con scanlines y texto animado:

```js
// En LoadingScene.create():
// Fondo negro con overlay de scanlines (líneas horizontales semitransparentes)
const scanlines = this.add.graphics();
for (let y = 0; y < height; y += 4) {
  scanlines.fillStyle(0x000000, 0.3);
  scanlines.fillRect(0, y, width, 2);
}

// Texto parpadeante de "LOADING..."
const loadingText = this.add.text(width / 2, height / 2 + 60, 'LOADING...', {
  fontFamily: '"Press Start 2P"',
  fontSize: '10px',
  fill: '#00ff00',
}).setOrigin(0.5);

this.tweens.add({
  targets: loadingText,
  alpha: 0,
  duration: 400,
  yoyo: true,
  repeat: -1,
});
```

## Fade entre escenas

```js
// Fade out antes de transicionar:
this.cameras.main.fadeOut(300, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.start('NextScene', data);
});

// Fade in al entrar a una escena (en create()):
this.cameras.main.fadeIn(400, 0, 0, 0);
```

## Efecto CRT (post-processing pipeline)

Requiere un custom pipeline. Alternativa ligera con graphics overlay:

```js
// Overlay de viñeta CRT en cualquier escena
const vignette = this.add.graphics().setDepth(100).setScrollFactor(0);
const cx = width / 2, cy = height / 2;
for (let r = Math.max(width, height); r > 0; r -= 2) {
  const alpha = Math.max(0, (r / Math.max(width, height) - 0.4) * 0.6);
  vignette.fillStyle(0x000000, alpha);
  vignette.fillCircle(cx, cy, r);
}
```

## Animación de título en MainMenu

```js
// Título que aparece con bounce desde arriba:
const title = this.add.text(width / 2, -60, 'BUG BUSTERS', { ... }).setOrigin(0.5);
this.tweens.add({
  targets: title,
  y: height / 2 - 100,
  duration: 800,
  ease: 'Bounce.easeOut',
});
```
