#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  setup-port-forward.sh
#
#  Sets up kubectl port-forward as systemd services so they
#  survive reboots and SSH disconnects.
#
#  Run this ONCE on EC2 after first deploy:
#    chmod +x scripts/setup-port-forward.sh
#    sudo ./scripts/setup-port-forward.sh ubuntu
# ═══════════════════════════════════════════════════════════════

EC2_USER="${1:-ubuntu}"
KUBE_PATH="/home/${EC2_USER}/.kube/config"

echo "============================================"
echo "  Setting up Minikube Port Forwarding"
echo "  as systemd services"
echo "============================================"

# ── Frontend Port Forward Service (30300) ──────────────────
cat > /etc/systemd/system/kube-pf-frontend.service << EOF
[Unit]
Description=Kubectl port-forward frontend → 30300
After=network.target
Wants=network.target

[Service]
User=${EC2_USER}
Environment="KUBECONFIG=${KUBE_PATH}"
ExecStart=/usr/local/bin/kubectl port-forward \
  --address 127.0.0.1 \
  svc/frontend-service 30300:80 \
  -n localconnect
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ── Backend Port Forward Service (30800) ───────────────────
cat > /etc/systemd/system/kube-pf-backend.service << EOF
[Unit]
Description=Kubectl port-forward backend → 30800
After=network.target
Wants=network.target

[Service]
User=${EC2_USER}
Environment="KUBECONFIG=${KUBE_PATH}"
ExecStart=/usr/local/bin/kubectl port-forward \
  --address 127.0.0.1 \
  svc/backend-service 30800:8000 \
  -n localconnect
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ── Prometheus Port Forward Service (30909) ────────────────
cat > /etc/systemd/system/kube-pf-prometheus.service << EOF
[Unit]
Description=Kubectl port-forward prometheus → 30909
After=network.target

[Service]
User=${EC2_USER}
Environment="KUBECONFIG=${KUBE_PATH}"
ExecStart=/usr/local/bin/kubectl port-forward \
  --address 127.0.0.1 \
  svc/prometheus-service 30909:9090 \
  -n monitoring
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ── Grafana Port Forward Service (30301) ───────────────────
cat > /etc/systemd/system/kube-pf-grafana.service << EOF
[Unit]
Description=Kubectl port-forward grafana → 30301
After=network.target

[Service]
User=${EC2_USER}
Environment="KUBECONFIG=${KUBE_PATH}"
ExecStart=/usr/local/bin/kubectl port-forward \
  --address 127.0.0.1 \
  svc/grafana-service 30301:3000 \
  -n monitoring
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start all services
echo ">>> Enabling and starting port-forward services..."
systemctl daemon-reload

for svc in kube-pf-frontend kube-pf-backend kube-pf-prometheus kube-pf-grafana; do
  systemctl enable ${svc}
  systemctl start  ${svc}
  sleep 2
  if systemctl is-active --quiet ${svc}; then
    echo "✅ ${svc} running"
  else
    echo "⚠️  ${svc} failed — check: journalctl -u ${svc}"
  fi
done

echo ""
echo "============================================"
echo "  Port Forwarding Setup Complete!"
echo ""
echo "  Frontend  → 127.0.0.1:30300"
echo "  Backend   → 127.0.0.1:30800"
echo "  Prometheus→ 127.0.0.1:30909"
echo "  Grafana   → 127.0.0.1:30301"
echo ""
echo "  Nginx routes these to public port 80"
echo "============================================"
echo ""
echo "Useful commands:"
echo "  systemctl status kube-pf-frontend"
echo "  systemctl status kube-pf-backend"
echo "  journalctl -u kube-pf-backend -f"
