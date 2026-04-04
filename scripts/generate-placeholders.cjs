/**
 * Script para generar archivos de assets placeholder para Bug Busters.
 * Crea PNGs mínimos válidos (1x1 pixel transparente) y archivos MP3 vacíos.
 */

const fs = require('fs');
const path = require('path');

const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const pngBuffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

const sprites = ['kiro.png', 'wanderer.png', 'seeker.png', 'replicator.png', 'projectile.png', 'tileset.png'];
const audioFiles = ['sfx_fire.mp3', 'sfx_eliminate.mp3', 'sfx_power_unlock.mp3', 'sfx_power_activate.mp3', 'sfx_life_lost.mp3', 'music_game.mp3'];

const spritesDir = path.join(__dirname, '..', 'assets', 'sprites');
const audioDir = path.join(__dirname, '..', 'assets', 'audio');

fs.mkdirSync(spritesDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

for (const sprite of sprites) {
  fs.writeFileSync(path.join(spritesDir, sprite), pngBuffer);
  console.log(`[OK] ${sprite}`);
}

for (const audio of audioFiles) {
  fs.writeFileSync(path.join(audioDir, audio), Buffer.alloc(0));
  console.log(`[OK] ${audio}`);
}

console.log('\nAssets placeholder generados.');
