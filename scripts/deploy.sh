#!/bin/bash
# =============================================================================
# deploy.sh — Script de despliegue automatizado para Bug Busters en EC2
# =============================================================================
# Uso:
#   bash deploy.sh          (ejecutar vía SSH en la instancia)
#   Como user-data de EC2   (primer arranque automático)
#
# Antes de ejecutar, reemplaza REPO_URL con la URL real del repositorio.
# Para hacer el script ejecutable: chmod +x scripts/deploy.sh
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Variables de configuración
# -----------------------------------------------------------------------------

# IMPORTANTE: Reemplaza esta URL con la URL real del repositorio antes de ejecutar
REPO_URL="https://github.com/wallsified/bug-busters-kiro"

# Directorio raíz donde nginx servirá los archivos del juego
DEPLOY_DIR="/var/www/bug-busters"

# Ruta del archivo de configuración de nginx para este vhost
NGINX_CONF="/etc/nginx/conf.d/bug-busters.conf"

# -----------------------------------------------------------------------------
# Función auxiliar de logging con prefijo de timestamp
# -----------------------------------------------------------------------------
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# =============================================================================
# Paso 1: Actualizar el sistema
# =============================================================================
log "Actualizando paquetes del sistema..."
dnf update -y

# =============================================================================
# Paso 2: Instalar nginx y git
# =============================================================================
log "Instalando nginx y git..."
dnf install -y nginx git

# =============================================================================
# Paso 3: Clonar o actualizar los archivos del juego
# =============================================================================
log "Desplegando archivos del juego en $DEPLOY_DIR..."
if [ -d "$DEPLOY_DIR/.git" ]; then
    # El repositorio ya existe — actualizar con los últimos cambios
    log "Repositorio existente detectado. Ejecutando git pull..."
    git -C "$DEPLOY_DIR" pull
else
    # Primera ejecución — clonar el repositorio desde cero
    log "Clonando repositorio desde $REPO_URL..."
    rm -rf "$DEPLOY_DIR"
    git clone "$REPO_URL" "$DEPLOY_DIR"
fi

# =============================================================================
# Paso 4: Eliminar archivos de desarrollo innecesarios en producción
# =============================================================================
log "Eliminando archivos de desarrollo..."
rm -rf \
    "$DEPLOY_DIR/tests" \
    "$DEPLOY_DIR/node_modules" \
    "$DEPLOY_DIR/jest.config.js" \
    "$DEPLOY_DIR/babel.config.js" \
    "$DEPLOY_DIR/package.json" \
    "$DEPLOY_DIR/package-lock.json" \
    "$DEPLOY_DIR/logs" \
    "$DEPLOY_DIR/.kiro"

# =============================================================================
# Paso 5: Configurar propietario y permisos de archivos
# =============================================================================
log "Configurando permisos de archivos..."

# Asignar todos los archivos al usuario nginx para que el servidor pueda leerlos
chown -R nginx:nginx "$DEPLOY_DIR"

# Directorios: 755 (rwxr-xr-x) — nginx necesita ejecutar para listar/acceder
find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;

# Archivos: 644 (rw-r--r--) — nginx necesita leer, escritura solo para el propietario
find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

# =============================================================================
# Paso 6: Escribir la configuración del bloque server de nginx
# =============================================================================
log "Escribiendo configuración de nginx en $NGINX_CONF..."
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/bug-busters;
    index index.html;

    # Bloque types{} explícito: Amazon Linux 2023 incluye nginx con text/javascript
    # para archivos .js, lo que puede causar problemas con cargadores estrictos de
    # módulos ES6 que requieren application/javascript. Este bloque sobreescribe los
    # tipos MIME globales del sistema para este vhost, replicando exactamente el
    # comportamiento de `npx serve .` y garantizando que los módulos ES6 y los
    # tilemaps de Tiled se carguen correctamente en el navegador.
    types {
        text/html               html htm;
        application/javascript  js mjs;
        application/json        json;
        text/css                css;
        image/png               png;
        image/x-icon            ico;
        audio/mpeg              mp3;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# =============================================================================
# Paso 7: Validar configuración y arrancar nginx
# =============================================================================
log "Validando configuración de nginx..."
nginx -t

log "Habilitando nginx para arranque automático al reiniciar..."
systemctl enable nginx

# Usar start en primera ejecución, reload si ya está corriendo — evita el cuelgue de restart
if systemctl is-active --quiet nginx; then
    log "nginx ya está activo. Recargando configuración..."
    systemctl reload nginx
else
    log "Iniciando nginx..."
    systemctl start nginx
fi

# Obtener la IP pública de la instancia desde el servicio de metadatos de EC2
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
log "Despliegue completado. El juego está disponible en http://${PUBLIC_IP}/"
