---
inclusion: manual
---

# Bug Busters — Deployment Power

## Resumen del stack

- Servidor: **Amazon Linux 2023**, instancia **t2.micro** (Free Tier)
- Web server: **nginx** (instalado vía `dnf`)
- Repositorio: `https://github.com/wallsified/bug-busters-kiro`
- Directorio de despliegue: `/var/www/bug-busters`
- Configuración nginx: `/etc/nginx/conf.d/bug-busters.conf`
- Clave SSH: `bug-busters-keys.pem` (en la raíz del proyecto — **nunca commitear**)

## Flujo de despliegue

1. Verificar localmente con `npx serve .` → sin errores en consola
2. Conectar por SSH: `ssh -i bug-busters-keys.pem ec2-user@<EC2_PUBLIC_IP>`
3. Ejecutar el script: `bash /tmp/deploy.sh`
4. Correr smoke tests e integration tests (ver secciones abajo)

## Script de despliegue

El script `scripts/deploy.sh` hace todo en un solo paso:

```bash
# Copiar y ejecutar en la instancia
scp -i bug-busters-keys.pem scripts/deploy.sh ec2-user@<EC2_PUBLIC_IP>:/tmp/deploy.sh
ssh -i bug-busters-keys.pem ec2-user@<EC2_PUBLIC_IP> "bash /tmp/deploy.sh"
```

Pasos internos del script:
1. `dnf update -y`
2. `dnf install -y nginx git`
3. `git clone` o `git pull` en `/var/www/bug-busters`
4. Elimina: `tests/`, `node_modules/`, `jest.config.js`, `babel.config.js`, `package.json`, `package-lock.json`, `logs/`, `.kiro/`
5. `chown -R nginx:nginx` + permisos `755` dirs / `644` archivos
6. Escribe `/etc/nginx/conf.d/bug-busters.conf` con MIME types explícitos
7. `nginx -t` → `systemctl enable nginx` → `start` o `reload`

## Configuración nginx (resumen)

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/bug-busters;
    index index.html;

    types {
        text/html               html htm;
        application/javascript  js mjs;   # crítico para módulos ES6
        application/json        json;     # crítico para tilemaps Tiled
        text/css                css;
        image/png               png;
        image/x-icon            ico;
        audio/mpeg              mp3;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## Security Group `bug-busters-sg`

| Dirección | Protocolo | Puerto | Origen |
|-----------|-----------|--------|--------|
| Inbound   | TCP       | 22     | `<YOUR_IP>/32` (solo operador) |
| Inbound   | TCP       | 80     | `0.0.0.0/0` |
| Inbound   | TCP       | 443    | `0.0.0.0/0` (opcional, HTTPS) |
| Outbound  | All       | All    | `0.0.0.0/0` |

## Smoke tests (en la instancia vía SSH)

```bash
# nginx activo y habilitado
systemctl is-active nginx   # → active
systemctl is-enabled nginx  # → enabled

# Archivos presentes
ls /var/www/bug-busters/{index.html,favicon.ico,assets,src}

# Archivos de dev excluidos
test ! -d /var/www/bug-busters/tests && echo 'OK'

# Permisos correctos
stat -c '%U %a' /var/www/bug-busters/index.html  # → nginx 644
```

## Integration tests (desde local)

```bash
EC2_IP="<your-ec2-public-ip>"

curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/
# → 200

curl -s -I http://$EC2_IP/src/config/constants.js | grep -i content-type
# → content-type: application/javascript

curl -s -I http://$EC2_IP/assets/tilemaps/circuit_1.json | grep -i content-type
# → content-type: application/json

curl -s -I http://$EC2_IP/assets/sprites/kiro.png | grep -i content-type
# → content-type: image/png

curl -s -I http://$EC2_IP/assets/audio/loop.mp3 | grep -i content-type
# → content-type: audio/mpeg

curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/nonexistent.html
# → 404
```

## HTTPS (opcional, requiere dominio)

Prerrequisitos: DNS apuntando a la IP, puerto 443 abierto, nginx sirviendo HTTP.

```bash
ssh ec2-user@$EC2_IP
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verificar renovación automática
systemctl status certbot-renew.timer  # → active (waiting)
```

## Idempotencia

El script es idempotente: ejecutarlo dos veces no rompe nada. Si el repo ya existe hace `git pull`; si nginx ya corre hace `reload` en lugar de `start`.

## Archivos sensibles

- `bug-busters-keys.pem` — clave privada RSA para SSH. Ya está en `.gitignore`. **Nunca commitear ni compartir.**
