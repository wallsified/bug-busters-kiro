# Bug Busters

> _Who you gonna call? Bug Busters!_

Juego arcade de navegador construido con **HTML5 + JavaScript** y el framework **Phaser 3**. Controlas a **Kiro**, un fantasma que recorre tableros de circuitos para eliminar bugs de software antes de que corrompan los módulos críticos del sistema.

---

## Descripción

Bug Busters es un juego de acción en vista cenital donde el jugador debe eliminar tres tipos de enemigos (bugs) disparando bombas, proteger los módulos del circuito y avanzar a través de tres niveles de dificultad creciente. El juego guarda el progreso localmente en el navegador y activa poderes especiales automáticamente conforme aumenta la puntuación.


## Controles

| Acción | Teclado / Ratón |
|---|---|
| Mover | `↑ ↓ ← →` o `W A S D` |
| Colocar bomba | `Espacio` o clic del ratón |
| Activar Freeze | `Q` |
| Activar Patch Bomb | `E` |
| Pausar | `P` o `ESC` |

---

## Características del juego

### Enemigos

| Tipo | Comportamiento | Puntos |
|---|---|---|
| **Wanderer** | Se mueve en dirección aleatoria, cambia cada 1–3 segundos | 10 pts |
| **Seeker** | Recalcula la ruta hacia Kiro cada 500 ms | 20 pts |
| **Replicator** | Genera un nuevo Wanderer cada 8 segundos (máximo 3) | 30 pts |

Cuando un bug colisiona con Kiro se pierde una vida y se activa un período de invencibilidad de 3 segundos. Si un bug alcanza un módulo, reduce su integridad; si llega a cero, el nivel falla.

### Powerups automáticos

Se activan solos al cruzar umbrales de puntuación:

| Powerup | Umbral | Efecto |
|---|---|---|
| **Blast-a-Bug** | Cada 20 pts | Proyectiles 2.5× más grandes durante 5 segundos |
| **Bug Free Zone** | Cada 40 pts | Elimina todos los bugs a menos de 50 px de Kiro |
| **Extra Life** | Cada 100 pts | +1 vida |

### Niveles

| Nivel | Descripción |
|---|---|
| 1 | Introducción — Wanderers y un Seeker |
| 2 | Dificultad media — aparece el primer Replicator |
| 3 | Dificultad alta — arena abierta con un Replicator y dos Seekers |

Completar el nivel 3 muestra la pantalla de victoria con el mensaje *"I ain't afraid of no bugs"*.

---

## Estructura del proyecto

