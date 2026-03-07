# Production Fix TODO

## Task 1: Fix CI/CD Pipeline - Add Real Deployment Commands
- [x] 1.1 Update .github/workflows/ci-cd.yml with actual deployment
- [x] 1.2 Add SSH-based deployment to self-hosted server
- [x] 1.3 Add health check verification after deploy
- [x] 1.4 Add frontend build/deploy step

## Task 2: Enable and Fix Tests
- [x] 2.1 Uncomment test execution in CI pipeline
- [x] 2.2 Ensure test database is properly set up
- [ ] 2.3 Run tests locally to verify they pass
- [ ] 2.4 Fix any failing tests

## Task 3: Update TODO.md with Progress
- [ ] 3.1 Mark completed items in TODO.md

## Required GitHub Secrets for Deployment:
- SSH_HOST: Your server hostname/IP
- SSH_USER: Your SSH username
- SSH_PRIVATE_KEY: SSH private key for authentication
- SSH_PORT: SSH port (default: 22)
- DEPLOY_PATH: Path to the project on server
- HEALTH_CHECK_URL: URL to check after deployment
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Database secrets

