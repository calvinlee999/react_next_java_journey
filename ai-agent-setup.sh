#!/bin/bash

echo "🤖 Setting up AI Agent Capabilities for Golden Path Template"
echo "==========================================================="

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

# Create AI agent directory
mkdir -p .ai-agents
mkdir -p logs

echo -e "${BLUE}📦 Setting up AI development tools...${NC}"

# Check if required tools are available
if command -v python3 >/dev/null 2>&1; then
    print_status 0 "Python3 available"
    
    # Install Aider for AI coding assistance
    if ! command -v aider >/dev/null 2>&1; then
        echo "Installing Aider AI coding assistant..."
        pip3 install aider-chat --user
        if [ $? -eq 0 ]; then
            print_status 0 "Aider installed successfully"
        else
            print_status 1 "Aider installation failed"
        fi
    else
        print_status 0 "Aider already installed"
    fi
else
    print_status 1 "Python3 not found - some AI tools may not work"
fi

# Check for VS Code
if command -v code >/dev/null 2>&1; then
    print_status 0 "VS Code available"
    
    # Install helpful AI extensions
    echo "Installing AI-enhanced VS Code extensions..."
    code --install-extension GitHub.copilot --force
    code --install-extension GitHub.copilot-chat --force
    code --install-extension Continue.continue --force
    print_status 0 "AI extensions installed"
else
    print_status 1 "VS Code not found - skipping extension installation"
fi

# Create Aider configuration for Golden Path Template
cat > .aider.conf.yml << 'AIDEREOF'
# Golden Path Template - Aider Configuration
model: gpt-4
auto-commits: false
pretty: true
show-diffs: true
git: true

# Project-specific settings
include:
  - "backend/src/**/*.java"
  - "frontend/src/**/*.{ts,tsx,js,jsx}"
  - "frontend/pages/**/*.{ts,tsx}"
  - "frontend/components/**/*.{ts,tsx}"
  - "*.md"
  - "*.yml"
  - "*.json"
  - "docker-compose.yml"
  - "Dockerfile"

exclude:
  - "node_modules/"
  - "target/"
  - ".git/"
  - "logs/"
  - "*.log"
  - ".ai-agents/"

# Enterprise development guidelines
guidelines: |
  Follow these Golden Path Template principles:
  - Follow SOLID principles for Java backend
  - Use TypeScript for all frontend code
  - Implement comprehensive error handling
  - Add proper logging and monitoring
  - Follow Azure security best practices
  - Implement health checks for all services
  - Use environment-specific configurations
AIDEREOF

# Create AI agent configuration
cat > .ai-agents/config.yml << 'CONFIGEOF'
# Golden Path Template AI Agent Configuration
agent_type: "development_assistant"
project_context:
  name: "Golden Path Template"
  stack: ["React", "Next.js", "Java", "Spring Boot", "Azure"]
  architecture: "Enterprise Financial Technology Application"

capabilities:
  terminal_access: true
  code_generation: true
  file_modification: true
  testing: true
  deployment: true

guidelines:
  - "Follow enterprise security best practices"
  - "Implement comprehensive error handling and logging"
  - "Use TypeScript for type safety"
  - "Follow SOLID principles in Java backend"
  - "Implement proper authentication and authorization"
  - "Use environment-specific configurations"
  - "Implement health checks and monitoring"

common_tasks:
  - "Generate React components with TypeScript"
  - "Create Spring Boot REST controllers"
  - "Set up Azure configurations"
  - "Implement authentication flows"
  - "Create database migrations"
  - "Write unit and integration tests"
  - "Configure CI/CD pipelines"
CONFIGEOF

# Create AI-powered development assistant
cat > .ai-agents/dev-assistant.sh << 'DEVEOF'
#!/bin/bash

echo "🤖 AI Development Assistant - Golden Path Template"
echo "================================================="

case "$1" in
  "start")
    echo "🚀 Starting Golden Path Template with AI monitoring..."
    if [ -f "start-dev-complete.sh" ]; then
        ./start-dev-complete.sh
    else
        echo "Creating and running startup script..."
        # Use the basic VS Code tasks instead
        echo "Please use VS Code tasks to start the services"
    fi
    ;;
  "generate")
    echo "🔧 AI Code Generation Mode"
    if command -v aider >/dev/null 2>&1; then
        aider --config .aider.conf.yml
    else
        echo "Aider not available. Use VS Code with Copilot instead."
        code .
    fi
    ;;
  "analyze")
    echo "📊 AI Code Analysis"
    if command -v aider >/dev/null 2>&1; then
        aider --read-only --config .aider.conf.yml
    else
        echo "Opening project in VS Code for analysis..."
        code .
    fi
    ;;
  "test")
    echo "🧪 AI-Assisted Testing"
    echo "Running backend tests..."
    cd backend && ./mvnw test
    echo "Running frontend tests..."
    cd ../frontend && npm test
    ;;
  "deploy")
    echo "🚀 AI-Assisted Deployment"
    if [ -f "deploy-multi-cloud.sh" ]; then
        ./deploy-multi-cloud.sh --provider azure --environment dev
    else
        echo "Deployment script not found"
    fi
    ;;
  "health")
    echo "🏥 Health Check"
    echo "Checking backend health..."
    curl -s http://localhost:8080/api/health || curl -s http://localhost:8080/actuator/health
    echo ""
    echo "Checking frontend health..."
    curl -s http://localhost:3000/api/health || echo "Frontend health endpoint not available"
    ;;
  *)
    echo "🤖 AI Development Assistant Commands:"
    echo "===================================="
    echo "  start   - Start development environment"
    echo "  generate- AI code generation mode (Aider)"
    echo "  analyze - AI code analysis mode"
    echo "  test    - Run all tests"
    echo "  deploy  - Deploy to Azure"
    echo "  health  - Check service health"
    echo ""
    echo "💡 Additional AI Tools:"
    echo "  - Use Ctrl+I in VS Code for Copilot Chat"
    echo "  - Use aider directly for AI coding"
    echo "  - Use VS Code tasks for quick actions"
    ;;
esac
DEVEOF

chmod +x .ai-agents/dev-assistant.sh

print_status 0 "AI agent configuration created"

echo ""
echo -e "${GREEN}🎉 AI Agent Capabilities Setup Complete!${NC}"
echo "=========================================="
echo -e "${BLUE}🚀 Quick Start Options:${NC}"
echo "1. AI Assistant:           ./.ai-agents/dev-assistant.sh"
echo "2. Aider (Terminal AI):    aider"
echo "3. VS Code with Copilot:   code ."
echo ""
echo -e "${YELLOW}📋 Available Commands:${NC}"
echo "  ./.ai-agents/dev-assistant.sh start     - Start development environment"
echo "  ./.ai-agents/dev-assistant.sh generate  - AI code generation mode"
echo "  ./.ai-agents/dev-assistant.sh analyze   - AI code analysis"
echo "  ./.ai-agents/dev-assistant.sh test      - Run all tests"
echo "  ./.ai-agents/dev-assistant.sh health    - Check service health"
echo ""
echo -e "${GREEN}✅ Ready for AI-enhanced development!${NC}"