```
bug-busters/
├── index.html                  # Punto de entrada, config de Phaser y escenas
├── favicon.ico
├── assets/
│   ├── audio/                  # Efectos de sonido y música (MP3)
│   ├── sprites/                # Spritesheets y tilesets (PNG)
│   └── tilemaps/               # Mapas de nivel en formato Tiled JSON
├── src/
│   ├── config/
│   │   ├── constants.js        # Todos los valores numéricos del juego
│   │   └── levels.js           # Configuración de enemigos y módulos por nivel
│   ├── entities/
│   │   ├── Bug.js              # Clase base de enemigos
│   │   ├── Kiro.js             # Jugador principal
│   │   ├── Wanderer.js         # Enemigo básico
│   │   ├── Seeker.js           # Enemigo perseguidor
│   │   ├── Replicator.js       # Enemigo generador
│   │   ├── Module.js           # Módulo a proteger
│   │   ├── BombGroup.js        # Pool de bombas del jugador
│   │   └── ProjectileGroup.js  # Stub histórico (reemplazado por BombGroup)
│   ├── managers/
│   │   ├── AssetLoader.js      # Registro de todos los assets en Phaser
│   │   ├── EffectsManager.js   # Partículas, shake, hit-stop, popups
│   │   ├── HUDManager.js       # Puntuación, vidas, nivel y estado de poderes
│   │   ├── PowerManager.js     # Lógica de poderes manuales y automáticos
│   │   ├── PowerupBanner.js    # Banner de texto al activar un powerup
│   │   ├── ProgressManager.js  # Guardado y carga de progreso en localStorage
│   │   ├── ScoreSystem.js      # Puntuación y callback de cambio
│   │   └── SoundManager.js     # Reproducción de audio con manejo de errores
│   ├── scenes/
│   │   ├── BootScene.js        # Carga de assets y registro del shader CRT
│   │   ├── LoadingScene.js     # Barra de progreso de carga
│   │   ├── MainMenuScene.js    # Menú principal con high score
│   │   ├── TutorialScene.js    # Explicación de powerups (antes del nivel 1)
│   │   ├── GameScene.js        # Loop principal del juego
│   │   ├── LevelCompleteScene.js
│   │   ├── GameOverScene.js
│   │   └── VictoryScene.js
│   └── shaders/
│       └── CRTShader.js        # Post-processing pipeline efecto CRT
├── tests/
│   └── unit/                   # Un archivo .test.js por módulo
├── logs/                       # Logs de ejecución de tests (auto-generados)
└── .kiro/                      # Configuración de Kiro IDE
    ├── specs/                  # Especificaciones de features
    ├── steering/               # Reglas de contexto para el agente
    ├── hooks/                  # Automatizaciones del agente
    └── skills/                 # Snippets de referencia manuales
```

---

## Cómo ejecutar el juego

### Requisitos

- Navegador moderno con soporte ES6 (Chrome, Firefox, Edge, Safari)
- Conexión a internet (Phaser 3 y la fuente se cargan desde CDN)

### Pasos

```bash
git clone <url-del-repositorio>
cd bug-busters
```

Abre `index.html` con un servidor estático:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .
```

Navega a `http://localhost:8080`. No se requiere compilación.

### Tests

```bash
npm install
npm test
```

Las pruebas están en `tests/unit/` y usan **Jest** + **fast-check** (mínimo 100 iteraciones por propiedad).

---

## Desarrollo con Kiro IDE

Este proyecto fue construido íntegramente con **Kiro IDE** usando spec-driven development. A continuación se documenta toda la configuración del agente.

---

### Specs

Cada spec vive en `.kiro/specs/<nombre>/` y contiene `requirements.md`, `design.md` y `tasks.md`.

| Spec | Descripción |
|---|---|
| **bug-busters** | Feature inicial — mecánicas base: movimiento, enemigos, colisiones, HUD, progreso |
| **bug-busters-fixes** | Bugfix spec — correcciones de bugs detectados en la versión inicial |
| **gameplay-overhaul** | Feature — reemplaza proyectiles por bombas, añade pausa, mejora el sistema de niveles |
| **multi-bug-fixes** | Bugfix spec — correcciones múltiples post-overhaul |
| **retro-visual-effects** | Feature — shader CRT, partículas, hit-stop, score popups, scanlines |
| **powerup-system** | Feature — tres powerups automáticos por score, tutorial, banner y HUD extendido |

---

### Agent Hooks

Los hooks viven en `.kiro/hooks/` y se ejecutan automáticamente ante eventos del IDE.

#### `post-task-test-run`
- **Evento:** `postTaskExecution` — se dispara al completar cada tarea de un spec
- **Acción:** Ejecuta `npm test` y guarda el resultado en `logs/<datetime>.log`
- **Propósito:** Garantiza que ninguna tarea rompa los tests existentes

#### `spanish-code-docs`
- **Evento:** `fileEdited` — cualquier archivo en `src/**/*.js`
- **Acción:** Revisa que todos los comentarios e inline docs estén en español, sin tocar los identificadores en inglés
- **Propósito:** Mantener la convención de idioma del proyecto de forma automática

