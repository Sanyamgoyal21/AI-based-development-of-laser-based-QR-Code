#!/bin/bash

echo "🚀 Starting Rail QR System..."

# Check if services are already running
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Services are already running. Use 'docker-compose restart' to restart."
    docker-compose ps
    exit 0
fi

# Start services
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 5

# Check service status
echo "🔍 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000/api"
echo "   API Health: http://localhost:8000/api/health"
echo ""
echo "📚 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: ./stop.sh"
echo "   Restart services: docker-compose restart"
echo ""
