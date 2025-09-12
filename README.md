# Golden Path Template - Enterprise Full-Stack Testing Framework 

🚀 **Production-Ready React + Java + Azure Architecture with Comprehensive Testing**  
🧪 **Advanced Testing**: Jest + React Testing Library + Playwright + JUnit + Spring Boot Test + Testcontainers  
🎯 **Examples**: <http://localhost:3000/examples>

## 🧪 Testing Framework Overview

### Frontend Testing Stack
- **Jest**: JavaScript testing framework with custom configuration for Next.js
- **React Testing Library**: Component testing with best practices for user interactions  
- **Playwright**: Cross-browser E2E testing (Chromium, Firefox, WebKit)
- **Coverage Reports**: Code coverage analysis with configurable thresholds
- **API Testing**: Mocked HTTP requests with comprehensive error handling

### Backend Testing Stack  
- **JUnit 5**: Modern Java testing framework with Spring Boot integration
- **Spring Boot Test**: Full application context testing with auto-configuration
- **MockMvc**: Controller layer testing with HTTP request simulation
- **TestRestTemplate**: Integration testing with real HTTP server
- **Testcontainers**: Database testing with containerized environments
- **WireMock**: HTTP service mocking for external API testing
- **Datafaker**: Test data generation for realistic scenarios

### Testing Commands
```bash
# Frontend Tests
npm test                    # Run Jest unit tests
npm run test:e2e           # Run Playwright E2E tests  
npm run test:coverage      # Generate coverage reports

# Backend Tests
./mvnw test                # Run all backend tests
./mvnw test -Dtest=HealthControllerTest  # Run specific test class
./mvnw test -Dspring.profiles.active=test  # Run with test profile

# Full Test Suite
npm run test:all           # Run all frontend and backend tests
```

## 💻 Cross-Machine Development Setup

### First Time Setup on Any Machine

```bash
# 1. Clone the repository
git clone https://github.com/calvinlee999/react_next_java_journey.git
cd react_next_java_journey

# 2. Run automated setup (installs all dependencies)
./setup-dev-env.sh

# 3. Start development servers
./start-dev.sh
```

### What Gets Installed Automatically

- ✅ **Frontend**: npm dependencies, Next.js 15.5.3, TypeScript, Tailwind CSS
- ✅ **Backend**: Maven dependencies, Spring Boot 3.2.0, Java validation
- ✅ **Development Tools**: VS Code tasks, debug configurations
- ✅ **Build Verification**: Tests both frontend and backend compilation

### Environment Requirements

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Node.js | 18+ | Frontend development |
| Java | 17+ | Backend development |
| Maven | 3.8+ | Java dependency management |
| Git | 2.0+ | Version control |

### VS Code Integration

This project includes complete VS Code configuration:

- **Tasks**: Build, test, and run commands
- **Launch**: Debug configurations for frontend and backend
- **Extensions**: Recommended extensions for optimal development
- **Settings**: Project-specific settings for consistent formatting

```bash
# Open in VS Code with all configurations
code .
```

## 🔄 Full-Stack Framework Capabilitiesact + Java + Azure

> **🎯 Complete Full-Stack Framework Template for Enterprise Fintech Applications**

