/**
 * Tests de propiedades para AssetLoader.
 * Usa fast-check para verificar que los fallos de carga usan un fallback y loguean el error.
 */

import fc from 'fast-check';
import { AssetLoader } from '../../src/managers/AssetLoader.js';

// Crea un mock de la escena de Phaser con scene.load y sus métodos
function createMockScene() {
  const listeners = {};
  return {
    load: {
      spritesheet: jest.fn(),
      image: jest.fn(),
      tilemapTiledJSON: jest.fn(),
      audio: jest.fn(),
      on: jest.fn((event, cb) => {
        listeners[event] = cb;
      }),
      _emit: (event, data) => {
        if (listeners[event]) listeners[event](data);
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Property 14: Asset load failure uses fallback
// ---------------------------------------------------------------------------

test('Property 14a: getFallback() retorna un valor no-null y no-undefined para cualquier clave', () => {
  // Feature: bug-busters, Property 14: Asset load failure uses fallback
  fc.assert(
    fc.property(
      fc.string(),
      (key) => {
        const loader = new AssetLoader();
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const fallback = loader.getFallback(key);

        consoleSpy.mockRestore();
        return fallback !== null && fallback !== undefined;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 14b: getFallback() loguea a console.warn para cualquier clave', () => {
  // Feature: bug-busters, Property 14: Asset load failure uses fallback
  fc.assert(
    fc.property(
      fc.string(),
      (key) => {
        const loader = new AssetLoader();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        loader.getFallback(key);

        const called = warnSpy.mock.calls.length > 0;
        warnSpy.mockRestore();
        return called;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 14c: el listener loaderror llama a getFallback y loguea a console.error para cualquier clave', () => {
  // Feature: bug-busters, Property 14: Asset load failure uses fallback
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      (key) => {
        const loader = new AssetLoader();
        const scene = createMockScene();

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const getFallbackSpy = jest.spyOn(loader, 'getFallback');

        loader.preload(scene);

        // Simula el evento de error de carga
        scene.load._emit('loaderror', { key, src: `assets/${key}.png` });

        const getFallbackCalled = getFallbackSpy.mock.calls.some(call => call[0] === key);
        const errorLogged = errorSpy.mock.calls.length > 0;

        errorSpy.mockRestore();
        warnSpy.mockRestore();
        getFallbackSpy.mockRestore();

        return getFallbackCalled && errorLogged;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Unit / example-based tests
// ---------------------------------------------------------------------------

test('getFallback() retorna "placeholder" para cualquier clave', () => {
  const loader = new AssetLoader();
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  expect(loader.getFallback('kiro')).toBe('placeholder');
  expect(loader.getFallback('unknown_asset')).toBe('placeholder');
  expect(loader.getFallback('')).toBe('placeholder');

  jest.restoreAllMocks();
});

test('preload() registra el listener loaderror en scene.load', () => {
  const loader = new AssetLoader();
  const scene = createMockScene();

  loader.preload(scene);

  expect(scene.load.on).toHaveBeenCalledWith('loaderror', expect.any(Function));
});

test('preload() registra todos los assets del manifiesto', () => {
  const loader = new AssetLoader();
  const scene = createMockScene();

  loader.preload(scene);

  expect(scene.load.spritesheet).toHaveBeenCalledWith('kiro', expect.any(String), expect.any(Object));
  expect(scene.load.spritesheet).toHaveBeenCalledWith('wanderer', expect.any(String), expect.any(Object));
  expect(scene.load.image).toHaveBeenCalledWith('projectile', expect.any(String));
  expect(scene.load.tilemapTiledJSON).toHaveBeenCalledWith('circuit_1', expect.any(String));
  expect(scene.load.audio).toHaveBeenCalledWith('sfx_fire', expect.any(String));
  expect(scene.load.audio).toHaveBeenCalledWith('music_game', expect.any(String));
});

test('el listener loaderror loguea console.error con la clave y src del asset fallido', () => {
  const loader = new AssetLoader();
  const scene = createMockScene();
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  loader.preload(scene);
  scene.load._emit('loaderror', { key: 'kiro', src: 'assets/sprites/kiro.png' });

  expect(errorSpy).toHaveBeenCalled();
  const message = errorSpy.mock.calls[0][0];
  expect(message).toContain('kiro');

  jest.restoreAllMocks();
});