#### `asset-loader-sync`
- **Evento:** `fileEdited` — `src/managers/AssetLoader.js`
- **Acción:** Verifica si se añadieron o eliminaron assets y actualiza `.kiro/steering/asset-manisfest.md`
- **Propósito:** Mantener el manifiesto de assets sincronizado con el código real

#### `tilemap-json-lint`
- **Evento:** `fileEdited` — `assets/tilemaps/*.json`
- **Acción:** Valida que el JSON sea correcto, tenga la capa `ground`, referencie el tileset `tileset` y que los tiles de colisión tengan `collides: true`
- **Propósito:** Prevenir errores de configuración en los tilemaps antes de que lleguen al juego

---

### Steering Rules

Las steering rules viven en `.kiro/steering/` y se incluyen automáticamente en cada interacción con el agente.

#### `game-conventions.md`
Define las convenciones generales del proyecto:
- **Idioma del código:** comentarios en español, identificadores en inglés
- **Constantes:** nunca usar magic numbers — siempre referenciar `CONSTANTS`
- **Estructura de archivos:** dónde vive cada tipo de módulo
- **Compatibilidad Jest:** patrón de clase base condicional para entidades que extienden Phaser
- **Tests:** fast-check con `{ numRuns: 100 }`, un archivo por módulo

#### `phaser-patterns.md`
Patrones establecidos de Phaser 3 que el agente debe seguir:
- Orden de métodos en escenas: `constructor → init → preload → create → update`
- Guard `_transitioning` para evitar transiciones dobles
- Creación y eliminación de entidades físicas (`setActive(false)` en lugar de `destroy()`)
- Verificación de `active` antes de procesar colisiones
- Anclar HUD con `setScrollFactor(0)`
- Uso de `delayedCall` y `addEvent` para timers
- Partículas con Phaser 3.60+
- Detección de teclas con flanco de subida

#### `asset-manisfest.md`
Manifiesto completo de todos los assets del juego:
- Spritesheets con sus claves exactas (`kiro`, `wanderer`, `seeker`, `replicator`)
- Imágenes estáticas (`bomb`, `tileset`)
- Tilemaps JSON (`circuit_1`, `circuit_2`, `circuit_3`)
- Audio (`sfx_fire`, `sfx_eliminate`, `sfx_power_unlock`, `sfx_power_activate`, `sfx_life_lost`, `music_game`)
- Animaciones definidas en código y sus frames

---

### Skills

Los skills viven en `.kiro/skills/` y se activan manualmente con `#` en el chat.

#### `phaser-arcade-patterns`
- **Activación:** manual (`inclusion: manual`)
- **Contenido:** snippets de referencia para efectos arcade en Phaser 3:
  - Screen shake (suave y fuerte)
  - Flash de pantalla (blanco y rojo)
  - Hit-stop (freeze frame)
  - Partículas de explosión al eliminar enemigos
  - Score pop-up flotante
  - Blink de invencibilidad de Kiro
  - Pantalla de carga con scanlines
  - Fade entre escenas
  - Efecto CRT con viñeta
  - Animación de título con bounce

---

### MCP Servers

Configurados en `~/.kiro/settings/mcp.json`.

| Servidor | Comando | Estado | Descripción |
|---|---|---|---|
| **fetch** | `uvx mcp-server-fetch` | Deshabilitado | Permite al agente hacer fetch de URLs externas |
| **aws-api** (via ECS Express Power) | `uvx awslabs.aws-api-mcp-server@latest` | Activo (via Power) | Acceso a la API de AWS para despliegue con ECS Express Mode |

El servidor `aws-api` forma parte del **ECS Express Power** instalado en Kiro, que permite desplegar la aplicación como contenedor en AWS ECS con HTTPS en pocos pasos.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Motor de juego | Phaser 3.60 (CDN) |
| Lenguaje | JavaScript ES6+ (módulos nativos) |
| Fuente | Press Start 2P (Google Fonts CDN) |
| Persistencia | `localStorage` |
| Tests | Jest 29 + fast-check 3 |
| IDE | Kiro |
