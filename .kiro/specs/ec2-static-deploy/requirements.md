# Requirements Document

## Introduction

This feature covers the deployment of Bug Busters — a pure static web game — to an AWS EC2 Free Tier instance using nginx as the static file server. The game consists of `index.html`, `assets/`, and `src/` (ES6 modules loaded natively by the browser). Phaser 3 and Google Fonts are loaded from CDN by the client; the server only needs to serve static files. The deployment must be repeatable and the game must be accessible via the EC2 public IP or a custom domain.

**Local development server:** The operator runs Bug Busters locally using `npx serve .`, which correctly serves ES6 modules with the right MIME types — notably `application/javascript` for `.js` files and `application/json` for `.json` files. The nginx configuration on EC2 must replicate this MIME type behavior exactly. Before deploying to EC2, the operator should verify the game works locally with `npx serve .` as a baseline check to confirm the static files are correct and the game is functional.

## Glossary

- **EC2_Instance**: An AWS EC2 virtual machine running Amazon Linux 2023 on a Free Tier eligible instance type (t2.micro or t3.micro).
- **nginx**: The web server installed on the EC2_Instance to serve static files over HTTP/HTTPS.
- **Security_Group**: The AWS firewall rules attached to the EC2_Instance controlling inbound and outbound traffic.
- **Game_Files**: The static assets of Bug Busters — `index.html`, `favicon.ico`, `assets/`, and `src/` — that nginx serves to clients.
- **Deploy_Script**: A shell script (or EC2 user-data script) that automates the full provisioning and deployment process.
- **Certbot**: The Let's Encrypt client used to obtain and install a TLS certificate on the EC2_Instance.
- **Key_Pair**: The SSH key pair used to authenticate connections to the EC2_Instance.

---

## Requirements

### Requirement 1: EC2 Instance Provisioning

**User Story:** As a developer, I want to provision a Free Tier eligible EC2 instance, so that I have a server to host the game without incurring costs.

#### Acceptance Criteria

1. THE EC2_Instance SHALL use Amazon Linux 2023 as its AMI.
2. THE EC2_Instance SHALL use a t2.micro or t3.micro instance type to remain within AWS Free Tier limits.
3. THE EC2_Instance SHALL be launched with a Key_Pair to allow SSH access.
4. THE EC2_Instance SHALL be assigned a public IP address so the game is reachable from the internet.
5. WHEN the EC2_Instance is launched, THE EC2_Instance SHALL have the Security_Group attached before accepting inbound traffic.

---

### Requirement 2: Security Group Configuration

**User Story:** As a developer, I want the correct firewall rules configured, so that the game is publicly accessible while SSH access remains controlled.

#### Acceptance Criteria

1. THE Security_Group SHALL allow inbound TCP traffic on port 22 (SSH) from the operator's IP address.
2. THE Security_Group SHALL allow inbound TCP traffic on port 80 (HTTP) from any IP address (0.0.0.0/0).
3. WHERE HTTPS is enabled, THE Security_Group SHALL allow inbound TCP traffic on port 443 from any IP address (0.0.0.0/0).
4. THE Security_Group SHALL allow all outbound traffic so the EC2_Instance can reach package repositories and CDN endpoints.
5. IF a port not listed in acceptance criteria 1–3 receives an inbound connection attempt, THEN THE Security_Group SHALL drop the connection.

---

### Requirement 3: nginx Installation and Configuration

**User Story:** As a developer, I want nginx installed and configured to serve the game's static files, so that players can load the game in a browser.

#### Acceptance Criteria

1. WHEN the EC2_Instance is provisioned, THE Deploy_Script SHALL install nginx via the system package manager (`dnf`).
2. THE nginx SHALL be configured with a `server` block that listens on port 80.
3. THE nginx `root` directive SHALL point to the directory containing the Game_Files (e.g., `/var/www/bug-busters`).
4. THE nginx `index` directive SHALL specify `index.html` as the default document.
5. THE nginx configuration SHALL set the `Content-Type` header to `application/javascript` for files with the `.js` extension so that ES6 modules load without MIME type errors — replicating the behavior of `npx serve .`, which serves `.js` files with `application/javascript` automatically.
6. THE nginx configuration SHALL set the `Content-Type` header to `application/json` for files with the `.json` extension so that tilemap files load correctly — replicating the behavior of `npx serve .`, which serves `.json` files with `application/json` automatically.
7. WHEN nginx starts, THE nginx SHALL serve `index.html` at the server root path (`/`).
8. WHEN the EC2_Instance reboots, THE nginx SHALL restart automatically via the system service manager (`systemctl enable nginx`).

---

### Requirement 4: Game File Deployment

