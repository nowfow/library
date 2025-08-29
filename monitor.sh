#!/bin/bash

# Music Library - Server Monitoring and Health Check Script
# Ubuntu 22.04 Server Optimized

set -euo pipefail

# Colors
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
ALERT_EMAIL=""  # Set email for alerts
SLACK_WEBHOOK=""  # Set Slack webhook for alerts

# Health check functions
check_system_resources() {
    log_header "System Resources"
    
    # Memory usage
    local mem_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    echo "💾 Memory Usage: ${mem_usage}%"
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        log_warning "High memory usage: ${mem_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "💿 Disk Usage: ${disk_usage}%"
    if (( disk_usage > 80 )); then
        log_warning "High disk usage: ${disk_usage}%"
    fi
    
    # CPU load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    echo "🏃 Load Average: ${load_avg}"
    
    # System uptime
    echo "⏰ Uptime: $(uptime -p)"
}

check_docker_health() {
    log_header "Docker Health"
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon not running"
        return 1
    fi
    
    # Container status
    echo ""
    echo "Container Status:"
    docker compose ps --format "table {{.Name}}\\t{{.Status}}\\t{{.Ports}}"
    
    echo ""
    echo "Container Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.MemPerc}}"
    
    # Check for unhealthy containers
    local unhealthy=$(docker compose ps --filter "health=unhealthy" --format "{{.Name}}")
    if [ -n "$unhealthy" ]; then
        log_error "Unhealthy containers detected: $unhealthy"
        return 1
    fi
    
    log_success "All containers healthy"
}

check_services() {
    log_header "Service Health Checks"
    
    # Backend health check
    if curl -sf http://localhost:3000/health >/dev/null; then
        log_success "Backend API: OK"
    else
        log_error "Backend API: Failed"
    fi
    
    # Frontend health check
    if curl -sf http://localhost/health >/dev/null; then
        log_success "Frontend: OK"
    else
        log_error "Frontend: Failed"
    fi
    
    # Database connectivity (via backend)
    local db_status=$(curl -sf http://localhost:3000/api/terms | jq length 2>/dev/null || echo "error")
    if [ "$db_status" != "error" ]; then
        log_success "Database: OK ($db_status terms)"
    else
        log_error "Database: Connection failed"
    fi
}

check_logs() {
    log_header "Recent Errors in Logs"
    
    # Check for recent errors in container logs
    local services=("backend" "frontend" "telegram-bot")
    local error_count=0
    
    for service in "${services[@]}"; do
        local errors=$(docker compose logs --since=1h "$service" 2>/dev/null | grep -i error | wc -l)
        if (( errors > 0 )); then
            echo "🔍 $service: $errors errors in last hour"
            ((error_count++))
        fi
    done
    
    if (( error_count == 0 )); then
        log_success "No recent errors found"
    else
        log_warning "$error_count services have errors"
    fi
}

check_security() {
    log_header "Security Status"
    
    # Check fail2ban status
    if systemctl is-active --quiet fail2ban; then
        local banned=$(fail2ban-client status | grep "Number of jail" | awk '{print $NF}')
        echo "🛡️  Fail2ban: Active ($banned jails)"
    else
        log_warning "Fail2ban not running"
    fi
    
    # Check firewall status
    if ufw status | grep -q "Status: active"; then
        echo "🔥 UFW Firewall: Active"
    else
        log_warning "UFW Firewall: Inactive"
    fi
    
    # Check for security updates
    local security_updates=$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")
    if (( security_updates > 0 )); then
        log_warning "$security_updates security updates available"
    else
        echo "🔒 Security updates: Up to date"
    fi
}

check_backups() {
    log_header "Backup Status"
    
    local backup_dir="/opt/music-library-backups"
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(find "$backup_dir" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
        if [ -n "$latest_backup" ]; then
            local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 86400 ))
            echo "💾 Latest backup: $(basename "$latest_backup") (${backup_age} days old)"
            if (( backup_age > 3 )); then
                log_warning "Backup is older than 3 days"
            fi
        else
            log_warning "No backups found"
        fi
    else
        log_warning "Backup directory not found"
    fi
}

send_alert() {
    local message="$1"
    
    # Email alert
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Music Library Alert" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Slack alert
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🎵 Music Library Alert: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

generate_report() {
    log_header "Health Check Report"
    echo "Generated: $(date)"
    echo "Server: $(hostname)"
    echo "==============================================="
    
    check_system_resources
    echo ""
    check_docker_health
    echo ""
    check_services
    echo ""
    check_logs
    echo ""
    check_security
    echo ""
    check_backups
    
    echo ""
    echo "==============================================="
    echo "Report completed: $(date)"
}

# Main function
main() {
    case "${1:-report}" in
        report)
            generate_report
            ;;
        monitor)
            # Continuous monitoring mode
            while true; do
                clear
                generate_report
                sleep 30
            done
            ;;
        quick)
            check_services
            ;;
        resources)
            check_system_resources
            ;;
        docker)
            check_docker_health
            ;;
        security)
            check_security
            ;;
        alert-test)
            send_alert "Test alert from Music Library monitoring"
            log_success "Test alert sent"
            ;;
        *)
            echo "Usage: $0 {report|monitor|quick|resources|docker|security|alert-test}"
            echo ""
            echo "Commands:"
            echo "  report      - Full health check report (default)"
            echo "  monitor     - Continuous monitoring (refresh every 30s)"
            echo "  quick       - Quick service check"
            echo "  resources   - System resource check"
            echo "  docker      - Docker health check"
            echo "  security    - Security status check"
            echo "  alert-test  - Test alert notifications"
            exit 1
            ;;
    esac
}

main "$@"