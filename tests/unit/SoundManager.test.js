/**
 * Tests de propiedades para SoundManager.
 * Usa fast-check para verificar que el estado de mute suprime toda reproducción de audio.
 */

import fc from 'fast-check';
import { SoundManager } from '../../src/managers/SoundManager.js';

// Claves de sonido conocidas del juego
const SOUND_KEYS = ['sfx_fire', 'sfx_eliminate', 'sfx_power_unlock', 'sfx_power_activate', 'sfx_life_lost'];

// Crea un mock de la escena de Phaser con scene.sound.play y scene.sound.stopAll
function createMockScene() {
  return {
    sound: {
      play: jest.fn(),
      stopAll: jest.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// Property 10: Muted audio produces no sound output
// ---------------------------------------------------------------------------

test('Property 10a: construido con isMuted=true, play() nunca llama a scene.sound.play', () => {
  // Feature: bug-busters, Property 10: Muted audio produces no sound output
  fc.assert(
    fc.property(
      fc.constantFrom(...SOUND_KEYS),
      (key) => {
        const scene = createMockScene();
        const manager = new SoundManager(scene, true);

        manager.play(key);

        return scene.sound.play.mock.calls.length === 0;
      }
    ),
    { numRuns: 100 }
  );
});

test('Property 10b: tras setMuted(true), play() nunca llama a scene.sound.play', () => {
  // Feature: bug-busters, Property 10: Muted audio produces no sound output
  fc.assert(
    fc.property(
      fc.constantFrom(...SOUND_KEYS),
      (key) => {
        const scene = createMockScene();
        const manager = new SoundManager(scene, false);

        manager.setMuted(true);
        manager.play(key);

        // scene.sound.play no debe haber sido llamado después del mute
        return scene.sound.play.mock.calls.length === 0;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Unit / example-based tests
// ---------------------------------------------------------------------------

test('play() llama a scene.sound.play cuando no está muteado', () => {
  const scene = createMockScene();
  const manager = new SoundManager(scene, false);

  manager.play('sfx_fire');

  expect(scene.sound.play).toHaveBeenCalledWith('sfx_fire');
});

test('play() no llama a scene.sound.play cuando isMuted=true desde el constructor', () => {
  const scene = createMockScene();
  const manager = new SoundManager(scene, true);

  manager.play('sfx_eliminate');

  expect(scene.sound.play).not.toHaveBeenCalled();
});

test('setMuted(true) llama a scene.sound.stopAll y bloquea futuros play()', () => {
  const scene = createMockScene();
  const manager = new SoundManager(scene, false);

  manager.setMuted(true);

  expect(scene.sound.stopAll).toHaveBeenCalled();

  manager.play('sfx_life_lost');
  expect(scene.sound.play).not.toHaveBeenCalled();
});

test('setMuted(false) permite que play() vuelva a funcionar', () => {
  const scene = createMockScene();
  const manager = new SoundManager(scene, true);

  manager.setMuted(false);
  manager.play('sfx_power_activate');

  expect(scene.sound.play).toHaveBeenCalledWith('sfx_power_activate');
});
