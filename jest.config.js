/**
 * Configuración de Jest para el proyecto Bug Busters.
 * Usa babel-jest para transformar módulos ES6 y ejecuta los tests en entorno Node.
 */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/tests/unit/**/*.test.js']
};
