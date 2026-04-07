# Bug Busters — Deployment Guide

## Pre-Deployment Verification

Before deploying to EC2, verify the game works correctly using the local reference server. This confirms the static files are intact and catches issues before they reach the server.

### Start the local server

From the project root:

```bash
npx serve .
```

Open `http://localhost:3000` in your browser.

### Browser checks

**1. No console errors**

Open DevTools → Console tab. The game should load with zero errors. Common issues to look for:
- Failed to fetch a `.js` module (MIME type or path problem)
- Failed to load a tilemap `.json` file
- Missing sprite or audio asset

**2. `.js` files served as `application/javascript`**

Open DevTools → Network tab, filter by JS. Click any `.js` request (e.g. `src/config/constants.js`) and confirm:

```
Content-Type: application/javascript
```

This is the MIME type nginx must replicate. If it shows `text/plain` or anything else, the local server is misconfigured.

**3. `.json` files served as `application/json`**

In the Network tab, filter by Fetch/XHR or search for `.json`. Click any tilemap request (e.g. `assets/tilemaps/circuit_1.json`) and confirm:

```
Content-Type: application/json
```

Phaser requires this MIME type to parse Tiled tilemaps correctly.

### If the game does not load

Resolve the issue locally before proceeding with EC2 deployment (Requirement 8.3). Common fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| ES6 module error in console | Wrong MIME type for `.js` | Ensure you are using `npx serve .`, not `python -m http.server` |
| Tilemap fails to load | Wrong MIME type for `.json` | Same as above — use `npx serve .` |
| Sprite or audio missing | File path mismatch | Check `assets/` directory structure matches `AssetLoader.js` |
| Blank screen, no errors | `index.html` not found | Run `npx serve .` from the project root, not a subdirectory |

Only proceed to EC2 deployment once the game loads and runs without console errors under `npx serve .`.

---

## EC2 Provisioning

Provision a Free Tier eligible EC2 instance to host the game. The steps below cover both the AWS Console and the equivalent AWS CLI commands.

### AWS Console

**Step 1 — Open the Launch Instance wizard**

Go to EC2 → Instances → Launch instances.

**Step 2 — Choose an AMI**

Search for **Amazon Linux 2023** and select the latest 64-bit (x86) AMI. This satisfies Requirement 1.1.

**Step 3 — Choose an instance type**

Select **t2.micro** (Free Tier eligible). This satisfies Requirement 1.2.

**Step 4 — Configure a key pair**

Under *Key pair (login)*, select an existing RSA or ED25519 key pair, or create a new one. The private key file (`.pem` for RSA, `.pem`/`.ppk` for ED25519) must be saved securely — it cannot be downloaded again. This satisfies Requirement 1.3.

**Step 5 — Configure network settings**

