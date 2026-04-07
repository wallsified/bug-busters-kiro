/**
 * Tests unitarios para BombGroup.
 * Verifica el comportamiento de colocación, fusible, detonación y límite de bombas.
 */

import { BombGroup } from '../../src/entities/BombGroup.js';
import { CONSTANTS } from '../../src/config/constants.js';

// Función auxiliar para crear una escena simulada con el sistema de tiempo
function makeScene() {
  return {
    time: {
      delayedCall: jest.fn(() => ({ remove: jest.fn() }))
    }
  };
}

describe('BombGroup', () => {
  // Test 1: La bomba se coloca en la posición snapeada al tile
  test('placeBomb coloca la bomba en el centro del tile más cercano', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    // Posición (10, 10): Math.round(10/32)=0 → 0*32+16=16 para ambos ejes
    group.placeBomb(10, 10);

    const bomb = group.getChildren().find(b => b.active);
    expect(bomb).toBeDefined();
    // El tile 0 tiene centro en x=16, y=16
    expect(bomb.x).toBe(16);
    expect(bomb.y).toBe(16);
  });

  test('placeBomb snappea correctamente para posiciones en tiles distintos', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    // Posición (50, 70): Math.round(50/32)=2 → 2*32+16=80; Math.round(70/32)=2 → 2*32+16=80
    group.placeBomb(50, 70);

    const bomb = group.getChildren().find(b => b.active);
    expect(bomb).toBeDefined();
    expect(bomb.x).toBe(80);
    expect(bomb.y).toBe(80);
  });

  // Test 2: El temporizador del fusible llama a detonateBomb al expirar
  test('el fusible llama a detonateBomb después del tiempo configurado', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    // Espiar el método detonateBomb
    const detonateSpy = jest.spyOn(group, 'detonateBomb');

    group.placeBomb(16, 16);

    // Verificar que se registró el delayedCall con la duración correcta
    expect(scene.time.delayedCall).toHaveBeenCalledWith(
      CONSTANTS.BOMB_FUSE_DURATION,
      expect.any(Function)
    );

    // Simular la expiración del fusible ejecutando el callback manualmente
    const fuseCallback = scene.time.delayedCall.mock.calls[0][1];
    fuseCallback();

    expect(detonateSpy).toHaveBeenCalled();
  });

  // Test 3: detonateBomb desactiva la bomba y pone velocidad a cero
  // Nota: sfx_eliminate y spawnParticleBurst son responsabilidad de GameScene,
  // no de BombGroup. Aquí verificamos que detonateBomb deja la bomba inactiva.
  test('detonateBomb desactiva la bomba y pone velocidad a cero', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    group.placeBomb(16, 16);
    const bomb = group.getChildren()[0];

    // La bomba debe estar activa antes de detonar
    expect(bomb.active).toBe(true);

    group.detonateBomb(bomb);

    // Después de detonar: inactiva y sin velocidad
    expect(bomb.active).toBe(false);
    expect(bomb.body.velocity.x).toBe(0);
    expect(bomb.body.velocity.y).toBe(0);
  });

  test('detonateBomb cancela el fuseTimer al detonar', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    group.placeBomb(16, 16);
    const bomb = group.getChildren()[0];

    // El fuseTimer debe existir después de colocar la bomba
    expect(bomb.fuseTimer).not.toBeNull();
    const removeSpy = bomb.fuseTimer.remove;

    group.detonateBomb(bomb);

    // El fuseTimer debe haberse cancelado
    expect(removeSpy).toHaveBeenCalledWith(false);
    expect(bomb.fuseTimer).toBeNull();
  });

  test('detonateBomb es un no-op si la bomba ya está inactiva', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    group.placeBomb(16, 16);
    const bomb = group.getChildren()[0];

    // Detonar dos veces: la segunda debe ser un no-op
    group.detonateBomb(bomb);
    expect(bomb.active).toBe(false);

    // No debe lanzar error al llamar de nuevo
    expect(() => group.detonateBomb(bomb)).not.toThrow();
  });

  // Test 4: placeBomb es un no-op cuando se alcanza el BOMB_LIMIT
  test('placeBomb es un no-op cuando se alcanza el límite de bombas', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    // Colocar el máximo de bombas permitidas
    for (let i = 0; i < CONSTANTS.BOMB_LIMIT; i++) {
      group.placeBomb(i * 32, 0);
    }

    expect(group.getActiveCount()).toBe(CONSTANTS.BOMB_LIMIT);

    // Intentar colocar una bomba adicional
    group.placeBomb(200, 200);

    // El conteo no debe haber aumentado
    expect(group.getActiveCount()).toBe(CONSTANTS.BOMB_LIMIT);
  });

  test('getActiveCount retorna el número correcto de bombas activas', () => {
    const scene = makeScene();
    const group = new BombGroup(scene);

    expect(group.getActiveCount()).toBe(0);

    group.placeBomb(16, 16);
    expect(group.getActiveCount()).toBe(1);

    group.placeBomb(48, 16);
    expect(group.getActiveCount()).toBe(2);

    // Detonar la primera bomba
    const firstBomb = group.getChildren()[0];
    group.detonateBomb(firstBomb);
    expect(group.getActiveCount()).toBe(1);
  });
});
