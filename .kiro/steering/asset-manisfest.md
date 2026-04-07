# Bug Busters — Manifiesto de Assets

Todas las claves de assets registradas en `AssetLoader.preload()`. Usar **exactamente** estas claves en cualquier referencia dentro del código.

## Spritesheets (32×32 px por frame)

| Clave        | Archivo                          | Tipo         | Uso                        |
|--------------|----------------------------------|--------------|----------------------------|
| `kiro`       | `assets/sprites/kiro.png`        | spritesheet  | Jugador principal          |
| `wanderer`   | `assets/sprites/wanderer.png`    | spritesheet  | Enemigo básico             |
| `seeker`     | `assets/sprites/seeker.png`      | spritesheet  | Enemigo perseguidor        |
| `replicator` | `assets/sprites/replicator.png`  | spritesheet  | Enemigo generador          |

## Imágenes estáticas

| Clave        | Archivo                          | Tipo   | Uso                        |
|--------------|----------------------------------|--------|----------------------------|
| `projectile` | `assets/sprites/projectile.png`  | image  | Proyectil disparado        |
| `tileset`    | `assets/sprites/tileset.png`     | image  | Tileset de los niveles     |

## Tilemaps

| Clave       | Archivo                            | Tipo            | Nivel |
|-------------|------------------------------------|-----------------|-------|
| `circuit_1` | `assets/tilemaps/circuit_1.json`   | tilemapTiledJSON | 1     |
| `circuit_2` | `assets/tilemaps/circuit_2.json`   | tilemapTiledJSON | 2     |
| `circuit_3` | `assets/tilemaps/circuit_3.json`   | tilemapTiledJSON | 3     |

Los tilemaps deben tener una capa llamada `"ground"` y usar el tileset con nombre `"tileset"`.
Las tiles con colisión deben tener la propiedad `collides: true`.

## Audio

| Clave                 | Archivo                               | Tipo  | Evento de juego                  |
|-----------------------|---------------------------------------|-------|----------------------------------|
| `sfx_fire`            | `assets/audio/sfx_fire.mp3`           | audio | Kiro dispara un proyectil        |
| `sfx_eliminate`       | `assets/audio/sfx_eliminate.mp3`      | audio | Enemigo eliminado                |
| `sfx_power_unlock`    | `assets/audio/sfx_power_unlock.mp3`   | audio | Poder desbloqueado por score     |
| `sfx_power_activate`  | `assets/audio/sfx_power_activate.mp3` | audio | Poder activado por el jugador    |
| `sfx_life_lost`       | `assets/audio/sfx_life_lost.mp3`      | audio | Kiro recibe daño                 |
| `music_game`          | `assets/audio/music_game.mp3`         | audio | Música de fondo del gameplay     |

## Animaciones definidas en código

Estas animaciones se crean en las escenas/entidades y referencian los spritesheets anteriores:

| Clave animación      | Spritesheet  | Frames  |
|----------------------|--------------|---------|
| `kiro-idle`          | `kiro`       | [0]     |
| `kiro-walk-down`     | `kiro`       | [0,1]   |
| `kiro-walk-up`       | `kiro`       | [2,3]   |
| `kiro-walk-left`     | `kiro`       | [4,5]   |
| `kiro-walk-right`    | `kiro`       | [6,7]   |

## Fallback

Si un asset falla al cargar, `AssetLoader.getFallback(key)` retorna `'placeholder'`.
Asegurarse de que el asset `placeholder` esté siempre disponible o generado proceduralmente.

## Notas para nuevos assets

Al agregar un nuevo asset:
1. Agregar la entrada a este manifiesto.
2. Agregar la llamada `scene.load.*` correspondiente en `AssetLoader.preload()`.
3. Documentar la fuente/licencia en `assets/CREDITS.txt`.
