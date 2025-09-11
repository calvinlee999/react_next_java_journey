#!/bin/bash
set -e

echo "🚀 Starting Golden Path Development Servers..."

# Function to check if a port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to start backend
start_backend() {
    echo "🟡 Starting Java Spring Boot backend on port 8080..."
    cd backend
    ./mvnw spring-boot:run &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    echo "✅ Backend started (PID: $BACKEND_PID)"
}

# Function to start frontend
start_frontend() {
    echo "🟡 Starting Next.js frontend on port 3000..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm backend.pid
        echo "✅ Backend stopped"
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm frontend.pid
        echo "✅ Frontend stopped"
    fi
    
    echo "🎉 Development servers stopped cleanly"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if ports are available
if port_in_use 8080; then
    echo "❌ Port 8080 is already in use. Please stop the service using this port first."
    exit 1
fi

if port_in_use 3000; then
    echo "❌ Port 3000 is already in use. Please stop the service using this port first."
    exit 1
fi

# Start services
start_backend
sleep 5  # Give backend time to start

start_frontend
sleep 3  # Give frontend time to start

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Available URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Health Check: http://localhost:8080/actuator/health"
echo ""
echo "🎯 Try these examples:"
echo "   CSR Demo: http://localhost:3000/examples/csr"
echo "   SSG Demo: http://localhost:3000/examples/ssg"
echo "   SSR Demo: http://localhost:3000/examples/ssr"
echo ""
echo "⏹️  Press Ctrl+C to stop all servers"

# Keep script running
wait
