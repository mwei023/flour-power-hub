# Use PostgreSQL 15 with required extensions
FROM postgres:15

# Set environment variables
ENV POSTGRES_DB=poshomill
ENV POSTGRES_USER=mwei
ENV POSTGRES_PASSWORD=23042003mwei

# Create database and run initialization
COPY database/init.sql /docker-entrypoint-initdb.d/01-init.sql

# Expose PostgreSQL port
EXPOSE 5432
