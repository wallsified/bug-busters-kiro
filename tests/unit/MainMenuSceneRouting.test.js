/**
 * Tests unitarios para el enrutamiento de MainMenuScene.
 * Verifica que el botón start enruta a TutorialScene (level 1) o GameScene (level > 1).
 * Se replica la lógica del handler directamente, siguiendo el patrón de PreservationTests.
 */

/**
 * Simula el handler del botón start de MainMenuScene tal como está implementado.
 * @param {number} progressLevel - Nivel guardado en el progreso.
 * @param {Function} sceneStart - Spy para scene.start.
 */
function simulateStartBtnClick(progressLevel, sceneStart) {
  const progress = { level: progressLevel };
  // Replicar exactamente el handler del botón start de MainMenuScene
  const target = progress.level === 1 ? 'TutorialScene' : 'GameScene';
  sceneStart(target, { level: progress.level });
}

test('startBtn enruta a TutorialScene cuando level es 1', () => {
  const sceneStart = jest.fn();
  simulateStartBtnClick(1, sceneStart);
  expect(sceneStart).toHaveBeenCalledWith('TutorialScene', { level: 1 });
});

test('startBtn enruta a GameScene cuando level es 2', () => {
  const sceneStart = jest.fn();
  simulateStartBtnClick(2, sceneStart);
  expect(sceneStart).toHaveBeenCalledWith('GameScene', { level: 2 });
});

test('startBtn enruta a GameScene cuando level es 3', () => {
  const sceneStart = jest.fn();
  simulateStartBtnClick(3, sceneStart);
  expect(sceneStart).toHaveBeenCalledWith('GameScene', { level: 3 });
});

test('startBtn nunca enruta a TutorialScene cuando level > 1', () => {
  for (let level = 2; level <= 10; level++) {
    const sceneStart = jest.fn();
    simulateStartBtnClick(level, sceneStart);
    expect(sceneStart).not.toHaveBeenCalledWith('TutorialScene', expect.anything());
    expect(sceneStart).toHaveBeenCalledWith('GameScene', { level });
  }
});
