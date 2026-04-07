/**
 * Tests unitarios y de propiedades para TutorialScene.
 */

import fc from 'fast-check';
import { TutorialScene } from '../../src/scenes/TutorialScene.js';

/**
 * Crea una escena mock mínima para TutorialScene.
 * Captura los textos añadidos y las llamadas a scene.start.
 */
function createMockScene() {
  const texts = [];
  const scene = new TutorialScene();

  // Sobrescribir métodos de Phaser con mocks
  scene.scale = { width: 800, height: 600 };
  scene.cameras = { main: { setBackgroundColor: jest.fn() } };
  scene.add = {
    text: jest.fn((_x, _y, text, _style) => {
      const obj = {
        _text: text,
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      };
      texts.push(obj);
      return obj;
    }),
  };
  scene.tweens = { add: jest.fn() };
  scene.input = {
    keyboard: { once: jest.fn() },
    once: jest.fn(),
  };
  scene.scene = { start: jest.fn() };

  return { scene, texts };
}

// --- Tests unitarios ---

test('create() muestra la descripción de Blast-a-Bug', () => {
  const { scene, texts } = createMockScene();
  scene.init({ level: 1 });
  scene.create();
  const allText = texts.map(t => t._text).join('\n');
  expect(allText).toContain('Every 20 pts — BLAST-A-BUG!');
  expect(allText).toContain('Bigger projectile for 5 seconds');
});

test('create() muestra la descripción de Bug Free Zone', () => {
  const { scene, texts } = createMockScene();
  scene.init({ level: 1 });
  scene.create();
  const allText = texts.map(t => t._text).join('\n');
  expect(allText).toContain('Every 40 pts — BUG FREE ZONE!');
  expect(allText).toContain('Eliminates bugs within 50px');
});

test('create() muestra la descripción de Extra Life', () => {
  const { scene, texts } = createMockScene();
  scene.init({ level: 1 });
  scene.create();
  const allText = texts.map(t => t._text).join('\n');
  expect(allText).toContain('Every 100 pts — EXTRA LIFE!');
  expect(allText).toContain('+1 life');
});

test('_dismiss() transiciona a GameScene con level 1', () => {
  const { scene } = createMockScene();
  scene.init({ level: 1 });
  scene.create();
  scene._dismiss();
  expect(scene.scene.start).toHaveBeenCalledWith('GameScene', { level: 1 });
});

test('_dismiss() usa el guard _transitioning para evitar doble transición', () => {
  const { scene } = createMockScene();
  scene.init({ level: 1 });
  scene.create();
  scene._dismiss();
  scene._dismiss();
  expect(scene.scene.start).toHaveBeenCalledTimes(1);
});

test('create() con level > 1 llama _dismiss() inmediatamente', () => {
  const { scene } = createMockScene();
  scene.init({ level: 2 });
  scene.create();
  expect(scene.scene.start).toHaveBeenCalledWith('GameScene', { level: 1 });
});

// --- Property 9: Tutorial shown only for level 1 ---

test('Property 9: level > 1 siempre redirige directamente a GameScene sin mostrar tutorial', () => {
  // Feature: powerup-system, Property 9: Tutorial shown only for level 1
  // Validates: Requirements 7.1, 7.6
  fc.assert(
    fc.property(
      fc.integer({ min: 2, max: 10 }),
      (level) => {
        const { scene } = createMockScene();
        scene.init({ level });
        scene.create();
        // Debe haber llamado a scene.start con GameScene inmediatamente
        return scene.scene.start.mock.calls.some(
          call => call[0] === 'GameScene'
        );
      }
    ),
    { numRuns: 100 }
  );
});
