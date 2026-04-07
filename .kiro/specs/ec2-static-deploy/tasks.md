# Implementation Plan: ec2-static-deploy

## Overview

All deliverables are shell scripts, nginx config files, and documentation. There is no application code. Tasks are ordered so each step builds on the previous one: local verification → AWS provisioning docs → deploy script → nginx config → smoke/integration tests → optional HTTPS.

## Tasks

- [x] 1. Document local pre-deployment verification
  - Add a `## Pre-Deployment Verification` section to `README.md` (or a new `docs/deploy.md`) with the `npx serve .` baseline check
  - Include browser checks: no console errors, `.js` served as `application/javascript`, `.json` served as `application/json`
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Document EC2 instance provisioning steps
  - Add a `## EC2 Provisioning` section documenting the AWS Console steps (AMI: Amazon Linux 2023, instance type: t2.micro, key pair attachment, public IP assignment)
  - Include equivalent AWS CLI commands as an alternative
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Document Security Group configuration
  - Add a `## Security Group Setup` section with the required inbound rules: port 22 from operator IP, port 80 from 0.0.0.0/0, port 443 from 0.0.0.0/0 (HTTPS only)
  - Include the outbound rule: all traffic allowed
  - Include AWS Console steps and equivalent AWS CLI commands
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create the nginx server block configuration file
  - Create `scripts/bug-busters.nginx.conf` with the server block that listens on port 80, sets root to `/var/www/bug-busters`, sets `index index.html`, and includes the explicit `types {}` block mapping `.js` → `application/javascript`, `.json` → `application/json`, `.png`, `.mp3`, `.ico`, `.css`, `.html`
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Create the deploy.sh script
  - [x] 5.1 Create `scripts/deploy.sh` with `#!/bin/bash` and `set -euo pipefail`
    - Define `REPO_URL`, `DEPLOY_DIR`, `NGINX_CONF` variables at the top
    - Add a `log()` helper that prefixes output with a timestamp
    - _Requirements: 7.1, 7.5, 7.6_
  - [x] 5.2 Add system update and package installation steps
    - Step 1: `dnf update -y`
    - Step 2: `dnf install -y nginx git`
    - _Requirements: 3.1, 7.2_
  - [x] 5.3 Add game file deployment step (clone or pull)
    - Step 3: if `$DEPLOY_DIR/.git` exists run `git pull`, otherwise `git clone`
    - Step 4: remove dev-only files (`tests/`, `node_modules/`, `jest.config.js`, `babel.config.js`, `package.json`, `package-lock.json`, `logs/`, `.kiro/`)
    - _Requirements: 4.1, 4.2, 4.5, 7.2_
  - [x] 5.4 Add file permissions step
    - Step 5: `chown -R nginx:nginx $DEPLOY_DIR`, `find` directories → `chmod 755`, files → `chmod 644`
    - _Requirements: 4.3, 4.4_
  - [x] 5.5 Add nginx configuration write and service start steps
    - Step 6: write the server block heredoc to `$NGINX_CONF`
    - Step 7: run `nginx -t`, then `systemctl enable nginx && systemctl restart nginx`
    - Print the public IP via the EC2 metadata endpoint as the final log line
    - _Requirements: 3.2, 3.5, 3.6, 3.7, 3.8, 7.2, 7.3_
  - [x] 5.6 Make the script executable and verify idempotency
    - Add `chmod +x scripts/deploy.sh` instruction to the docs
    - Confirm the clone-or-pull guard and `dnf install -y` make the script safe to run twice
    - _Requirements: 7.4_

- [x] 6. Checkpoint — review script and config before testing
  - Ensure `scripts/deploy.sh` passes `bash -n scripts/deploy.sh` (syntax check)
  - Ensure `scripts/bug-busters.nginx.conf` is valid nginx syntax (reviewable offline)
  - Ask the user if any adjustments are needed before proceeding to test commands

- [x] 7. Document post-deployment smoke test commands
  - Add a `## Smoke Tests` section with the SSH-based checks: `systemctl is-active nginx`, `systemctl is-enabled nginx`, file presence check, dev-file exclusion check, and permissions check
  - _Requirements: 3.7, 3.8, 4.3, 4.4, 4.5_

- [x] 8. Document post-deployment integration test commands
  - Add a `## Integration Tests` section with the `curl` checks: HTTP 200 on `/`, `Content-Type: application/javascript` for a `.js` file, `Content-Type: application/json` for a tilemap, `Content-Type: image/png` for a sprite, `Content-Type: audio/mpeg` for an MP3, HTTP 404 for a nonexistent path, and idempotency re-run check
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 7.4_

- [x] 9. Document optional HTTPS setup
  - Add a `## HTTPS Setup (Optional)` section with the Certbot install and `certbot --nginx` commands, the prerequisites checklist (DNS A record, port 443 open, nginx running on port 80), and the `certbot-renew.timer` verification step
  - Include the optional HTTPS integration tests: HTTP 301 redirect check and HTTPS 200 check
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 2.3_

- [x] 10. Final checkpoint — all artifacts complete
  - Ensure `scripts/deploy.sh` exists and is syntactically valid
  - Ensure `scripts/bug-busters.nginx.conf` exists
  - Ensure deployment documentation covers all provisioning, security group, smoke test, integration test, and HTTPS steps
  - Ask the user if questions arise before closing out

## Notes

- No property-based tests apply — this is infrastructure automation with no pure functions
- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All documentation tasks (1, 2, 3, 7, 8, 9) can target either `README.md` or a dedicated `docs/deploy.md` — operator's choice
- The deploy script is designed to work both as an SSH-run script and as EC2 user-data
