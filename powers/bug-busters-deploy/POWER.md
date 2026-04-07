---
name: "Bug Busters Deploy to EC2"
displayName: "Bug Busters Deploy to EC2"
description: "Complete deployment guide to deploy Bug Busters to AWS EC2 with nginx. Covers provisioning, security groups, deploy script execution, smoke tests, integration tests, and optional HTTPS setup."
keywords: ["deploy", "ec2", "nginx", "aws", "static files"]
author: "wallsified"
---

# Server Deployment

## Overview

This power documents the full deployment workflow for an nginx static file server into a AWS EC2 instance running Amazon Linux 2023 to deploy Bug Busters

The deploy script (`scripts/deploy.sh`) is idempotent — it can be run multiple times safely. On first run it clones the repo; on subsequent runs it does `git pull`. If nginx is already running it reloads instead of restarting.

## Available Steering Files

- **smoke-and-integration-tests** — All verification commands (smoke tests on the instance + integration tests from local machine)

---

## Onboarding

### Prerequisites

- AWS account with EC2 access
- Key pair file: `bug-busters-keys.pem` (in project root — already in `.gitignore`, never commit it)
- EC2 instance running (see Provisioning section)
- Security group `bug-busters-sg` configured (see Security Group section)

### Local verification before deploying

Always verify the game works locally first:

```bash
npx serve .
```

Open `http://localhost:3000`. Check DevTools → Console for zero errors, and confirm:
- `.js` files → `Content-Type: application/javascript`
- `.json` files → `Content-Type: application/json`

Only proceed to EC2 once the local check passes.

---

## Provisioning

### Launch EC2 instance (AWS CLI)

```bash
# Get latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text)

# Launch t2.micro (Free Tier)
aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t2.micro \
  --key-name <your-key-pair-name> \
  --security-group-ids <your-security-group-id> \
  --associate-public-ip-address \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bug-busters}]'

# Get public IP once running
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=bug-busters" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text
```

---

## Security Group

Group name: `bug-busters-sg`

| Direction | Protocol | Port | Source |
|-----------|----------|------|--------|
| Inbound | TCP | 22 | `<YOUR_IP>/32` — SSH, operator only |
| Inbound | TCP | 80 | `0.0.0.0/0` — HTTP public |
| Inbound | TCP | 443 | `0.0.0.0/0` — HTTPS (optional) |
| Outbound | All | All | `0.0.0.0/0` |

```bash
SG_ID=$(aws ec2 create-security-group \
  --group-name bug-busters-sg \
  --description "Security group for Bug Busters EC2 instance" \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr <YOUR_IP>/32
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
# Optional HTTPS:
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
```

---

## Deployment Workflow

### 1. Copy and run the deploy script

```bash
EC2_IP="<your-ec2-public-ip>"

scp -i bug-busters-keys.pem scripts/deploy.sh ec2-user@$EC2_IP:/tmp/deploy.sh
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP "bash /tmp/deploy.sh"
```

### What the script does (in order)

1. `dnf update -y`
2. `dnf install -y nginx git`
3. `git clone` or `git pull` into `/var/www/bug-busters`
4. Removes dev files: `tests/`, `node_modules/`, `jest.config.js`, `babel.config.js`, `package.json`, `package-lock.json`, `logs/`, `.kiro/`
5. `chown -R nginx:nginx /var/www/bug-busters`
6. Permissions: `755` on dirs, `644` on files
7. Writes `/etc/nginx/conf.d/bug-busters.conf` with explicit MIME types
8. `nginx -t` → `systemctl enable nginx` → `start` or `reload`

### nginx config (written by the script)

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/bug-busters;
    index index.html;

    types {
        text/html               html htm;
        application/javascript  js mjs;   # required for ES6 modules
        application/json        json;     # required for Tiled tilemaps
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

The explicit `types {}` block overrides Amazon Linux 2023's default `text/javascript` for `.js` files, which would break ES6 module loading.

---

## Verification

See the **smoke-and-integration-tests** steering file for all verification commands.

Quick summary:
- SSH smoke tests confirm nginx is active, files are present, permissions are correct
- Local integration tests confirm HTTP 200, correct MIME types, and 404 for missing paths

---

## HTTPS Setup (Optional)

Requires a registered domain with DNS pointing to the EC2 IP.

```bash
ssh -i bug-busters-keys.pem ec2-user@$EC2_IP
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal timer
systemctl status certbot-renew.timer
```

After Certbot runs, HTTP automatically redirects to HTTPS (301).

---

## Troubleshooting

### ES6 module error in browser console
Cause: Wrong MIME type for `.js` (served as `text/plain` or `text/javascript`)
Fix: Ensure the nginx `types {}` block in the config is present. Re-run `deploy.sh`.

### Tilemap fails to load
Cause: `.json` not served as `application/json`
Fix: Same as above — re-run `deploy.sh` to rewrite the nginx config.

### SSH connection refused
Cause: Security group missing port 22 rule, or wrong IP in the rule
Fix: Update the inbound SSH rule in `bug-busters-sg` with your current IP.

### Blank screen, no console errors
Cause: `index.html` not found at root
Fix: Verify `root /var/www/bug-busters` in nginx config and that `index.html` exists there.

### Second deploy run fails
The script is idempotent — if it fails on a second run, check `nginx -t` output for config syntax errors.

---

## Key Paths Reference

| Path | Purpose |
|------|---------|
| `bug-busters-keys.pem` | SSH private key (project root, gitignored) |
| `scripts/deploy.sh` | Deploy script |
| `/var/www/bug-busters` | Game files on EC2 |
| `/etc/nginx/conf.d/bug-busters.conf` | nginx vhost config |
