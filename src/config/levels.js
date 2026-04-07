/**
 * Configuración de los tres niveles del juego Bug Busters.
 * Cada nivel define el tilemap, los enemigos y los módulos a proteger.
 * La dificultad escala incrementando Seekers y Replicators en cada nivel.
 */

export const LEVELS = [
  {
    // Nivel 1: introducción — pocos enemigos, sin Replicators
    id: 1,
    spawnThreshold: 10,
    tilemapKey: 'circuit_1',
    enemies: [
      { type: 'Wanderer', x: 100, y: 100 },
      { type: 'Wanderer', x: 300, y: 150 },
      { type: 'Wanderer', x: 500, y: 100 },
      { type: 'Seeker',   x: 200, y: 400 }
    ],
    modules: [
      { x: 650, y: 300, integrity: 3 },
      { x: 650, y: 450, integrity: 3 }
    ]
  },
  {
    // Nivel 2: dificultad media — aparece el primer Replicator
    id: 2,
    spawnThreshold: 15,
    tilemapKey: 'circuit_2',
    enemies: [
      { type: 'Wanderer',   x: 100, y: 100 },
      { type: 'Wanderer',   x: 300, y: 150 },
      { type: 'Wanderer',   x: 500, y: 100 },
      { type: 'Seeker',     x: 200, y: 400 },
      { type: 'Seeker',     x: 400, y: 400 },
      { type: 'Replicator', x: 350, y: 250 }
    ],
    modules: [
      { x: 650, y: 200, integrity: 3 },
      { x: 650, y: 350, integrity: 3 },
      { x: 650, y: 500, integrity: 3 }
    ]
  },
  {
    // Nivel 3: dificultad alta — más Seekers y Replicators, menos Wanderers base
    id: 3,
    spawnThreshold: 20,
    tilemapKey: 'circuit_3',
    enemies: [
      { type: 'Wanderer',   x: 100, y: 100 },
      { type: 'Wanderer',   x: 500, y: 100 },
      { type: 'Seeker',     x: 200, y: 300 },
      { type: 'Seeker',     x: 400, y: 300 },
      { type: 'Seeker',     x: 300, y: 450 },
      { type: 'Replicator', x: 250, y: 200 },
      { type: 'Replicator', x: 450, y: 200 }
    ],
    modules: [
      { x: 650, y: 150, integrity: 3 },
      { x: 650, y: 300, integrity: 3 },
      { x: 650, y: 450, integrity: 3 }
    ]
  }
];
