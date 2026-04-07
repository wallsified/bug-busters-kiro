# Smoke & Integration Tests

Run these after `deploy.sh` completes to confirm everything is working.

```bash
EC2_IP="<your-ec2-public-ip>"
```

---

## Smoke Tests (via SSH on the instance)

### nginx is active

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "systemctl is-active nginx"
# Expected: active
```

### nginx is enabled on boot

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "systemctl is-enabled nginx"
# Expected: enabled
```

### Game files are present

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "ls /var/www/bug-busters/{index.html,favicon.ico,assets,src}"
# Expected: all four paths listed without error
```

### Dev files are excluded

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "test ! -d /var/www/bug-busters/tests && echo 'OK: tests/ excluded'"
# Expected: OK: tests/ excluded
```

### File ownership and permissions

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "stat -c '%U %a' /var/www/bug-busters/index.html"
# Expected: nginx 644
```

---

## Integration Tests (from local machine)

### Root path returns HTTP 200

```bash
curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/
# Expected: 200
```

### JS files served as application/javascript

```bash
curl -s -I http://$EC2_IP/src/config/constants.js | grep -i content-type
# Expected: content-type: application/javascript
```

### JSON tilemaps served as application/json

```bash
curl -s -I http://$EC2_IP/assets/tilemaps/circuit_1.json | grep -i content-type
# Expected: content-type: application/json
```

### PNG sprites served as image/png

```bash
curl -s -I http://$EC2_IP/assets/sprites/kiro.png | grep -i content-type
# Expected: content-type: image/png
```

### MP3 audio served as audio/mpeg

```bash
curl -s -I http://$EC2_IP/assets/audio/loop.mp3 | grep -i content-type
# Expected: content-type: audio/mpeg
```

### Nonexistent path returns HTTP 404

```bash
curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/nonexistent.html
# Expected: 404
```

### Idempotency — second deploy run

```bash
scp -i bug-busters-keys.pem scripts/deploy.sh ec2-user@$EC2_IP:/tmp/deploy.sh
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "bash /tmp/deploy.sh && echo 'Second run: OK'"
# Expected: script completes and prints "Second run: OK"
```

---

## HTTPS Tests (after Certbot, if applicable)

```bash
DOMAIN="your-domain.com"

# HTTP should redirect to HTTPS
curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/
# Expected: 301

# HTTPS should return 200
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/
# Expected: 200
```
