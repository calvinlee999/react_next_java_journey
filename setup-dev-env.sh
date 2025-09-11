#!/bin/bash

# Golden Path Development Environment Setup
# This script sets up the development environment for the React + Java + Azure project

set -e

echo "🚀 Setting up Golden Path Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "azure.yaml" ]; then
    print_error "This script should be run from the root of the Golden Path project"
    exit 1
fi

# Check for required tools
print_status "Checking for required tools..."

check_tool() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_warning "$1 is not installed"
        return 1
    fi
}

# Check Java
if check_tool java; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    print_status "Java version: $JAVA_VERSION"
else
    print_error "Java is required. Please install Java 17 or later."
    exit 1
fi

# Check Node.js
if check_tool node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is required. Please install Node.js 18 or later."
    exit 1
fi

# Check npm
check_tool npm

# Check Maven (optional, we have wrapper)
check_tool mvn || print_warning "Maven not found globally, but we have Maven wrapper"

# Check Docker (optional)
check_tool docker || print_warning "Docker not found. Install Docker for containerization."

# Check Azure CLI (optional)
check_tool az || print_warning "Azure CLI not found. Install for Azure deployment."

# Check Azure Developer CLI (optional)
check_tool azd || print_warning "Azure Developer CLI not found. Install for easy Azure deployment."

# Set up backend
print_status "Setting up backend..."
cd backend

# Make mvnw executable (in case it's not)
chmod +x mvnw

# Download dependencies
print_status "Downloading backend dependencies..."
./mvnw dependency:go-offline -q

# Compile backend
print_status "Compiling backend..."
./mvnw clean compile -q

cd ..

# Set up frontend
print_status "Setting up frontend..."
cd frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm install --silent

# Build frontend
print_status "Building frontend..."
npm run build --silent

cd ..

# Create environment files
print_status "Creating environment configuration files..."

# Backend environment
cat > backend/src/main/resources/application-local.yml << 'EOF'
# Local development configuration
spring:
  datasource:
    url: jdbc:h2:mem:localdb
    username: sa
    password: 
  h2:
    console:
      enabled: true
  jpa:
    show-sql: true

server:
  port: 8080

logging:
  level:
    com.fintech.goldenpath: DEBUG
EOF

# Frontend environment
cat > frontend/.env.local << 'EOF'
# Local development environment variables
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_ENVIRONMENT=local
EOF

# Create startup script
print_status "Creating startup script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start development servers
echo "Starting Golden Path development environment..."

# Start backend in background
echo "Starting backend..."
cd backend && ./mvnw spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Start frontend
echo "Starting frontend..."
cd frontend && npm run dev
EOF

chmod +x start-dev.sh

# Create stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash

# Stop development servers
echo "Stopping development servers..."

# Kill backend process
pkill -f "spring-boot:run"

# Kill frontend process
pkill -f "next"

echo "Development servers stopped."
EOF

chmod +x stop-dev.sh

# Reference to dotfiles
if [ -d "$HOME/dotfiles" ]; then
    print_status "Dotfiles detected at $HOME/dotfiles"
    print_status "Consider linking your development configurations:"
    echo "  - Git configuration: $HOME/dotfiles/.gitconfig"
    echo "  - Shell configuration: $HOME/dotfiles/.bashrc or $HOME/dotfiles/.zshrc"
    echo "  - Editor configuration: $HOME/dotfiles/.vimrc or VS Code settings"
    
    # Create a symbolic link to dotfiles if available
    if [ -f "$HOME/dotfiles/.gitignore_global" ]; then
        print_status "Linking global .gitignore from dotfiles..."
        ln -sf "$HOME/dotfiles/.gitignore_global" .gitignore_global
        git config --global core.excludesfile "$(pwd)/.gitignore_global"
    fi
fi

# Check for GitHub dotfiles
if [ -d "$HOME/dotfiles" ] && [ -d "$HOME/dotfiles/.git" ]; then
    DOTFILES_REMOTE=$(cd "$HOME/dotfiles" && git remote get-url origin 2>/dev/null || echo "")
    if [[ "$DOTFILES_REMOTE" == *"calvinlee999/dotfiles"* ]]; then
        print_success "Detected Calvin's dotfiles repository"
        print_status "Using configuration from https://github.com/calvinlee999/dotfiles"
    fi
fi

print_success "Development environment setup complete!"
print_status "To start the development servers:"
echo "  ./start-dev.sh"
echo ""
print_status "To stop the development servers:"
echo "  ./stop-dev.sh"
echo ""
print_status "Individual commands:"
echo "  Backend:  cd backend && ./mvnw spring-boot:run"
echo "  Frontend: cd frontend && npm run dev"
echo ""
print_status "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080/api"
echo "  Health:   http://localhost:8080/api/health"
echo "  H2 DB:    http://localhost:8080/h2-console"
echo ""
print_warning "Note: Make sure to start the backend first, then the frontend."
EOF
