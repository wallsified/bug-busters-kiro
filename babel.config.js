/**
 * Configuración de Babel para transformar módulos ES6 en los tests de Jest.
 */
export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: 'auto'
      }
    ]
  ]
};
