/**
 * Tests unitarios para HUDManager.
 */

import { HUDManager } from '../../src/managers/HUDManager.js';

function createMockScene() {
  const makeText = (x, y, text) => ({
    x, y,
    _text: text,
    _style: { fill: '#ffffff' },
    setText(t) { this._text = t; },
    setStyle(s) { Object.assign(this._style, s); },
    setScrollFactor() { return this; }
  });
  return { add: { text: (x, y, text) => makeText(x, y, text) } };
}

test('constructor crea objetos de texto cuando scene.add está disponible', () => {
  const hud = new HUDManager(createMockScene());
  expect(hud._scoreText).not.toBeNull();
  expect(hud._livesText).not.toBeNull();
  expect(hud._levelText).not.toBeNull();
});

test('constructor almacena null cuando scene.add no está disponible', () => {
  const hud = new HUDManager({});
  expect(hud._scoreText).toBeNull();
});

test('update actualiza el texto de puntuación correctamente', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(250, 3, 1, {});
  expect(hud._scoreText._text).toBe('SCORE: 250');
});

test('update actualiza el texto de vidas correctamente', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(0, 2, 1, {});
  expect(hud._livesText._text).toBe('LIVES: 2');
});

test('update actualiza el texto de nivel correctamente', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(0, 3, 2, {});
  expect(hud._levelText._text).toBe('LEVEL: 2');
});

test('update no lanza error cuando los textos son null', () => {
  const hud = new HUDManager({});
  expect(() => hud.update(100, 2, 1, {})).not.toThrow();
});

test('poder no desbloqueado muestra texto vacío', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(0, 3, 1, {
    freeze: { unlocked: false, onCooldown: false, remainingCooldown: 0 },
    patch_bomb: { unlocked: false, onCooldown: false, remainingCooldown: 0 }
  });
  expect(hud._freezeText._text).toBe('');
  expect(hud._patchBombText._text).toBe('');
});

test('poder desbloqueado y disponible muestra nombre en verde', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(200, 3, 1, {
    freeze: { unlocked: true, onCooldown: false, remainingCooldown: 0 }
  });
  expect(hud._freezeText._text).toBe('FREEZE');
  expect(hud._freezeText._style.fill).toBe('#00ff00');
});

test('poder en cooldown muestra nombre y segundos restantes en gris', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(200, 3, 1, {
    freeze: { unlocked: true, onCooldown: true, remainingCooldown: 8 }
  });
  expect(hud._freezeText._text).toBe('FREEZE: 8s');
  expect(hud._freezeText._style.fill).toBe('#888888');
});

test('update refleja cambios de score en llamadas sucesivas', () => {
  const hud = new HUDManager(createMockScene());
  hud.update(0, 3, 1, {});
  hud.update(10, 3, 1, {});
  hud.update(30, 2, 1, {});
  expect(hud._scoreText._text).toBe('SCORE: 30');
  expect(hud._livesText._text).toBe('LIVES: 2');
});
