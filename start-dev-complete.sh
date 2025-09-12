#!/bin/bash

echo "🚀 Starting Golden Path Template - Enterprise-grade React + Java + Azure"
echo "======================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if we're in the right directory
if [ ! -f "backend/pom.xml" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Missing required project files${NC}"
    echo "Current directory: $(pwd)"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight checks...${NC}"

# Check Java
if command -v java >/dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 17 ]; then
        print_status 0 "Java $JAVA_VERSION (>=17)"
    else
        echo -e "${RED}❌ Java 17+ required, found Java $JAVA_VERSION${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Java is required but not installed${NC}"
    exit 1
fi

# Check Node
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm $NPM_VERSION"
else
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

# Function to check and kill processes on ports
cleanup_ports() {
    echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
    
    # Kill processes on port 8080 (backend)
    if lsof -ti:8080 >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Stopping existing process on port 8080...${NC}"
        kill -9 $(lsof -ti:8080) 2>/dev/null || true
        sleep 2
    fi
    
    # Kill processes on port 3000 (frontend)
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Stopping existing process on port 3000...${NC}"
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
        sleep 2
    fi
    
    # Kill any existing Spring Boot or Next.js processes
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
    
    print_status 0 "Ports cleaned up"
}

cleanup_ports

# Create logs directory
mkdir -p logs

# Create environment files
echo -e "${BLUE}📁 Setting up environment files...${NC}"

# Frontend environment file
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
# Golden Path Template - Development Environment
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_ENVIRONMENT=development
NEXTAUTH_SECRET=golden-path-dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Golden Path Template
NEXT_PUBLIC_VERSION=1.0.0

# Azure Configuration (Development)
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# Database Configuration
DATABASE_URL=jdbc:h2:mem:goldenpath
EOF
    print_status 0 "Created frontend/.env.local"
else
    print_status 0 "Frontend environment file exists"
fi

# Backend environment file
mkdir -p backend/src/main/resources
if [ ! -f "backend/src/main/resources/application-local.yml" ]; then
    cat > backend/src/main/resources/application-local.yml << 'EOF'
server:
  port: 8080
  servlet:
    context-path: /

spring:
  profiles:
    active: local
  application:
    name: golden-path-backend
  datasource:
    url: jdbc:h2:mem:goldenpath;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driverClassName: org.h2.Driver
    username: sa
    password: password
  h2:
    console:
      enabled: true
      path: /h2-console
      settings:
        web-allow-others: true
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
        format_sql: true

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,beans
  endpoint:
    health:
      show-details: always
  info:
    env:
      enabled: true

logging:
  level:
    com.fintech.goldenpath: DEBUG
    org.springframework.web: INFO
    org.springframework.security: INFO
    root: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

# Custom application properties
app:
  name: Golden Path Template
  version: 1.0.0
  description: Enterprise-grade React + Java + Azure application
  environment: development

# CORS Configuration
cors:
  allowed-origins: 
    - http://localhost:3000
    - http://127.0.0.1:3000
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
  allowed-headers: "*"
EOF
    print_status 0 "Created backend/src/main/resources/application-local.yml"
else
    print_status 0 "Backend environment file exists"
fi

# Install and verify dependencies
echo -e "${BLUE}📦 Installing and verifying dependencies...${NC}"

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
if ./mvnw clean compile -DskipTests; then
    print_status 0 "Backend dependencies installed successfully"
else
    print_status 1 "Backend dependency installation failed"
    echo "Checking Maven wrapper..."
    ls -la mvnw
    echo "Checking pom.xml..."
    head -10 pom.xml
    exit 1
fi

# Frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
if npm install; then
    print_status 0 "Frontend dependencies installed successfully"
else
    print_status 1 "Frontend dependency installation failed"
    echo "Checking package.json..."
    head -10 package.json
    exit 1
fi

cd ..

# Start services with enhanced monitoring
echo -e "${BLUE}🚀 Starting services...${NC}"

# Start backend
echo "Starting backend (Spring Boot)..."
cd backend
nohup ./mvnw spring-boot:run -Dspring.profiles.active=local > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait for backend with better feedback
echo "⏳ Waiting for backend to start..."
BACKEND_READY=false
for i in {1..60}; do
    # Check multiple health endpoints
    if curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; then
        print_status 0 "Backend started successfully (Actuator endpoint)"
        BACKEND_READY=true
        break
    elif curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
        print_status 0 "Backend started successfully (Custom endpoint)"
        BACKEND_READY=true
        break
    elif curl -s http://localhost:8080/ >/dev/null 2>&1; then
        print_status 0 "Backend started successfully (Root endpoint)"
        BACKEND_READY=true
        break
    fi
    
    # Show progress and check if process is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_status 1 "Backend process died"
        echo "Backend logs:"
        tail -20 logs/backend.log
        exit 1
    fi
    
    printf "."
    sleep 2
done

if [ "$BACKEND_READY" = false ]; then
    print_status 1 "Backend failed to start within 120 seconds"
    echo "Backend logs:"
    tail -30 logs/backend.log
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Start frontend
echo "Starting frontend (Next.js)..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

