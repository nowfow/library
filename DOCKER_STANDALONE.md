# Docker Standalone Usage Examples

This file contains examples of how to use the `docker-standalone.sh` script for running the Music Library project without Docker Compose.

## Prerequisites

1. Make sure Docker is installed and running
2. Create `.env` file from template:
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration
   ```
3. Make the script executable:
   ```bash
   chmod +x docker-standalone.sh
   ```

## Basic Usage

### Start all services
```bash
./docker-standalone.sh start
```
This will:
- Build all Docker images
- Create a custom Docker network
- Start backend, frontend, and telegram bot containers
- Show service status

### Check service status
```bash
./docker-standalone.sh status
```

### View logs
```bash
# Backend logs
./docker-standalone.sh logs backend

# Frontend logs
./docker-standalone.sh logs frontend

# Telegram bot logs
./docker-standalone.sh logs bot
```

### Stop services
```bash
./docker-standalone.sh stop
```

### Restart services
```bash
./docker-standalone.sh restart
```

### Clean up
```bash
# Remove containers and network
./docker-standalone.sh cleanup

# Remove containers, network, and images
./docker-standalone.sh cleanup --remove-images
```

## Advanced Usage

### Build images only
```bash
./docker-standalone.sh build
```

### Manual container management
```bash
# Start individual services
docker run -d --name music-library-backend --network music-library-network -p 3000:3000 music-library/backend:latest

# Stop specific container
docker stop music-library-backend

# Remove specific container
docker rm music-library-backend
```

## Comparison with Docker Compose

| Feature | Docker Compose | Docker Standalone |
|---------|----------------|-------------------|
| Setup complexity | Simple | Moderate |
| Configuration | docker-compose.yml | Script + environment |
| Service orchestration | Built-in | Manual via script |
| Networking | Automatic | Custom network creation |
| Health checks | Built-in | Manual implementation |
| Resource limits | Declarative | Script-based |
| Scaling | Easy | Manual |
| Development workflow | Excellent | Good |

## When to use Docker Standalone

- When Docker Compose is not available
- For custom deployment scenarios
- When you need fine-grained control over container creation
- In environments with specific networking requirements
- For learning Docker fundamentals

## Troubleshooting

### Port conflicts
If you get port conflicts, check what's using the ports:
```bash
sudo lsof -i :3000
sudo lsof -i :80
```

### Container issues
Check container logs:
```bash
docker logs music-library-backend
docker logs music-library-frontend
docker logs music-library-telegram-bot
```

### Network issues
List Docker networks:
```bash
docker network ls
docker network inspect music-library-network
```

### Clean start
For a completely clean start:
```bash
./docker-standalone.sh cleanup --remove-images
./docker-standalone.sh start
```