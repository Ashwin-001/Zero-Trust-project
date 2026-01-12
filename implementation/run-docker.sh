#!/bin/bash

# Stop any running containers
echo "Stopping existing containers..."
docker-compose down

# Build and start the services in detached mode
echo "Building and starting services..."
docker-compose up --build -d

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Create initial users
echo "Initializing users..."
docker-compose exec -T backend python create_users.py

# Seed logs for ML engine
echo "Seeding logs for security intelligence..."
docker-compose exec -T backend python seed_logs.py

# Show logs
echo "Services are online. Attaching to logs..."
docker-compose logs -f