- Leave the default VPC and subnet unless you have a specific preference.
- Under *Auto-assign public IP*, select **Enable**. This satisfies Requirement 1.4.
- Under *Firewall (security groups)*, attach the security group you will configure in the next section (see [Security Group Configuration](#security-group-configuration)). This satisfies Requirement 1.5.

**Step 6 — Launch**

Review the summary and click **Launch instance**. The instance will be assigned a public IP address once it reaches the *running* state. Note the public IP — you will need it for SSH access and to verify the deployment.

---

### AWS CLI (alternative)

The commands below are equivalent to the Console steps above. Replace the placeholder values with your own.

```bash
# Retrieve the latest Amazon Linux 2023 AMI ID for your region
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters \
    "Name=name,Values=al2023-ami-*-x86_64" \
    "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text)

echo "Using AMI: $AMI_ID"

# Launch the instance
# Replace <your-key-pair-name> and <your-security-group-id> with real values
aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t2.micro \
  --key-name <your-key-pair-name> \
  --security-group-ids <your-security-group-id> \
  --associate-public-ip-address \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bug-busters}]'
```

After the instance reaches the *running* state, retrieve its public IP:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=bug-busters" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text
```

Verify SSH access before proceeding:

```bash
ssh -i /path/to/your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

> The security group must be created and its ID known before running `run-instances`. See the next section for security group setup.

---

## Security Group Configuration

Configure the `bug-busters-sg` security group to control inbound and outbound traffic for the EC2 instance. The rules below satisfy Requirements 2.1–2.5.

> AWS security groups implicitly deny all inbound traffic not explicitly listed — no additional deny rules are needed (Requirement 2.5).

### Inbound rules summary

| Rule | Protocol | Port | Source | Purpose |
|---|---|---|---|---|
| SSH | TCP | 22 | Your IP only (`<YOUR_IP>/32`) | Operator access — restricted, not open to the world |
| HTTP | TCP | 80 | 0.0.0.0/0 | Public game access |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Public game access over TLS (optional — only if HTTPS is enabled) |

### Outbound rules summary

| Rule | Protocol | Port | Destination | Purpose |
|---|---|---|---|---|
| All traffic | All | All | 0.0.0.0/0 | Package repos, git, CDN endpoints |

---

### AWS Console

**Step 1 — Create the security group**

Go to EC2 → Network & Security → Security Groups → **Create security group**.

- Name: `bug-busters-sg`
- Description: `Security group for Bug Busters EC2 instance`
- VPC: leave the default VPC selected

**Step 2 — Add inbound rules**

Under *Inbound rules*, click **Add rule** for each of the following:

**Rule 1 — SSH (Requirement 2.1)**
- Type: `SSH`
- Protocol: `TCP`
- Port range: `22`
- Source: `My IP` (the console fills in your current public IP automatically)

> Do not set the source to `0.0.0.0/0`. SSH must be restricted to the operator's IP only.

**Rule 2 — HTTP (Requirement 2.2)**
- Type: `HTTP`
- Protocol: `TCP`
- Port range: `80`
- Source: `Anywhere-IPv4` (`0.0.0.0/0`)

**Rule 3 — HTTPS, optional (Requirement 2.3)**

Only add this rule if you plan to enable HTTPS with Let's Encrypt later.

- Type: `HTTPS`
- Protocol: `TCP`
- Port range: `443`
- Source: `Anywhere-IPv4` (`0.0.0.0/0`)

**Step 3 — Verify outbound rules (Requirement 2.4)**

The default outbound rule allows all traffic to `0.0.0.0/0`. Leave it as-is — this allows the instance to reach package repositories (`dnf update`, `dnf install`) and CDN endpoints during provisioning.

**Step 4 — Create**

Click **Create security group** and note the security group ID (e.g. `sg-0abc123def456789`). You will need it when launching the EC2 instance.

---

### AWS CLI (alternative)

The commands below create the same security group and rules. Replace `<YOUR_IP>` with your actual public IP address (e.g. `203.0.113.42`).

```bash
# Create the security group
SG_ID=$(aws ec2 create-security-group \
  --group-name bug-busters-sg \
  --description "Security group for Bug Busters EC2 instance" \
  --query GroupId \
  --output text)

echo "Security group created: $SG_ID"

# Rule 1 — SSH from operator IP only (Requirement 2.1)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 22 \
  --cidr <YOUR_IP>/32

# Rule 2 — HTTP from anywhere (Requirement 2.2)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Rule 3 — HTTPS from anywhere, optional (Requirement 2.3)
# Only run this if you plan to enable HTTPS later.
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

The default outbound rule (all traffic to `0.0.0.0/0`) is created automatically when the security group is created — no additional command is needed (Requirement 2.4).

Verify the rules were applied correctly:

```bash
aws ec2 describe-security-groups \
  --group-ids "$SG_ID" \
  --query "SecurityGroups[0].IpPermissions"
```

Use `$SG_ID` as the `--security-group-ids` value when launching the EC2 instance (see [EC2 Provisioning](#ec2-provisioning) above).

---

## Smoke Tests

Run these checks via SSH immediately after `deploy.sh` completes to confirm the server is in the expected state.

```bash
EC2_IP="<your-ec2-public-ip>"
```

### 1. nginx is active (Requirement 3.7)

```bash
ssh ec2-user@$EC2_IP "systemctl is-active nginx"
# Expected: active
```

### 2. nginx is enabled on boot (Requirement 3.8)

```bash
ssh ec2-user@$EC2_IP "systemctl is-enabled nginx"
# Expected: enabled
```

### 3. Game files are present (Requirement 4.1)

```bash
ssh ec2-user@$EC2_IP "ls /var/www/bug-busters/{index.html,favicon.ico,assets,src}"
# Expected: all four paths listed without error
```

### 4. Dev files are excluded (Requirement 4.5)

```bash
ssh ec2-user@$EC2_IP "test ! -d /var/www/bug-busters/tests && echo 'OK: tests/ excluded'"
# Expected: OK: tests/ excluded
```

### 5. File ownership and permissions (Requirements 4.3, 4.4)

```bash
ssh ec2-user@$EC2_IP "stat -c '%U %a' /var/www/bug-busters/index.html"
# Expected: nginx 644
```

---

## Integration Tests

Run these checks from your local machine after the smoke tests pass. They verify HTTP behavior end-to-end.

```bash
EC2_IP="<your-ec2-public-ip>"
```

### 1. Root path returns HTTP 200 (Requirement 5.1)

```bash
curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/
# Expected: 200
```

### 2. JS files served as application/javascript (Requirement 5.2)

```bash
curl -s -I http://$EC2_IP/src/config/constants.js | grep -i content-type
# Expected: content-type: application/javascript
```

### 3. JSON tilemaps served as application/json (Requirement 5.3)

```bash
curl -s -I http://$EC2_IP/assets/tilemaps/circuit_1.json | grep -i content-type
# Expected: content-type: application/json
```

### 4. PNG sprites served as image/png (Requirement 5.3)

```bash
curl -s -I http://$EC2_IP/assets/sprites/kiro.png | grep -i content-type
# Expected: content-type: image/png
```

### 5. MP3 audio served as audio/mpeg (Requirement 5.3)

```bash
curl -s -I http://$EC2_IP/assets/audio/loop.mp3 | grep -i content-type
# Expected: content-type: audio/mpeg
```

### 6. Nonexistent path returns HTTP 404 (Requirement 5.5)

```bash
curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP/nonexistent.html
# Expected: 404
```

### 7. Idempotency — second run completes without error (Requirement 7.4)

Upload the script to the instance if it is not already there, then run it a second time:

```bash
scp -i /path/to/your-key.pem scripts/deploy.sh ec2-user@$EC2_IP:/tmp/deploy.sh
ssh ec2-user@$EC2_IP "bash /tmp/deploy.sh && echo 'Second run: OK'"
# Expected: script completes and prints "Second run: OK"
```

---

## HTTPS Setup (Optional)

HTTPS requires a registered domain name. Complete the base HTTP deployment and verify it works before proceeding.

### Prerequisites checklist

Before running Certbot, confirm all three conditions are met:

- [ ] DNS A record for your domain points to the EC2 public IP (verify with `dig your-domain.com`)
- [ ] Port 443 is open in the Security Group (see [Security Group Configuration](#security-group-configuration), Requirement 2.3)
- [ ] nginx is running and serving HTTP on port 80 (confirmed by the integration tests above)

### Install Certbot (Requirement 6.1)

```bash
ssh ec2-user@$EC2_IP
sudo dnf install -y certbot python3-certbot-nginx
```

### Obtain and install the certificate (Requirement 6.2)

Replace `your-domain.com` with your actual domain. Add `-d www.your-domain.com` if you also want to cover the `www` subdomain.

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically modify the nginx server block to add `listen 443 ssl` with the certificate paths and insert a redirect from port 80 to 443 (Requirement 6.3).

### Verify automatic renewal (Requirement 6.4)

```bash
systemctl status certbot-renew.timer
# Expected: active (waiting) — the timer runs twice daily and renews certificates expiring within 30 days
```

### HTTPS integration tests

Run these from your local machine after Certbot completes.

**HTTP redirects to HTTPS (Requirement 6.3)**

```bash
DOMAIN="your-domain.com"
curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/
# Expected: 301
```

**HTTPS returns HTTP 200 (Requirements 6.2, 6.5)**

```bash
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/
# Expected: 200
```
