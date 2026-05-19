#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  generate-ssh-key.sh
#
#  Run this ONCE on your LOCAL machine to:
#  1. Generate a new SSH key pair
#  2. Copy public key to EC2
#  3. Show you what to paste into GitHub Secrets
#
#  Usage:
#    chmod +x scripts/generate-ssh-key.sh
#    ./scripts/generate-ssh-key.sh <EC2_IP> <EC2_USER>
#
#  Example:
#    ./scripts/generate-ssh-key.sh 54.123.45.67 ubuntu
# ═══════════════════════════════════════════════════════════════

set -e

EC2_IP="${1:-YOUR_EC2_IP}"
EC2_USER="${2:-ubuntu}"
KEY_NAME="localconnect-github-actions"

echo "============================================"
echo "  Generating SSH Key for GitHub Actions"
echo "============================================"

# Step 1 — Generate SSH key pair
echo ""
echo ">>> Step 1: Generating SSH key pair..."
ssh-keygen -t ed25519 \
  -C "github-actions-localconnect" \
  -f ~/.ssh/${KEY_NAME} \
  -N ""   # no passphrase (required for automation)

echo "✅ Key generated:"
echo "   Private key: ~/.ssh/${KEY_NAME}"
echo "   Public key:  ~/.ssh/${KEY_NAME}.pub"

# Step 2 — Copy public key to EC2
echo ""
echo ">>> Step 2: Copying public key to EC2..."
echo "    You will be asked for your EC2 password or existing key"
ssh-copy-id -i ~/.ssh/${KEY_NAME}.pub ${EC2_USER}@${EC2_IP}
echo "✅ Public key copied to EC2"

# Step 3 — Test connection
echo ""
echo ">>> Step 3: Testing SSH connection..."
ssh -i ~/.ssh/${KEY_NAME} \
    -o StrictHostKeyChecking=no \
    ${EC2_USER}@${EC2_IP} "echo '✅ SSH connection works!'"

# Step 4 — Show GitHub Secrets to add
echo ""
echo "============================================"
echo "  ADD THESE TO GITHUB SECRETS"
echo "  Repo → Settings → Secrets → Actions"
echo "============================================"
echo ""
echo "Secret Name: EC2_HOST"
echo "Secret Value:"
echo "${EC2_IP}"
echo ""
echo "Secret Name: EC2_USER"
echo "Secret Value:"
echo "${EC2_USER}"
echo ""
echo "Secret Name: EC2_SSH_KEY"
echo "Secret Value (copy everything including BEGIN/END lines):"
echo "──────────────────────────────────────────"
cat ~/.ssh/${KEY_NAME}
echo "──────────────────────────────────────────"
echo ""
echo "Secret Name: DOCKERHUB_USERNAME"
echo "Secret Value: pratik6958"
echo ""
echo "Secret Name: DOCKERHUB_TOKEN"
echo "Secret Value: <get from hub.docker.com → Account Settings → Security → New Token>"
echo ""
echo "============================================"
echo "  Done! Now add the secrets above to GitHub"
echo "============================================"