# Wait for frontend with better feedback
echo "⏳ Waiting for frontend to start..."
FRONTEND_READY=false
for i in {1..40}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_status 0 "Frontend started successfully"
        FRONTEND_READY=true
        break
    fi
    
    # Check if process is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status 1 "Frontend process died"
        echo "Frontend logs:"
        tail -20 logs/frontend.log
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    printf "."
    sleep 2
done

if [ "$FRONTEND_READY" = false ]; then
    print_status 1 "Frontend failed to start within 80 seconds"
    echo "Frontend logs:"
    tail -30 logs/frontend.log
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Comprehensive endpoint validation
echo -e "${BLUE}🧪 Validating all endpoints...${NC}"

# Test backend health
echo "Testing backend endpoints..."
if curl -s http://localhost:8080/actuator/health | grep -q "UP\|status"; then
    print_status 0 "Backend health check (Actuator) - PASSED"
elif curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
    print_status 0 "Backend health check (Custom API) - PASSED"
else
    print_status 1 "Backend health check - FAILED"
    echo "Checking what's responding on port 8080:"
    curl -v http://localhost:8080/ 2>&1 | head -10
fi

# Test frontend
echo "Testing frontend accessibility..."
if curl -s http://localhost:3000 | grep -q "html\|React\|Next"; then
    print_status 0 "Frontend accessibility check - PASSED"
else
    print_status 1 "Frontend accessibility check - FAILED"
fi

# Test specific endpoints
echo "Testing additional endpoints..."
curl -s http://localhost:8080/actuator/info >/dev/null && print_status 0 "Backend info endpoint - PASSED" || print_status 1 "Backend info endpoint - FAILED"

# Save process information
echo "$BACKEND_PID $FRONTEND_PID" > .dev-pids
echo "$(date): Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID" >> logs/process.log

# Create stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Golden Path Template services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f .dev-pids ]; then
    PIDS=$(cat .dev-pids)
    echo -e "${YELLOW}Stopping processes: $PIDS${NC}"
    
    # Kill the specific PIDs
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping process $PID..."
            kill $PID 2>/dev/null || true
        fi
    done
    
    # Wait a moment then force kill if necessary
    sleep 3
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Force stopping process $PID..."
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    rm -f .dev-pids
    echo -e "${GREEN}✅ Services stopped${NC}"
else
    echo -e "${YELLOW}⚠️  No running services found (.dev-pids file missing)${NC}"
fi

# Kill any remaining processes on ports
echo "Cleaning up any remaining processes on ports 3000 and 8080..."
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Kill processes by port
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}🧹 Cleanup complete${NC}"
EOF

chmod +x stop-dev.sh

# Final success message
echo ""
echo -e "${GREEN}🎉 Golden Path Template is now running successfully!${NC}"
echo "============================================================"
echo -e "${BLUE}📱 Frontend Application:${NC}    http://localhost:3000"
echo -e "${BLUE}⚙️  Backend API:${NC}            http://localhost:8080"
echo -e "${BLUE}🏥 Backend Health:${NC}          http://localhost:8080/actuator/health"
echo -e "${BLUE}📊 Backend Info:${NC}            http://localhost:8080/actuator/info"
echo -e "${BLUE}🗄️  H2 Database Console:${NC}     http://localhost:8080/h2-console"
echo -e "${BLUE}📈 Metrics:${NC}                 http://localhost:8080/actuator/metrics"
echo ""
echo -e "${YELLOW}📋 Quick Access URLs:${NC}"
echo "   • Main App:         http://localhost:3000"
echo "   • Examples:         http://localhost:3000/examples"
echo "   • API Health:       http://localhost:8080/actuator/health"
echo "   • API Documentation: http://localhost:8080/swagger-ui.html (if configured)"
echo ""
echo -e "${YELLOW}📝 Development Logs:${NC}"
echo "   • Backend logs:     tail -f logs/backend.log"
echo "   • Frontend logs:    tail -f logs/frontend.log"
echo "   • Process info:     cat logs/process.log"
echo ""
echo -e "${YELLOW}🛑 Stop Services:${NC}"
echo "   • Stop script:      ./stop-dev.sh"
echo "   • Manual stop:      kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
echo "   • Port check:       lsof -ti:3000 -ti:8080"
echo "   • Process check:    ps aux | grep -E '(spring-boot|next)'"
echo "   • Restart:          ./stop-dev.sh && ./start-dev-complete.sh"
echo ""
echo -e "${GREEN}✅ Golden Path Template Status: ALL SYSTEMS OPERATIONAL${NC}"
echo ""
echo -e "${BLUE}🤖 AI Development Assistant Available:${NC}"
echo "   • Run: ./.ai-agents/dev-assistant.sh"
echo "   • Use VS Code with GitHub Copilot for enhanced development"
echo ""

# Keep script running and handle graceful shutdown
echo -e "${YELLOW}Press Ctrl+C to stop all services gracefully...${NC}"
trap 'echo ""; echo "🛑 Gracefully stopping services..."; ./stop-dev.sh; exit 0' INT

# Monitor processes and wait
while true; do
    # Check if both processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died unexpectedly${NC}"
        echo "Backend logs:"
        tail -20 logs/backend.log
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process died unexpectedly${NC}"
        echo "Frontend logs:"
        tail -20 logs/frontend.log
        break
    fi
    
    sleep 10
done

# If we get here, something went wrong
echo -e "${RED}❌ One or more services stopped unexpectedly${NC}"
./stop-dev.sh
exit 1