A production-ready, enterprise-grade template that demonstrates modern full-stack capabilities including **Client-Side Rendering (CSR)**, **Single-Page Apps (SPA)**, **Static Site Generation (SSG)**, and **Server-Side Rendering (SSR)** - all deployable to CDN without servers when needed.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.0-green?logo=spring)](https://spring.io/projects/spring-boot)
[![Azure](https://img.shields.io/badge/Azure-Cloud_Ready-blue?logo=microsoft-azure)](https://azure.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

## 🚀 Quick Start (Cross-Machine Development)

### Clone and Launch
```bash
git clone https://github.com/calvinlee999/react_next_java_journey.git
cd react_next_java_journey
./setup-dev-env.sh    # Setup dependencies
./start-dev.sh        # Start both frontend and backend
```

**Ready in 2 minutes!** Visit:
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8080  
- 🎯 **Examples**: http://localhost:3000/examples

## 🔄 Full-Stack Framework Capabilities

This Golden Path template demonstrates **ALL** rendering strategies from React documentation:

### ✨ Client-Side Rendering (CSR)
- **Use Case**: Interactive dashboards, real-time trading interfaces
- **Benefits**: Rich interactivity, SPA behavior
- **Deployment**: Any CDN or static hosting service
- **Example**: `/examples/csr` - Interactive components that run entirely in the browser

### ⚡ Static Site Generation (SSG)
- **Use Case**: Marketing pages, documentation, legal pages
- **Benefits**: Ultra-fast loading, perfect SEO, CDN cacheable
- **Deployment**: Any static hosting (Vercel, Netlify, S3, GitHub Pages)
- **Example**: `/examples/ssg` - Pre-rendered at build time for optimal performance

### 🌐 Server-Side Rendering (SSR)
- **Use Case**: Personalized dashboards, fresh financial data
- **Benefits**: Fresh data on every request, SEO with dynamic content
- **Deployment**: Server required (Azure Container Apps, Vercel Functions)
- **Example**: `/examples/ssr` - Rendered on the server for each request

### 🎯 Route-Level Strategy Selection
- **Flexibility**: Choose rendering strategy per route
- **Incremental Adoption**: Start with static, add server features as needed
- **No Rewrite Required**: Add SSR to specific routes without changing your app
- **Mixed Deployment**: Static routes to CDN, dynamic routes to servers

## 🚀 Deployment Flexibility

### CDN Deployment (No Server Required)
```bash
# Build for static deployment
npm run build:static
# Deploy 'out' folder to any CDN
```

### Server Deployment
```bash
# Build for server deployment  
npm run build
# Deploy with server capabilities
```

### Azure Deployment
```bash
# Deploy to Azure with azd
azd up
```

## 🏗️ Architecture Overview

This Golden Path template provides a complete enterprise-grade application structure suitable for tier 1 banks and fintech companies:

### Frontend (React + Next.js)

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rendering**: Multi-strategy support (CSR, SSR, SSG, SPA)
- **Deployment**: CDN deployable without servers
- **Features**: Interactive UIs, static generation, server-side rendering

### Backend (Java Spring Boot)
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (development), Azure SQL (production)
- **Security**: Spring Security, JWT authentication
- **Monitoring**: Spring Actuator, health checks
- **Documentation**: OpenAPI/Swagger

### Cloud Infrastructure (Azure)
- **Frontend Hosting**: Azure Static Web Apps
- **Backend Hosting**: Azure Container Apps
- **Database**: Azure SQL Database
- **Cache**: Azure Redis Cache
- **Monitoring**: Application Insights
- **Identity**: Azure Active Directory

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.8+
- Docker (optional)
- Azure CLI (for deployment)
- Azure Developer CLI (azd)

### 1. Clone and Setup

```bash
git clone https://github.com/calvinlee999/react_next_java_journey.git
cd react_next_java_journey
./setup-dev-env.sh    # Automatic dependency setup
```

### 2. Quick Start (Automated)

```bash
./start-dev.sh        # Starts both frontend and backend
```

### 3. Manual Start (Alternative)

```bash
# Terminal 1: Backend
cd backend && ./mvnw spring-boot:run

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev
```

### 4. Verify Setup

**Ready in 2 minutes!** Visit:

- 🌐 **Frontend**: <http://localhost:3000>
- 🔧 **Backend API**: <http://localhost:8080>
- 🎯 **Full-Stack Examples**: <http://localhost:3000/examples>
- 🏥 **Health Check**: <http://localhost:8080/actuator/health>

## 📁 Project Structure

```
react_next_java_journey/
├── frontend/                 # React Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   └── components/      # Reusable components
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Java Spring Boot application
│   ├── src/
│   │   ├── main/java/       # Java source code
│   │   └── test/java/       # Java tests
│   ├── Dockerfile           # Container configuration
│   └── pom.xml             # Maven dependencies
├── infra/                   # Azure infrastructure (Bicep)
│   ├── main.bicep          # Main infrastructure template
│   └── abbreviations.json  # Azure resource naming
├── .github/                # GitHub workflows & docs
└── azure.yaml              # Azure Developer CLI config
```

## 🔐 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Spring Security configuration
- CORS protection
- Azure Active Directory integration (production)

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- HTTPS enforcement (production)

### Infrastructure Security
- Azure Key Vault for secrets
- Managed identities
- Network security groups
- Application security groups

## 🔍 Monitoring & Observability

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service health monitoring

### Logging
- Structured logging with Logback
- Azure Application Insights integration
- Request/response logging
- Error tracking and alerting

### Metrics
- Spring Actuator metrics
- Custom business metrics
- Performance monitoring
- Resource utilization tracking

## 🚀 Deployment

### Local Development
```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev
```

### Azure Deployment
```bash
# Initialize Azure resources
azd init

# Deploy to Azure
azd up
```

### Docker Deployment
```bash
# Build backend image
cd backend && docker build -t golden-path-backend .

# Build frontend image
cd frontend && docker build -t golden-path-frontend .

# Run with docker-compose
docker-compose up
```

## 🛠️ Development Guidelines

### Code Standards
- **Java**: Follow Google Java Style Guide
- **TypeScript**: Use ESLint + Prettier configuration
- **Testing**: Minimum 80% code coverage
- **Documentation**: JSDoc for TypeScript, Javadoc for Java

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Production hotfixes

### Commit Convention
```
type(scope): description

feat(auth): add JWT authentication
fix(api): resolve CORS issue
docs(readme): update deployment instructions
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
./mvnw test                    # Unit tests
./mvnw integration-test        # Integration tests
./mvnw verify                  # All tests + quality checks
```

### Frontend Testing
```bash
cd frontend
npm test                       # Jest unit tests
npm run test:e2e              # Playwright E2E tests
npm run test:coverage         # Coverage report
```

## 📊 API Documentation

### Interactive Documentation
- **Development**: http://localhost:8080/swagger-ui.html
- **Production**: Available via Azure API Management

### Key Endpoints
- `GET /api/health` - Application health status
- `GET /api/hello` - Hello world endpoint
- `GET /api/hello/secure` - Authenticated endpoint
- `GET /actuator/*` - Spring Actuator endpoints

## 🔧 Configuration

### Environment Variables
```bash
# Backend Configuration
SPRING_PROFILES_ACTIVE=development
DATABASE_URL=jdbc:h2:mem:testdb
REDIS_URL=localhost:6379
JWT_SECRET=your-secret-key

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_ENVIRONMENT=development
```

### Azure Configuration
```yaml
# azure.yaml
name: golden-path-fintech
services:
  frontend:
    language: js
    project: ./frontend
    host: staticwebapp
  backend:
    language: java
    project: ./backend
    host: containerapp
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Additional Resources

### Documentation
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)
- [Azure Documentation](https://docs.microsoft.com/azure/)

### Training Materials
- [Spring Academy](https://spring.academy/)
- [Azure Learning Paths](https://docs.microsoft.com/learn/azure/)
- [React Training](https://reactjs.org/tutorial/tutorial.html)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Refer to the troubleshooting guide in the docs

---

**Golden Path Template** - Building the future of financial technology with enterprise-grade architecture and cloud-native best practices.
