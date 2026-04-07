/**
 * CRTShader — Pipeline WebGL de post-procesado que simula el aspecto de un monitor CRT.
 * Aplica viñeta radial y líneas de escaneo sobre la imagen renderizada.
 */

// Shader GLSL de fragmento con efecto de viñeta y líneas de escaneo
const FRAG_SHADER = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float vignetteStrength;
uniform float scanlineAlpha;
varying vec2 outTexCoord;

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);
  
  // Viñeta: oscurecimiento hacia los bordes usando gradiente radial
  vec2 uv = outTexCoord * 2.0 - 1.0;
  float dist = length(uv);
  float vignette = 1.0 - dist * vignetteStrength;
  vignette = clamp(vignette, 0.0, 1.0);
  color.rgb *= vignette;
  
  // Líneas de escaneo: oscurecer filas de píxeles impares
  float row = floor(gl_FragCoord.y);
  float scanline = mod(row, 2.0);
  if (scanline > 0.5) {
    color.rgb *= (1.0 - scanlineAlpha);
  }
  
  gl_FragColor = color;
}
`;

// Clase base condicional para compatibilidad con entornos sin Phaser (Jest)
const BasePostFX = (typeof Phaser !== 'undefined')
  ? Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
  : class { constructor() {} onPreRender() {} };

/**
 * Pipeline de post-procesado CRT para Phaser WebGL.
 * Aplica viñeta radial y líneas de escaneo cada frame.
 */
export class CRTShader extends BasePostFX {
  constructor(game) {
    if (typeof Phaser !== 'undefined') {
      super({ game, name: 'CRTShader', fragShader: FRAG_SHADER });
    }
    // Intensidad de la viñeta radial (oscurecimiento hacia los bordes)
    this.vignetteStrength = 0.25;
    // Opacidad de las líneas de escaneo en filas impares
    this.scanlineAlpha = 0.18;
  }

  /**
   * Se ejecuta antes de cada frame para actualizar los uniforms del shader.
   */
  onPreRender() {
    try {
      this.set1f('vignetteStrength', this.vignetteStrength);
      this.set1f('scanlineAlpha', this.scanlineAlpha);
    } catch (e) {
      // Los uniforms pueden no existir en entornos de prueba; se ignora el error
    }
  }
}

/**
 * Calcula el valor de brillo de la viñeta para una distancia y fuerza dadas.
 * Refleja la lógica GLSL del shader para pruebas en JS puro.
 * @param {number} dist - Distancia normalizada al centro de la pantalla
 * @param {number} strength - Intensidad de la viñeta
 * @returns {number} Valor de brillo entre 0.0 y 1.0
 */
export function vignetteValue(dist, strength) {
  return Math.min(1.0, Math.max(0.0, 1.0 - dist * strength));
}

/**
 * Calcula el multiplicador de brillo de la línea de escaneo para una fila dada.
 * Refleja la lógica GLSL del shader para pruebas en JS puro.
 * @param {number} row - Índice de fila del píxel
 * @param {number} alpha - Reducción de brillo en filas impares
 * @returns {number} Multiplicador de brillo (1.0 para filas pares, 1.0 - alpha para impares)
 */
export function scanlineValue(row, alpha) {
  return (row % 2 !== 0) ? (1.0 - alpha) : 1.0;
}
