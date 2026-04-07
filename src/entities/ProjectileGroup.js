/**
 * DEPRECATED — Este módulo fue reemplazado por BombGroup en el spec gameplay-overhaul (Tarea 3).
 * Se mantiene como stub para compatibilidad con tests históricos (BugConditions, PreservationTests).
 *
 * Grupo de proyectiles disparados por Kiro.
 * Extiende Phaser.Physics.Arcade.Group para gestionar el pool de proyectiles activos.
 */

// Valores históricos (ya no están en CONSTANTS tras el gameplay-overhaul)
const PROJECTILE_LIMIT = 3;
const PROJECTILE_SPEED = 400;

// Clase base mínima para entornos sin Phaser (tests con Jest)
const BaseGroup = (typeof Phaser !== 'undefined')
  ? Phaser.Physics.Arcade.Group
  : class {
      constructor() {
        // Lista interna de proyectiles del pool
        this._children = [];
      }

      getChildren() {
        return this._children;
      }

      create(x, y, key) {
        // Crea un objeto proyectil simulado con la interfaz mínima necesaria
        const obj = {
          x,
          y,
          active: true,
          visible: false,
          body: { velocity: { x: 0, y: 0 } },
          setActive: function(v) { this.active = v; return this; },
          setVisible: function(v) { this.visible = v; return this; },
          setPosition: function(px, py) { this.x = px; this.y = py; return this; }
        };
        this._children.push(obj);
        return obj;
      }
    };

export class ProjectileGroup extends BaseGroup {
  /**
   * @param {Phaser.Scene} scene - La escena de Phaser que contiene el grupo
   */
  constructor(scene) {
    super(scene);
    // Referencia a la escena para acceder al sistema de física y límites del mundo
    this.scene = scene;
    // Escala activa para nuevos proyectiles (1 = normal, BLAST_A_BUG_SCALE cuando activo)
    this._blastScale = 1;
  }

  /**
   * Establece la escala de los proyectiles disparados mientras Blast-a-Bug está activo.
   * @param {number} scale - Factor de escala (1 = normal, 2.5 = Blast-a-Bug)
   */
  setBlastScale(scale) {
    this._blastScale = scale;
  }

  /**
   * Dispara un proyectil desde la posición indicada en la dirección dada.
   * Si ya hay 3 proyectiles activos, la operación es un no-op.
   *
   * @param {number} x - Posición X de origen del proyectil
   * @param {number} y - Posición Y de origen del proyectil
   * @param {'up'|'down'|'left'|'right'} direction - Dirección del disparo
   */
  fire(x, y, direction) {
    // Contar proyectiles activos actualmente en el pool
    const activeCount = this.getChildren().filter(p => p.active).length;

    // Si se alcanzó el límite, no disparar
    if (activeCount >= PROJECTILE_LIMIT) {
      return;
    }

    // Buscar un proyectil inactivo en el pool para reutilizarlo
    const existing = this.getChildren().find(p => !p.active);
    let projectile;

    if (existing) {
      // Reutilizar proyectil inactivo del pool
      projectile = existing;
      projectile.setPosition(x, y);
      projectile.setActive(true);
      projectile.setVisible(true);
    } else {
      // Crear un nuevo proyectil en el pool
      projectile = this.create(x, y, 'projectile');
      projectile.setVisible(true);
    }

    // Calcular la velocidad según la dirección del disparo
    projectile.body.velocity.x = 0;
    projectile.body.velocity.y = 0;

    // Aplicar escala de Blast-a-Bug si está activo
    if (typeof projectile.setScale === 'function') {
      projectile.setScale(this._blastScale);
    } else if (projectile.scale !== undefined) {
      projectile.scale = this._blastScale;
    }

    if (direction === 'up') {
      projectile.body.velocity.y = -PROJECTILE_SPEED;
    } else if (direction === 'down') {
      projectile.body.velocity.y = PROJECTILE_SPEED;
    } else if (direction === 'left') {
      projectile.body.velocity.x = -PROJECTILE_SPEED;
    } else if (direction === 'right') {
      projectile.body.velocity.x = PROJECTILE_SPEED;
    }

    // Configurar desactivación automática al salir de los límites del mundo (solo en Phaser)
    if (typeof Phaser !== 'undefined' && projectile.body) {
      projectile.body.onWorldBounds = true;
    }
  }
}
