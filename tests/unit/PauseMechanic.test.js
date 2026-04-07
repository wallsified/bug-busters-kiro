/**
 * Tests unitarios para el mecanismo de pausa de GameScene.
 * Verifica el comportamiento de _togglePause(), update() y el handler de QUIT.
 */

describe('PauseMechanic', () => {
  // Función auxiliar para crear una escena simulada con el mecanismo de pausa
  function makeGameScene(overrides = {}) {
    const scene = {
      _paused: false,
      _transitioning: false,
      time: { paused: false, now: 0 },
      physics: {
        pause: jest.fn(),
        resume: jest.fn()
      },
      _pauseOverlay: {
        setVisible: jest.fn()
      },
      scene: {
        start: jest.fn()
      },
      _kiro: { update: jest.fn(), x: 100, y: 100 },
      _bugs: [],
      _scoreSystem: { getScore: jest.fn(() => 0) },
      _hudManager: { update: jest.fn() },
      _powerManager: { freezeUntil: 0, activate: jest.fn(), getState: jest.fn(() => ({})) },
      _checkWinCondition: jest.fn(),
      _placeBomb: jest.fn(),
      _spaceKey: { isDown: false },
      _spaceWasDown: false,
      _cursors: {},
      _wasd: {},
      _qKey: { isDown: false },
      _eKey: { isDown: false },
      _togglePause: function() {
        if (this._transitioning) return;
        this._paused = !this._paused;
        if (this._paused) {
          this.time.paused = true;
          this.physics.pause();
          this._pauseOverlay.setVisible(true);
        } else {
          this.time.paused = false;
          this.physics.resume();
          this._pauseOverlay.setVisible(false);
        }
      },
      update: function() {
        if (this._transitioning) return;
        if (this._paused) return;
        this._kiro.update(this._cursors, this._wasd);
      },
      ...overrides
    };
    return scene;
  }

  // Test 1: _togglePause() establece _paused = true y llama a physics.pause()
  test('_togglePause() establece _paused = true y llama a physics.pause()', () => {
    const scene = makeGameScene();
    expect(scene._paused).toBe(false);

    scene._togglePause();

    expect(scene._paused).toBe(true);
    expect(scene.time.paused).toBe(true);
    expect(scene.physics.pause).toHaveBeenCalledTimes(1);
    expect(scene._pauseOverlay.setVisible).toHaveBeenCalledWith(true);
  });

  // Test 2: _togglePause() llamado dos veces restaura el estado de ejecución
  test('_togglePause() llamado dos veces restaura el estado de ejecución', () => {
    const scene = makeGameScene();

    scene._togglePause(); // pausa
    scene._togglePause(); // reanuda

    expect(scene._paused).toBe(false);
    expect(scene.time.paused).toBe(false);
    expect(scene.physics.resume).toHaveBeenCalledTimes(1);
    expect(scene._pauseOverlay.setVisible).toHaveBeenLastCalledWith(false);
  });

  // Test 3: update() retorna temprano cuando _paused === true
  test('update() retorna temprano cuando _paused === true', () => {
    const scene = makeGameScene({ _paused: true });

    scene.update();

    // Kiro.update no debe haber sido llamado
    expect(scene._kiro.update).not.toHaveBeenCalled();
  });

  // Test 4: El handler de QUIT llama a scene.start('MainMenuScene')
  test('el handler de QUIT llama a scene.start("MainMenuScene")', () => {
    const scene = makeGameScene();

    // Simular el click en QUIT
    scene.scene.start('MainMenuScene');

    expect(scene.scene.start).toHaveBeenCalledWith('MainMenuScene');
  });
});
