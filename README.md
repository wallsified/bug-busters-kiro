# Bug Busters - Esqueleto del proyecto

Este repositorio es un esqueleto para el concurso "Bug Busters" y contiene artefactos exigidos para demostrar el uso de features de Kiro:
Specs, Steering, Hooks, MCP y Powers.

Contenido principal
- .kiro/specs/: Specs del juego (requisitos, diseños, tasks).
- .kiro/steering/: Steering docs (product, tech).
- .kiro/hooks/: Hooks de ejemplo.
- powers/bugtools/: Power que expone MCP (persistencia / leaderboard).
- src/: Código de ejemplo (MCP, steering rules, entidad bug).
- assets/: carpeta para sprites y sonidos.

Decisiones
- Build objetivo: Web (HTML5 + JavaScript). Recomendado: Phaser 3 para el MVP.
- Persistencia: localStorage por defecto; la Power `bugtools` define endpoints MCP para persistencia remota.

Licencia
- MIT (archivo LICENSE incluido).

Cómo usar
1. Copia los archivos a una carpeta en tu máquina (por ejemplo `bug-busters-skeleton`).
2. Si quieres crear un ZIP (desde el directorio padre):
   - macOS/Linux: `zip -r bug-busters-skeleton.zip bug-busters-skeleton`
   - Windows PowerShell: `Compress-Archive -Path .\bug-busters-skeleton\* -DestinationPath .\bug-busters-skeleton.zip`
3. Para empezar a implementar el MVP:
   - Añade Phaser 3 y crea la escena principal en `src/`.
   - Implementa entities y usa `src/mcp/GameManager.js` como punto central.
   - Asegúrate de incluir las specs y steering en `.kiro/` para evidenciar uso de Kiro.

Siguientes pasos que puedo generar por ti (elige):
- Generar el ZIP y entregarte el archivo (si quieres que lo suba a un enlace).
- Crear el PR en un repo (dame owner/repo).
- Implementar MVP minimal en Phaser y añadir build web.

Comentarios en el repo: README y documentación en español; código en inglés con comentarios en español.