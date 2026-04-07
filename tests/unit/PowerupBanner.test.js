/**
 * Tests unitarios y de propiedades para PowerupBanner.
 */

import fc from 'fast-check';
import { PowerupBanner } from '../../src/managers/PowerupBanner.js';
import { CONSTANTS } from '../../src/config/constants.js';

/**
 * Crea una escena mock con soporte para time.delayedCall.
 * @returns {{ scene, lastTimer }}
 */
function createMockScene() {
  const timers = [];
  const scene = {
    scale: { width: 800, height: 600 },
    add: {
      text: jest.fn((_x, _y, _text, _style) => ({
        _text: '',
        _visible: false,
        _depth: 0,
        _scrollFactor: 1,
        _origin: null,
        setText(t) { this._text = t; return this; },
        setVisible(v) { this._visible = v; return this; },
        setDepth(d) { this._depth = d; return this; },
        setScrollFactor(f) { this._scrollFactor = f; return this; },
        setOrigin(o) { this._origin = o; return this; },
      })),
    },
    time: {
      delayedCall: jest.fn((delay, cb) => {
        const timer = { delay, cb, removed: false, remove: jest.fn(() => { timer.removed = true; }) };
        timers.push(timer);
        return timer;
      }),
    },
  };
  return { scene, timers };
}

// --- Tests unitarios ---

test('constructor crea el texto con depth 500 y scrollFactor 0', () => {
  const { scene } = createMockScene();
  const banner = new PowerupBanner(scene);
  expect(banner._text._depth).toBe(500);
  expect(banner._text._scrollFactor).toBe(0);
});

test('constructor crea el texto inicialmente oculto', () => {
  const { scene } = createMockScene();
  const banner = new PowerupBanner(scene);
  expect(banner._text._visible).toBe(false);
});

test('constructor usa la fuente "Press Start 2P" a 20px en amarillo', () => {
  const { scene } = createMockScene();
  new PowerupBanner(scene);
  const callArgs = scene.add.text.mock.calls[0];
  expect(callArgs[3].fontFamily).toBe('"Press Start 2P"');
  expect(callArgs[3].fontSize).toBe('20px');
  expect(callArgs[3].fill).toBe('#ffff00');
});

test('show() establece el texto y hace visible el banner', () => {
  const { scene } = createMockScene();
  const banner = new PowerupBanner(scene);
  banner.show('BLAST-A-BUG!');
  expect(banner._text._text).toBe('BLAST-A-BUG!');
  expect(banner._text._visible).toBe(true);
});

test('show() inicia un delayedCall con POWERUP_BANNER_DURATION', () => {
  const { scene, timers } = createMockScene();
  const banner = new PowerupBanner(scene);
  banner.show('BUG FREE ZONE!');
  expect(timers.length).toBe(1);
  expect(timers[0].delay).toBe(CONSTANTS.POWERUP_BANNER_DURATION);
});

test('hide() oculta el banner', () => {
  const { scene } = createMockScene();
  const banner = new PowerupBanner(scene);
  banner.show('EXTRA LIFE!');
  banner.hide();
  expect(banner._text._visible).toBe(false);
});

test('show() sin scene.time no lanza error', () => {
  const banner = new PowerupBanner({});
  expect(() => banner.show('TEST')).not.toThrow();
});

// --- Property 7: Banner replacement resets timer ---

test('Property 7: llamar show() dos veces cancela el timer anterior y reinicia uno nuevo', () => {
  // Feature: powerup-system, Property 7: Banner replacement resets timer
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      (text1, text2) => {
        const { scene, timers } = createMockScene();
        const banner = new PowerupBanner(scene);

        banner.show(text1);
        const firstTimer = timers[0];

        banner.show(text2);

        // El primer timer debe haber sido cancelado
        expect(firstTimer.remove).toHaveBeenCalled();
        // El texto debe ser el del segundo show
        expect(banner._text._text).toBe(text2);
        // Debe haber exactamente 2 timers creados (uno por cada show)
        expect(timers.length).toBe(2);
        // El banner sigue visible
        expect(banner._text._visible).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