**User Story:** As a developer, I want the game files transferred to the server, so that nginx can serve them to players.

#### Acceptance Criteria

1. THE Deploy_Script SHALL copy the Game_Files (`index.html`, `favicon.ico`, `assets/`, `src/`) to the nginx root directory on the EC2_Instance.
2. THE Deploy_Script SHALL support at least one of the following transfer methods: `git clone` from the repository or `rsync`/`scp` from the developer's machine.
3. WHEN Game_Files are placed in the nginx root directory, THE Deploy_Script SHALL set file ownership to the `nginx` user so nginx can read them.
4. WHEN Game_Files are placed in the nginx root directory, THE Deploy_Script SHALL set directory permissions to `755` and file permissions to `644`.
5. THE Deploy_Script SHALL exclude test files (`tests/`, `jest.config.js`, `babel.config.js`, `package.json`, `package-lock.json`, `node_modules/`) from the nginx root directory, as they are not required to serve the game.

---

### Requirement 5: Game Accessibility Verification

**User Story:** As a player, I want to open the game in a browser using the server's public IP or domain, so that I can play Bug Busters without any local setup.

#### Acceptance Criteria

1. WHEN a browser sends an HTTP GET request to `http://<EC2_public_IP>/`, THE nginx SHALL respond with `index.html` and HTTP status 200.
2. WHEN a browser loads `index.html`, THE nginx SHALL serve all referenced `src/**/*.js` files with the correct `Content-Type: application/javascript` header.
3. WHEN a browser loads `index.html`, THE nginx SHALL serve all files under `assets/` (PNG, MP3, JSON) with appropriate MIME types.
4. WHEN a browser loads the game, THE nginx SHALL not block outbound CDN requests — Phaser 3 (`cdn.jsdelivr.net`) and Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) are loaded by the client's browser, not the server.
5. IF a requested file does not exist on the server, THEN THE nginx SHALL return HTTP status 404.

---

### Requirement 6: HTTPS Setup with Let's Encrypt (Optional)

**User Story:** As a developer, I want to optionally enable HTTPS using Let's Encrypt, so that the game is served over a secure connection when a domain name is available.

#### Acceptance Criteria

1. WHERE HTTPS is enabled, THE Deploy_Script SHALL install Certbot and the nginx plugin via the system package manager.
2. WHERE HTTPS is enabled, THE Deploy_Script SHALL obtain a TLS certificate from Let's Encrypt for the configured domain name using the `certbot --nginx` command.
3. WHERE HTTPS is enabled, THE nginx SHALL redirect all HTTP requests on port 80 to HTTPS on port 443.
4. WHERE HTTPS is enabled, THE Certbot SHALL configure automatic certificate renewal via a system timer or cron job so the certificate does not expire.
5. WHERE HTTPS is enabled, THE EC2_Instance SHALL have a DNS A record pointing the domain name to the EC2_Instance's public IP address before Certbot runs.

---

### Requirement 7: Repeatable Deployment Script

**User Story:** As a developer, I want a single script that automates the full setup, so that I can reproduce the deployment on a new instance without manual steps.

#### Acceptance Criteria

1. THE Deploy_Script SHALL be executable as an EC2 user-data script on first boot or as a standalone shell script run via SSH.
2. THE Deploy_Script SHALL perform all steps in the following order: system update, nginx installation, Game_Files transfer, nginx configuration, and nginx service start.
3. WHEN the Deploy_Script completes without errors, THE EC2_Instance SHALL be serving the game on port 80 and a browser request to `http://<EC2_public_IP>/` SHALL return HTTP status 200.
4. WHEN the Deploy_Script is run a second time on the same instance, THE Deploy_Script SHALL complete without error (idempotent behavior — reinstalling nginx and overwriting files must not cause failures).
5. THE Deploy_Script SHALL log each major step to standard output so the operator can verify progress.
6. IF any step in the Deploy_Script fails, THEN THE Deploy_Script SHALL exit immediately with a non-zero exit code so the operator is alerted to the failure.

---

### Requirement 8: Local Pre-Deployment Verification

**User Story:** As an operator, I want to verify the game works locally before deploying to EC2, so that I can confirm the static files are correct and catch issues before they reach the server.

#### Acceptance Criteria

1. BEFORE deploying Game_Files to the EC2_Instance, THE operator SHALL verify the game loads and runs correctly using `npx serve .` from the project root directory.
2. WHEN `npx serve .` is running, THE local server SHALL serve `.js` files with `Content-Type: application/javascript` and `.json` files with `Content-Type: application/json`, confirming the baseline MIME type behavior that nginx must replicate.
3. IF the game does not load correctly under `npx serve .`, THEN THE operator SHALL resolve the issue locally before proceeding with EC2 deployment.
