/**
 * GameScene — núcleo del gameplay de Bug Busters.
 * Gestiona el loop principal: movimiento de Kiro, enemigos, colisiones,
 * condiciones de victoria/derrota, poderes y HUD.
 */

import { CRTShader } from '../shaders/CRTShader.js';
import { CONSTANTS } from '../config/constants.js';
import { LEVELS } from '../config/levels.js';
import { Kiro } from '../entities/Kiro.js';
import { Wanderer } from '../entities/Wanderer.js';
import { Seeker } from '../entities/Seeker.js';
import { Replicator } from '../entities/Replicator.js';
import { Module } from '../entities/Module.js';
import { BombGroup } from '../entities/BombGroup.js';
import { SoundManager } from '../managers/SoundManager.js';
import { HUDManager } from '../managers/HUDManager.js';
import { EffectsManager } from '../managers/EffectsManager.js';
import { PowerManager } from '../managers/PowerManager.js';
import { ScoreSystem } from '../managers/ScoreSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Recibe el nivel inicial desde MainMenuScene o LevelCompleteScene.
   */
  init(data) {
    this._currentLevel = data.level || 1;
    this._lives = CONSTANTS.PLAYER_INITIAL_LIVES;
    this._transitioning = false;
  }

  create() {
    const levelConfig = LEVELS.find(l => l.id === this._currentLevel);

    // Cargar tilemap del nivel actual
    this._loadTilemap(levelConfig);

    // Instanciar managers (PowerManager debe crearse antes que ScoreSystem)
    this._soundManager = new SoundManager(this);
    this._effectsManager = new EffectsManager(this);
    this._powerManager = new PowerManager(this);
    this._scoreSystem = new ScoreSystem((score) => {
      this._powerManager.checkUnlocks(score, this._soundManager);
    });
    this._hudManager = new HUDManager(this);

    // Crear Kiro
    this._kiro = new Kiro(this, 80, 300);

    // Spawnear enemigos y módulos
    this._bugs = [];

    // Inicializar estado de seguimiento del umbral de spawn
    this._spawnedPointTotal = 0;
    this._spawnThresholdReached = false;

    this._spawnEnemies(levelConfig);
    this._modules = [];
    this._spawnModules(levelConfig);

    // Crear grupo de bombas
    this._bombs = new BombGroup(this);

    // Configurar controles
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = {
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
    this._qKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this._eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._escKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._pKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this._spaceWasDown = false;

    // Colocar bomba también con clic del ratón
    this.input.on('pointerdown', () => {
      if (!this._paused && !this._transitioning) this._placeBomb();
    });

    // Inicializar estado de pausa
    this._paused = false;

    // Crear overlay de pausa (contenedor con profundidad máxima, fijo a la cámara)
    this._pauseOverlay = this.add.container(0, 0);
    this._pauseOverlay.setDepth(1000);
    this._pauseOverlay.setScrollFactor(0);

    // Fondo semitransparente negro
    const { width, height } = this.scale;
    const overlayBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this._pauseOverlay.add(overlayBg);

    // Texto "PAUSED"
    const pausedText = this.add.text(width / 2, height / 2 - 60, 'PAUSED', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    this._pauseOverlay.add(pausedText);

    // Texto "RESUME" (interactivo)
    const resumeText = this.add.text(width / 2, height / 2 + 20, 'RESUME', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5).setInteractive();
    resumeText.on('pointerdown', () => this._togglePause());
    this._pauseOverlay.add(resumeText);

    // Texto "QUIT" (interactivo)
    const quitText = this.add.text(width / 2, height / 2 + 60, 'QUIT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5).setInteractive();
    quitText.on('pointerdown', () => this.scene.start('MainMenuScene'));
    this._pauseOverlay.add(quitText);

    // Ocultar overlay inicialmente
    this._pauseOverlay.setVisible(false);

    // Configurar colisiones
    this._setupCollisions();

    // Agregar colisores con el tilemap para Kiro y enemigos
    if (this._tilemapLayer) {
      this.physics.add.collider(this._kiro, this._tilemapLayer);
      for (const bug of this._bugs) {
        this.physics.add.collider(bug, this._tilemapLayer);
      }
    }

    // Iniciar música de fondo
    this._soundManager.startMusic();

    // Aplicar pipeline CRTShader a la cámara principal si el renderer es WebGL
    if (this.renderer && this.renderer.type === Phaser.WEBGL) {
      this.cameras.main.setPostPipeline(CRTShader);
    }
  }

  update() {
    if (this._transitioning) return;

    // Verificar teclas de pausa (ESC o P)
    if (Phaser.Input.Keyboard.JustDown(this._escKey) || Phaser.Input.Keyboard.JustDown(this._pKey)) {
      this._togglePause();
    }

    // Si el juego está pausado, no procesar el resto del update
    if (this._paused) return;

    // Actualizar Kiro
    this._kiro.update(this._cursors, this._wasd);

    // Actualizar enemigos (respetando el estado de freeze)
    const kiroX = this._kiro.x;
    const kiroY = this._kiro.y;
    const isFrozen = this.time.now < this._powerManager.freezeUntil;

    for (const bug of this._bugs) {
      if (!bug || bug.active === false) continue;
      if (isFrozen) {
        bug.body.velocity.x = 0;
        bug.body.velocity.y = 0;
      } else {
        bug instanceof Replicator ? bug.update(this) : bug.update(kiroX, kiroY);
      }
    }

    // Colocar bomba con spacebar (flanco de subida)
    const spaceDown = this._spaceKey.isDown;
    if (spaceDown && !this._spaceWasDown) {
      console.log('[GameScene] SPACE pressed, placing bomb at', this._kiro.x, this._kiro.y);
      this._placeBomb();
    }
    this._spaceWasDown = spaceDown;

    // Activar poderes con Q (freeze) y E (patch_bomb)
    if (Phaser.Input.Keyboard.JustDown(this._qKey)) {
      if (this._powerManager.activate('freeze', this._kiro, this._bugs)) {
        this._soundManager.play('sfx_power_activate');
        this._effectsManager.shake(200, 0.010);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
      if (this._powerManager.activate('patch_bomb', this._kiro, this._bugs, (bug) => this._eliminateBug(bug))) {
        this._soundManager.play('sfx_power_activate');
        this._effectsManager.shake(200, 0.010);
      }
    }

    // Actualizar HUD
    this._hudManager.update(
      this._scoreSystem.getScore(),
      this._lives,
      this._currentLevel,
      this._powerManager.getState()
    );

    // Verificar condición de victoria
    this._checkWinCondition();
  }

  _togglePause() {
    // Guardia: no pausar durante transiciones
    if (this._transitioning) return;

    this._paused = !this._paused;

    if (this._paused) {
      // Pausar el tiempo de la escena y la física
      this.time.paused = true;
      this.physics.pause();
      this._pauseOverlay.setVisible(true);
    } else {
      // Reanudar el tiempo de la escena y la física
      this.time.paused = false;
      this.physics.resume();
      this._pauseOverlay.setVisible(false);
    }
  }

  _loadTilemap(levelConfig) {
    this._tilemapLayer = null;
    try {
      const map = this.make.tilemap({ key: levelConfig.tilemapKey });
      if (map) {
        const tileset = map.addTilesetImage('tileset', 'tileset');
        if (tileset) {
          const layer = map.createLayer('ground', tileset, 0, 0);
          if (layer) {
            map.setCollisionByProperty({ collides: true });
            // Guardar referencia para agregar colisores después de crear entidades
            this._tilemapLayer = layer;
          }
        }
      }
    } catch (e) {
      console.warn(`GameScene: tilemap "${levelConfig.tilemapKey}" no disponible.`, e);
      this._createFallbackBoundary();
    }
  }

  _createFallbackBoundary() {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, true, true);
  }

  _spawnEnemies(levelConfig) {
    // Spawnear todos los enemigos definidos en la configuración del nivel
    for (const enemyDef of levelConfig.enemies) {
      let bug;
      if (enemyDef.type === 'Wanderer') {
        bug = new Wanderer(this, enemyDef.x, enemyDef.y);
      } else if (enemyDef.type === 'Seeker') {
        bug = new Seeker(this, enemyDef.x, enemyDef.y);
      } else if (enemyDef.type === 'Replicator') {
        bug = new Replicator(this, enemyDef.x, enemyDef.y, (spawnX, spawnY) => {
          // Los Wanderers spawneados por Replicator se registran con sus colisiones
          const newWanderer = new Wanderer(this, spawnX, spawnY);
          this._bugs.push(newWanderer);
          this._setupBugCollisions(newWanderer);
          if (this._tilemapLayer) {
            this.physics.add.collider(newWanderer, this._tilemapLayer);
          }
        });
      } else {
        console.warn(`GameScene: tipo de enemigo desconocido "${enemyDef.type}"`);
      }

      if (bug) {
        this._bugs.push(bug);
        // Acumular puntos de los enemigos iniciales (excluye Replicators)
        if (!(bug instanceof Replicator)) {
          this._spawnedPointTotal += bug.pointValue;
        }
      }
    }

    // El umbral de spawn se alcanza cuando los puntos acumulados superan el mínimo del nivel
    this._spawnThresholdReached = this._spawnedPointTotal >= (levelConfig.spawnThreshold ?? 0);
  }

  _spawnModules(levelConfig) {
    for (const modDef of levelConfig.modules) {
      const mod = new Module(this, modDef.x, modDef.y, modDef.integrity, () => this._gameOver());
      this._modules.push(mod);
    }
  }

  _setupCollisions() {
    for (const bug of this._bugs) this._setupBugCollisions(bug);
  }

  _setupBombCollisions() {
    // Reservado para colisiones globales de bombas si se necesitan en el futuro
  }

  _setupBugCollisions(bug) {
    this.physics.add.overlap(this._bombs, bug, (bomb, hitBug) => {
      this._onBombHitBug(bomb, hitBug);
    });
    this.physics.add.overlap(bug, this._kiro, (hitBug) => {
      this._onBugHitKiro(hitBug);
    });
    for (const mod of this._modules) {
      this.physics.add.overlap(bug, mod, (hitBug, hitMod) => {
        this._onBugHitModule(hitBug, hitMod);
      });
    }
  }

  _onBombHitBug(bomb, bug) {
    if (!bomb || bomb.active === false) return;
    if (!bug || bug.active === false) return;
    console.log('[GameScene] bomb hit bug, bug.pointValue=', bug.pointValue, 'bug constructor=', bug.constructor?.name);
    this._bombs.detonateBomb(bomb);
    this._eliminateBug(bug);
  }

  _placeBomb() {
    this._bombs.placeBomb(this._kiro.x, this._kiro.y);
  }

  _eliminateBug(bug) {
    if (!bug || bug.active === false) return;
    // Guardia: verificar que es un Bug válido con pointValue
    const points = (typeof bug.pointValue === 'number') ? bug.pointValue : 0;
    this._effectsManager.spawnParticleBurst(bug.x, bug.y);
    this._effectsManager.triggerHitStop();
    this._effectsManager.spawnScorePopup(bug.x, bug.y, points);
    bug.setActive(false);
    bug.setVisible(false);
    if (bug.body) { bug.body.velocity.x = 0; bug.body.velocity.y = 0; }
    this._scoreSystem.addPoints(points);
    this._soundManager.play('sfx_eliminate');
  }

  _onBugHitKiro(bug) {
    if (!bug || bug.active === false) return;
    if (this._kiro.isInvincible) return;
    this._lives -= 1;
    this._effectsManager.shake(300, 0.015);
    this._effectsManager.startDamageBlink(this._kiro);
    this._kiro.triggerInvincibility();
    this._soundManager.play('sfx_life_lost');
    if (this._lives <= 0) this._gameOver();
  }

  _onBugHitModule(bug, mod) {
    if (!bug || bug.active === false) return;
    if (!mod || mod.active === false) return;
    mod.hit();
  }

  _checkWinCondition() {
    if (this._transitioning) return;
    // Solo verificar victoria si se alcanzó el umbral de spawn
    if (!this._spawnThresholdReached) return;
    if (this._bugs.filter(b => b && b.active !== false).length === 0) {
      this._levelComplete();
    }
  }

  _levelComplete() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.time.timeScale = 1.0;
    this.scene.start('LevelCompleteScene', {
      level: this._currentLevel,
      score: this._scoreSystem.getScore(),
      lives: this._lives
    });
  }

  _gameOver() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.time.timeScale = 1.0;
    this._soundManager.play('game_over');
    this.scene.start('GameOverScene', {
      score: this._scoreSystem.getScore(),
      level: this._currentLevel
    });
  }
}
