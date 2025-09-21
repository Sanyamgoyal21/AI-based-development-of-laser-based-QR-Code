#!/bin/bash

echo "🛑 Stopping Rail QR System..."

# Stop services
docker-compose down

echo "✅ Services stopped successfully!"
echo ""
echo "📚 Useful Commands:"
echo "   Start services: ./run.sh"
echo "   Remove all data: docker-compose down -v"
echo "   View logs: docker-compose logs"
echo ""
