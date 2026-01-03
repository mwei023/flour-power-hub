# Production Deployment Guide

This guide provides comprehensive instructions for deploying the Posho Mill Tracker application to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment Options](#cloud-deployment-options)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose
- PostgreSQL 14+ database
- SSL certificates for HTTPS
- Domain name configured

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=3001
API_URL=https://your-domain.com

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=poshomill
DB_USER=poshomill_user
DB_PASSWORD=your-secure-password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_SIZE_LIMIT=10mb

# Logging
LOG_LEVEL=info
ENABLE_AUDIT_LOGGING=true

# Backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE poshomill;
CREATE USER poshomill_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE poshomill TO poshomill_user;

# Set proper permissions
\c poshomill
GRANT ALL ON SCHEMA public TO poshomill_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO poshomill_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO poshomill_user;
```

### 2. Run Migrations

```bash
# Using Docker
docker exec -it poshomill-backend npm run db:migrate

# Or directly with Node.js
npm run db:migrate
```

### 3. Create Initial Admin User

```bash
# Create admin user via API
curl -X POST https://your-domain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-admin-password",
    "role": "admin"
  }'
```

## Docker Deployment

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: poshomill
      POSTGRES_USER: poshomill_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - poshomill-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - poshomill-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=poshomill
      - DB_USER=poshomill_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - poshomill-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - poshomill-network

volumes:
  postgres_data:

networks:
  poshomill-network:
    driver: bridge
```

### 2. Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale backend if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## Cloud Deployment Options

### Option 1: AWS ECS with Fargate

1. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name poshomill-cluster
```

2. **Push images to ECR**
```bash
# Build and push backend image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

docker build -f backend/Dockerfile.production -t poshomill-backend .
docker tag poshomill-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/poshomill-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/poshomill-backend:latest
```

3. **Deploy using CloudFormation**
- Use the provided CloudFormation template
- Configure auto-scaling
- Set up load balancer with SSL

### Option 2: Google Cloud Run

1. **Build and deploy**
```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/poshomill-backend backend/

# Deploy to Cloud Run
gcloud run deploy poshomill-backend \
  --image gcr.io/PROJECT-ID/poshomill-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,DB_HOST=YOUR_DB_HOST
```

### Option 3: DigitalOcean App Platform

1. **Create app spec**
```yaml
name: poshomill
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/poshomill
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${db.DATABASE_HOST}
  - key: DB_NAME
    value: ${db.DATABASE}
  - key: DB_USER
    value: ${db.USERNAME}
  - key: DB_PASSWORD
    value: ${db.PASSWORD}
```

## Monitoring & Logging

### 1. Application Monitoring

Add to your monitoring solution:

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  });
});
```

### 2. Logging Configuration

```typescript
// production logger setup
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 3. Metrics Collection

```typescript
// Basic metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    databaseConnections: db.pool.numConnections(),
    timestamp: new Date().toISOString()
  });
});
```

## Security Checklist

### Pre-deployment Security

- [ ] **Environment Variables**: All secrets properly configured
- [ ] **Database**: SSL enabled, proper user permissions
- [ ] **HTTPS**: SSL certificates installed and configured
- [ ] **Rate Limiting**: Configured for all endpoints
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **JWT Security**: Secure secret key, proper expiration
- [ ] **CORS**: Properly configured for production domain
- [ ] **Headers**: Security headers configured (helmet.js)
- [ ] **Dependencies**: Security audit passed (`npm audit`)
- [ ] **Logs**: Sensitive data not logged

### Runtime Security

- [ ] **Firewall**: Only necessary ports open
- [ ] **Monitoring**: Security events monitored
- [ ] **Backups**: Automated and tested
- [ ] **Updates**: Regular security updates scheduled
- [ ] **Access Control**: Principle of least privilege
- [ ] **Network**: VPC/private networks where applicable

### Compliance

- [ ] **Data Protection**: GDPR/privacy compliance
- [ ] **Audit Logging**: All actions logged
- [ ] **Access Logs**: Retained per policy
- [ ] **Incident Response**: Plan documented

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
```bash
# Check database connectivity
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Check database logs
docker logs postgres-container
```

2. **Memory Issues**
```bash
# Monitor memory usage
docker stats

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
```

3. **SSL Certificate Issues**
```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"
```

4. **Performance Issues**
```bash
# Check slow queries
psql -d poshomill -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Log Analysis

```bash
# View application logs
docker logs -f poshomill-backend

# Check Nginx logs
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log

# Monitor database logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Emergency Procedures

1. **Rollback Deployment**
```bash
# Docker rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale backend=1

# Database rollback
npm run db:migrate:rollback
```

2. **Database Recovery**
```bash
# Restore from backup
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d poshomill backup.sql
```

3. **High Load Response**
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=5

# Enable maintenance mode
echo "maintenance" > maintenance.flag
```

## Maintenance

### Regular Tasks

- **Weekly**: Review security logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: SSL certificate renewal

### Backup Strategy

```bash
#!/bin/bash
# Automated backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="poshomill_backup_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/
rm $BACKUP_FILE

# Cleanup old backups
find /backups -name "*.sql" -mtime +30 -delete
```

---

For additional support, refer to the project documentation or contact the development team.
