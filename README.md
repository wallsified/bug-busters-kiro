> "Who you gonna call? Bug Hunters!"

Juego arcade de navegador construido con **HTML5 + JavaScript** y el framework **Phaser 3**. Controlas a **Kiro**, un fantasma que recorre tableros de circuitos para eliminar bugs de software antes de que corrompan los módulos críticos del sistema.

---

## Descripción

Bug Busters es un juego de acción en vista cenital donde el jugador debe eliminar tres tipos de enemigos (bugs) disparando proyectiles, proteger los módulos del circuito y avanzar a través de tres niveles de dificultad creciente. El juego guarda el progreso localmente en el navegador y desbloquea poderes especiales conforme aumenta la puntuación.

---

## Controles

| Acción | Teclado |
|---|---|
| Mover arriba | `↑` o `W` |
| Mover abajo | `↓` o `S` |
| Mover izquierda | `←` o `A` |
| Mover derecha | `→` o `D` |
| Disparar | `Espacio` o clic del ratón |
| Activar Freeze | `Q` |
| Activar Patch Bomb | `E` |

---

## Características del juego

### Enemigos

| Tipo | Comportamiento | Puntos |
|---|---|---|
| **Wanderer** | Se mueve en dirección aleatoria, cambia cada 1–3 segundos | 10 pts |
| **Seeker** | Recalcula la ruta hacia Kiro cada 500 ms | 20 pts |
| **Replicator** | Genera un nuevo Wanderer cada 8 segundos (máximo 3) | 30 pts |

Cuando un bug colisiona con Kiro, se pierde una vida y se activa un período de invencibilidad de 3 segundos. Si un bug alcanza un módulo, reduce su integridad; si llega a cero, el nivel falla.

### Poderes especiales

| Poder | Desbloqueo | Efecto | Cooldown |
|---|---|---|---|
| **Freeze** | 150 puntos | Inmoviliza todos los bugs durante 5 segundos | 15 s |
| **Patch Bomb** | 300 puntos | Elimina todos los bugs en un radio de 250 px | 20 s |

### Niveles

El juego cuenta con **3 niveles** de dificultad creciente, cada uno con un diseño único de tablero de circuito:

| Nivel | Wanderers | Seekers | Replicators |
|---|---|---|---|
| 1 | 3 | 1 | 0 |
| 2 | 3 | 2 | 1 |
| 3 | 2 | 3 | 2 |

Completar el nivel 3 muestra la pantalla de victoria con el mensaje *"I ain't afraid a no bugs"*.

---

## Cómo ejecutar el juego

### Requisitos

- Navegador moderno con soporte para ES6 (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para cargar Phaser 3 y la fuente desde CDN)

### Pasos

1. Clona o descarga el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd bug-busters
   ```

2. Abre `index.html` directamente en el navegador, o sirve el directorio con cualquier servidor HTTP estático:
   ```bash
   # Con Python
   python3 -m http.server 8080

   # Con Node.js (npx)
   npx serve .
   ```

3. Navega a `http://localhost:8080` en tu navegador.

> No se requiere proceso de compilación. El juego corre directamente en el navegador.

---
### Requisitos previos

```bash
npm install
```

### Ejecutar todas las pruebas

```bash
npm test
```

Las pruebas se encuentran en `tests/unit/` y cubren todos los sistemas principales del juego usando **Jest** + **fast-check** (mínimo 100 iteraciones por propiedad).

---

## Uso de las características de Kiro IDE

Este juego fue desarrollado íntegramente con **Kiro IDE**, aprovechando sus funcionalidades nativas.

### Specs

Las **specs** se usaron para definir formalmente los tres pilares del proyecto antes de escribir código:

- **`requirements.md`**: 11 requisitos en formato de historias de usuario con criterios de aceptación verificables.
- **`design.md`**: Arquitectura de escenas, interfaces de clases, modelos de datos y 14 propiedades de corrección que guían los tests basados en propiedades.
- **`tasks.md`**: 16 tareas ordenadas e incrementales, cada una vinculada a requisitos específicos para trazabilidad completa.

### Steering Rules

Las **steering rules** establecieron estándares de codificación aplicados consistentemente:

- Nombres de variables, funciones y clases en **inglés**.
- Comentarios explicativos en **español**.
- Tests de propiedades con fast-check con mínimo 100 iteraciones, referenciando la propiedad del diseño que validan.

### Hooks

Los **hooks** automatizaron la ejecución de pruebas:

- Un hook `fileEdited` sobre `src/**/*.js` y `tests/**/*.js` disparaba `npm test` automáticamente al guardar cualquier archivo, garantizando retroalimentación inmediata ante regresiones.

### MCP

El protocolo **MCP** se utilizó para acceder a herramientas externas:

- Consultas sobre la API de Phaser 3 (física arcade, grupos de sprites, sistema de escenas).
- Verificación de la sintaxis de fast-check y configuración de Jest con Babel para módulos ES6.
- Búsqueda de licencias de assets de audio en freesound.org.

### Powers

Los **powers** de Kiro ampliaron las capacidades del agente:

- Acceso a documentación especializada de Phaser 3 y fast-check directamente desde el IDE.
- Consultas sobre mejores prácticas de arquitectura para juegos basados en escenas.
- Verificación de licencias de assets open-source (CC0).

---

## Créditos de assets

Todos los assets son de licencia abierta (CC0) o generados proceduralmente. Consulta [`assets/CREDITS.txt`](assets/CREDITS.txt) para ver las fuentes completas.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Motor de juego | Phaser 3 (CDN) |
| Lenguaje | JavaScript ES6+ |
| Fuente | Press Start 2P (Google Fonts) |
| Persistencia | `localStorage` |
| Pruebas | Jest + fast-check |
