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
import { ProjectileGroup } from '../entities/ProjectileGroup.js';
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

    // Instanciar managers
    this._soundManager = new SoundManager(this);
    this._effectsManager = new EffectsManager(this);
    this._scoreSystem = new ScoreSystem((score) => {
      this._powerManager.checkUnlocks(score);
    });
    this._powerManager = new PowerManager(this);
    this._hudManager = new HUDManager(this);

    // Crear Kiro
    this._kiro = new Kiro(this, 80, 300);

    // Spawnear enemigos y módulos
    this._bugs = [];
    this._spawnEnemies(levelConfig);
    this._modules = [];
    this._spawnModules(levelConfig);

    // Crear grupo de proyectiles
    this._projectiles = new ProjectileGroup(this);

    // Configurar controles
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = {
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._qKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this._eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.on('pointerdown', () => this._fireProjectile());
    this._spaceWasDown = false;

    // Configurar colisiones
    this._setupCollisions();

    // Iniciar música de fondo
    this._soundManager.startMusic();

    // Aplicar pipeline CRTShader a la cámara principal si el renderer es WebGL
    if (this.renderer && this.renderer.type === Phaser.WEBGL) {
      this.cameras.main.setPostPipeline(CRTShader);
    }
  }

  update() {
    if (this._transitioning) return;

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

    // Disparo con spacebar (flanco de subida)
    const spaceDown = this._spaceKey.isDown;
    if (spaceDown && !this._spaceWasDown) this._fireProjectile();
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

  _loadTilemap(levelConfig) {
    try {
      const map = this.make.tilemap({ key: levelConfig.tilemapKey });
      if (map) {
        const tileset = map.addTilesetImage('tileset', 'tileset');
        if (tileset) {
          const layer = map.createLayer('ground', tileset, 0, 0);
          if (layer) map.setCollisionByProperty({ collides: true });
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
    for (const enemyDef of levelConfig.enemies) {
      let bug;
      if (enemyDef.type === 'Wanderer') {
        bug = new Wanderer(this, enemyDef.x, enemyDef.y);
      } else if (enemyDef.type === 'Seeker') {
        bug = new Seeker(this, enemyDef.x, enemyDef.y);
      } else if (enemyDef.type === 'Replicator') {
        bug = new Replicator(this, enemyDef.x, enemyDef.y, (spawnX, spawnY) => {
          const newWanderer = new Wanderer(this, spawnX, spawnY);
          this._bugs.push(newWanderer);
          this._setupBugCollisions(newWanderer);
        });
      }
      if (bug) this._bugs.push(bug);
    }
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

  _setupBugCollisions(bug) {
    this.physics.add.overlap(this._projectiles, bug, (projectile, hitBug) => {
      this._onProjectileHitBug(projectile, hitBug);
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

  _onProjectileHitBug(projectile, bug) {
    if (!bug || bug.active === false) return;
    if (!projectile || projectile.active === false) return;
    projectile.setActive(false);
    if (projectile.body) { projectile.body.velocity.x = 0; projectile.body.velocity.y = 0; }
    this._effectsManager.shake(150, 0.008);
    this._eliminateBug(bug);
  }

  _eliminateBug(bug) {
    if (!bug || bug.active === false) return;
    const points = bug.pointValue;
    this._effectsManager.spawnParticleBurst(bug.x, bug.y);
    this._effectsManager.triggerHitStop();
    this._effectsManager.spawnScorePopup(bug.x, bug.y, bug.pointValue);
    bug.setActive(false);
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

  _fireProjectile() {
    this._projectiles.fire(this._kiro.x, this._kiro.y, this._kiro.facing);
    this._soundManager.play('sfx_fire');
  }

  _checkWinCondition() {
    if (this._transitioning) return;
    if (this._bugs.filter(b => b && b.active !== false).length === 0) {
      this._levelComplete();
    }
  }

  _levelComplete() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.scene.start('LevelCompleteScene', {
      level: this._currentLevel,
      score: this._scoreSystem.getScore(),
      lives: this._lives
    });
  }

  _gameOver() {
    if (this._transitioning) return;
    this._transitioning = true;
    this._soundManager.play('game_over');
    this.scene.start('GameOverScene', {
      score: this._scoreSystem.getScore(),
      level: this._currentLevel
    });
  }
}
