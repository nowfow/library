#!/bin/bash

# Music Library - Ubuntu 22.04 Server Deployment Script
# Automated deployment and maintenance for production server

set -euo pipefail

# Colors and logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🎵 $1${NC}"; }

# Configuration
PROJECT_DIR="/opt/music-library"
BACKUP_DIR="/opt/music-library-backups"
LOG_FILE="/var/log/music-library-deploy.log"
USER="music-library"

# Functions
install_dependencies() {
    log_header "Installing System Dependencies"
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install Docker and dependencies
    sudo apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        ufw \
        fail2ban \
        logrotate \
        htop \
        ncdu \
        git
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log_success "Dependencies installed"
}

setup_user() {
    log_header "Setting Up User Environment"
    
    # Create user if not exists
    if ! id "$USER" &>/dev/null; then
        sudo adduser --system --group --home /home/$USER $USER
        sudo usermod -aG docker $USER
    fi
    
    # Create directories
    sudo mkdir -p $PROJECT_DIR $BACKUP_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR $BACKUP_DIR
    
    log_success "User environment ready"
}

configure_firewall() {
    log_header "Configuring Firewall"
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP/HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow backend API (if external access needed)
    # sudo ufw allow 3000/tcp
    
    log_success "Firewall configured"
}

configure_logging() {
    log_header "Configuring Logging"
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/music-library > /dev/null <<EOF
/var/log/music-library*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}

$PROJECT_DIR/*/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

    # Create log file
    sudo touch $LOG_FILE
    sudo chown $USER:$USER $LOG_FILE
    
    log_success "Logging configured"
}

optimize_system() {
    log_header "Optimizing System Performance"
    
    # Optimize kernel parameters for Docker
    sudo tee /etc/sysctl.d/99-music-library.conf > /dev/null <<EOF
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl = 15

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File system
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
EOF

    # Apply settings
    sudo sysctl -p /etc/sysctl.d/99-music-library.conf
    
    # Configure Docker daemon
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true
}
EOF

    sudo systemctl restart docker
    
    log_success "System optimized"
}

deploy_application() {
    log_header "Deploying Music Library"
    
    cd $PROJECT_DIR
    
    # Pull latest code (if using git)
    if [ -d ".git" ]; then
        sudo -u $USER git pull origin main
    fi
    
    # Build and start
    sudo -u $USER ./docker-manager.sh stop 2>/dev/null || true
    sudo -u $USER ./docker-manager.sh build
    sudo -u $USER ./docker-manager.sh start production
    
    log_success "Application deployed"
}

create_systemd_service() {
    log_header "Creating Systemd Service"
    
    sudo tee /etc/systemd/system/music-library.service > /dev/null <<EOF
[Unit]
Description=Music Library Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable music-library.service
    
    log_success "Systemd service created"
}

create_maintenance_scripts() {
    log_header "Creating Maintenance Scripts"
    
    # Backup script
    sudo tee /usr/local/bin/music-library-backup > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/music-library-backups"
PROJECT_DIR="/opt/music-library"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
cd $PROJECT_DIR
tar -czf "$BACKUP_DIR/music-library-$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=.git \
    .

# Keep only last 7 backups
find $BACKUP_DIR -name "music-library-*.tar.gz" -mtime +7 -delete

echo "Backup completed: music-library-$DATE.tar.gz"
EOF

    # Update script
    sudo tee /usr/local/bin/music-library-update > /dev/null <<'EOF'
#!/bin/bash
PROJECT_DIR="/opt/music-library"
USER="music-library"

cd $PROJECT_DIR

# Create backup before update
/usr/local/bin/music-library-backup

# Update application
sudo -u $USER git pull origin main
sudo -u $USER ./docker-manager.sh restart production

echo "Update completed"
EOF

    # Make scripts executable
    sudo chmod +x /usr/local/bin/music-library-*
    
    # Add cron job for automated backups
    (sudo crontab -l 2>/dev/null || true; echo "0 2 * * * /usr/local/bin/music-library-backup") | sudo crontab -
    
    log_success "Maintenance scripts created"
}

# Main function
main() {
    case "${1:-deploy}" in
        install)
            install_dependencies
            setup_user
            configure_firewall
            configure_logging
            optimize_system
            create_systemd_service
            create_maintenance_scripts
            log_success "Server setup completed!"
            ;;
        deploy)
            deploy_application
            ;;
        backup)
            /usr/local/bin/music-library-backup
            ;;
        update)
            /usr/local/bin/music-library-update
            ;;
        *)
            echo "Usage: $0 {install|deploy|backup|update}"
            echo ""
            echo "Commands:"
            echo "  install  - Full server setup and optimization"
            echo "  deploy   - Deploy/redeploy application"
            echo "  backup   - Create backup"
            echo "  update   - Update and restart application"
            exit 1
            ;;
    esac
}

# Check if running as root for install
if [[ "${1:-deploy}" == "install" && $EUID -ne 0 ]]; then
    log_error "Installation must be run as root: sudo $0 install"
    exit 1
fi

main "$@"