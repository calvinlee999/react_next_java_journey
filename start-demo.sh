#!/bin/bash

# Micro-Frontend Portal Demo Script
# This script starts both the monolithic frontend and micro-frontend portal for comparison

echo "🚀 Starting Micro-Frontend Portal Demo"
echo "======================================"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "micro-frontends" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure:"
    echo "   - frontend/ (monolithic frontend)"
    echo "   - micro-frontends/ (micro-frontend portal)"
    exit 1
fi

echo ""
echo "📋 Demo Architecture Overview:"
echo "==============================="
echo "1. Monolithic Frontend (React 19 + Next.js 15)"
echo "   - Location: /frontend/"
echo "   - URL: http://localhost:3000"
echo "   - Features: Modern React patterns, state management, Virtual DOM optimizations"
echo ""
echo "2. Micro-Frontend Portal"
echo "   - Shell Application: http://localhost:3002"
echo "   - User Management MF: http://localhost:3001"
echo "   - Benefits: Team autonomy, technology freedom, fault isolation"
echo ""

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking port availability..."
check_port 3000 || echo "   Port 3000 (monolithic frontend) - already running"
check_port 3001 || echo "   Port 3001 (user management MF) - already running"
check_port 3002 || echo "   Port 3002 (shell application) - already running"

echo ""
echo "🏗️  Starting Applications..."
echo "============================="

# Start monolithic frontend if not running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    echo "1. Starting Monolithic Frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi
    echo "   🚀 Starting development server on port 3000..."
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    sleep 3
else
    echo "1. ✅ Monolithic Frontend already running on port 3000"
fi

# Start user management micro-frontend if not running
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
    echo "2. Starting User Management Micro-Frontend..."
    cd micro-frontends/user-management
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi
    echo "   🚀 Starting development server on port 3001..."
    npm run dev &
    USER_MF_PID=$!
    cd ../..
    sleep 3
else
    echo "2. ✅ User Management Micro-Frontend already running on port 3001"
fi

# Start shell application if not running
if ! lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null; then
    echo "3. Starting Shell Application..."
    cd micro-frontends/shell
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi
    echo "   🚀 Starting development server on port 3002..."
    
    # For now, let's serve the static demo
    echo "   📄 Serving static demo files..."
    if command -v python3 &> /dev/null; then
        cd src
        python3 -m http.server 3002 &
        SHELL_PID=$!
        cd ..
    elif command -v python &> /dev/null; then
        cd src
        python -m SimpleHTTPServer 3002 &
        SHELL_PID=$!
        cd ..
    else
        echo "   ⚠️  Python not found. Please install Python or Node.js http-server"
        echo "   💡 Alternative: npm install -g http-server && http-server src -p 3002"
    fi
    cd ../..
    sleep 2
else
    echo "3. ✅ Shell Application already running on port 3002"
fi

echo ""
echo "🎉 Demo Applications Started!"
echo "============================="
echo ""
echo "🌐 Access the applications:"
echo "   • Monolithic Frontend:     http://localhost:3000"
echo "   • Micro-Frontend Portal:   http://localhost:3002" 
echo "   • User Management MF:      http://localhost:3001"
echo ""
echo "🔍 Compare the architectures:"
echo "   1. Visit both applications side by side"
echo "   2. Notice the different architectural approaches"
echo "   3. Try stopping individual micro-frontends to see isolation"
echo ""
echo "🛠️  Development workflow:"
echo "   • Monolithic: Single codebase, shared state, simple deployment"
echo "   • Micro-Frontend: Independent development, isolated failures, team autonomy"
echo ""
echo "📚 Documentation:"
echo "   • Setup Guide: MICRO_FRONTEND_SETUP.md"
echo "   • Architecture: MICRO_FRONTEND_ARCHITECTURE.md"
echo ""

# Wait for user input
echo "Press Ctrl+C to stop all applications, or press Enter to open browsers..."
read -r

# Open browsers
if command -v open &> /dev/null; then
    echo "🌐 Opening browsers..."
    open http://localhost:3000
    sleep 1
    open http://localhost:3002
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Opening browsers..."
    xdg-open http://localhost:3000
    sleep 1
    xdg-open http://localhost:3002
else
    echo "🌐 Please manually open:"
    echo "   http://localhost:3000 (Monolithic Frontend)"
    echo "   http://localhost:3002 (Micro-Frontend Portal)"
fi

echo ""
echo "✨ Demo is ready! Press Ctrl+C to stop all applications."

# Wait for interrupt
wait
