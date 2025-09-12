<<<<<<< HEAD
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
=======
# 🚀 Golden Path Template - Modern React + Next.js + Java + Azure

> **🎯 Complete Enterprise-Grade Full-Stack Architecture** - [Live Demo](http://localhost:3000) | [Examples](http://localhost:3000/examples) | [Micro-Frontend Portal](http://localhost:3002)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.0-green?logo=spring)](https://spring.io/projects/spring-boot)
[![Azure](https://img.shields.io/badge/Azure-Cloud_Ready-blue?logo=microsoft-azure)](https://azure.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
>>>>>>> 07fda1476a256cd139b233815cca08d19ab1b3e7

## 💻 Cross-Machine Development Setup

### Quick Start (2-Minute Setup)

```bash
# 1. Clone the repository
git clone https://github.com/calvinlee999/react_next_java_journey.git
cd react_next_java_journey

# 2. Run automated setup (installs all dependencies)
./setup-dev-env.sh

# 3. Start development servers
./start-dev.sh

# 4. Optional: Start micro-frontend demo
./start-demo.sh
```

**🎉 Ready in 2 minutes!** Visit:
- 🌐 **Monolithic Frontend**: [http://localhost:3000](http://localhost:3000)
- 🏢 **Micro-Frontend Portal**: [http://localhost:3002](http://localhost:3002) 
- 🔧 **Backend API**: [http://localhost:8080](http://localhost:8080)
- 🎯 **Examples**: [http://localhost:3000/examples](http://localhost:3000/examples)
- 🔗 **Webhook Demo**: [http://localhost:3000/webhooks](http://localhost:3000/webhooks)
- 💬 **WebSocket Demo**: [http://localhost:3000/websockets](http://localhost:3000/websockets)

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

This Golden Path template demonstrates **two modern frontend architectures** side by side:

### 🏢 1. Monolithic Frontend (Traditional SPA)
- **Framework**: React 19 + Next.js 15.5.3 with App Router
- **Features**: Server-Side Rendering (SSR), Static Generation (SSG), Client-Side Rendering (CSR)
- **State Management**: Multi-pattern approach (Redux Toolkit, Zustand, Jotai, React Query)
- **Virtual DOM**: Advanced optimizations with virtual scrolling, memoization, lazy loading
- **Navigation**: Smart prefetching, breadcrumbs, mobile-responsive design
- **Performance**: Real-time monitoring, concurrent React features
- **Deployment**: CDN deployable without servers

### 🔧 2. Micro-Frontend Portal (Distributed Architecture)
- **Shell Application**: Container app with Module Federation
- **Micro-Frontends**: Independent domain-specific applications
  - User Management MF (port 3001)
  - Analytics MF (planned)
  - E-commerce MF (planned)
- **Communication**: Event bus for inter-MF messaging
- **Error Handling**: Fault isolation with error boundaries
- **Deployment**: Independent deployment per micro-frontend

### 🔄 Architecture Comparison

| Aspect | Monolithic Frontend | Micro-Frontend Portal |
|--------|-------------------|---------------------|
| **Team Structure** | Single team, shared codebase | Multiple teams, independent codebases |
| **Technology Stack** | Unified React/Next.js | Different frameworks possible |
| **Deployment** | Single deployment pipeline | Independent deployment per MF |
| **Fault Isolation** | Cascading failures possible | Isolated failures per domain |
| **Development Speed** | Fast for small teams | Scalable for large organizations |
| **Complexity** | Lower initial complexity | Higher architectural complexity |
| **Performance** | Optimized bundle, shared context | Module Federation optimization |

### 📊 When to Use Each Architecture

#### Choose **Monolithic Frontend** when:
- Small to medium development teams (1-10 developers)
- Rapid prototyping and MVP development
- Simple to moderate application complexity
- Tight coupling between features is acceptable
- Single deployment pipeline is preferred

#### Choose **Micro-Frontend Portal** when:
- Large development teams (10+ developers, multiple teams)
- Complex business domains requiring isolation
- Independent deployment cycles needed
- Different teams want technology autonomy
- Fault isolation is critical for business continuity

## 📁 Project Structure

```
react_next_java_journey/
├── 🌐 frontend/                     # Monolithic Frontend (React 19 + Next.js 15)
│   ├── src/
│   │   ├── app/                    # Next.js 15 App Router
│   │   ├── components/
│   │   │   ├── navigation/        # Smart navigation system
│   │   │   └── optimization/      # Virtual DOM optimizations
│   │   ├── store/                 # Multi-pattern state management
│   │   │   ├── redux/            # Redux Toolkit
│   │   │   ├── zustand/          # Zustand stores
│   │   │   ├── jotai/            # Jotai atoms
│   │   │   └── query/            # React Query
│   │   ├── hooks/                # Performance monitoring hooks
│   │   └── lib/                  # Utilities and configurations
│   └── package.json              # React 19, Next.js 15.5.3
│
├── 🏢 micro-frontends/             # Micro-Frontend Portal
│   ├── shell/                    # Application Shell (Container)
│   │   ├── src/
│   │   │   ├── app.tsx          # Main shell application
│   │   │   ├── components/      # Shell-specific components
│   │   │   ├── shared/          # Inter-MF communication
│   │   │   └── index.html       # Entry point
│   │   └── next.config.js       # Module Federation config
│   │
│   └── user-management/          # User Management Domain
│       ├── src/components/
│       │   ├── UserApp.tsx      # Main application
│       │   ├── UserList.tsx     # CRUD operations
│       │   ├── UserForm.tsx     # User forms
│       │   └── UserStats.tsx    # Analytics dashboard
│       └── next.config.js       # MF configuration
│
├── ☕ backend/                     # Java Spring Boot Backend
│   ├── src/main/java/
│   │   ├── controller/          # REST API controllers
│   │   ├── service/             # Business logic
│   │   ├── repository/          # Data access layer
│   │   └── model/               # Entity models
│   └── pom.xml                  # Maven dependencies
│
├── ☁️ infrastructure/              # Azure Infrastructure as Code
│   ├── bicep/                   # Azure Bicep templates
│   ├── terraform/               # Terraform configurations
│   └── helm/                    # Kubernetes Helm charts
│
├── 📚 Documentation/
│   ├── SEQUENCE_DIAGRAMS.md      # Architecture sequence diagrams
│   ├── COMPONENT_DIAGRAMS.md     # Component interaction diagrams
│   ├── MICRO_FRONTEND_ARCHITECTURE.md  # Detailed MF architecture
│   └── MODERN_REACT_VIRTUAL_DOM_GUIDE.md  # React optimization guide
│
└── 🛠️ Development Tools/
    ├── .vscode/                 # VS Code configurations
    ├── setup-dev-env.sh        # Environment setup script
    ├── start-dev.sh            # Development server launcher
    └── start-demo.sh           # Architecture demo script
```

## ✨ Key Features Implemented

### 🚀 Modern React Patterns (React 19 + Next.js 15.5.3)

#### State Management Ecosystem
- **🔄 Redux Toolkit**: Complex application state with time-travel debugging  
- **⚡ Zustand**: Lightweight UI state with minimal boilerplate
- **⚜️ Jotai**: Atomic state management for granular reactivity
- **🌐 React Query**: Server state management with caching and synchronization

#### Virtual DOM Optimizations
- **📊 Virtual Scrolling**: Handle 10,000+ item lists without performance degradation
- **🧠 Smart Memoization**: React.memo, useMemo, useCallback for optimized renders
- **🔄 Lazy Loading**: Dynamic imports and code splitting for faster initial loads
- **📈 Performance Monitoring**: Real-time render performance and memory tracking

#### Advanced Navigation System
- **🔮 Smart Prefetching**: Anticipatory resource loading on hover/focus
- **🗺️ Breadcrumb Navigation**: Dynamic path calculation and navigation
- **📱 Mobile-Responsive**: Touch-friendly navigation with gesture support
- **♿ Accessibility**: WCAG compliance with ARIA labels and keyboard navigation

#### Concurrent React Features (React 19)
- **⏳ Transitions**: Non-blocking state updates with useTransition
- **🔄 Suspense**: Declarative loading states and error boundaries
- **🎯 Automatic Batching**: Optimized re-renders across async operations
- **🧵 Concurrent Rendering**: Background rendering for better UX

#### Event-Driven Architecture
- **🔗 Webhook System**: Complete webhook receiver and processor with real-time UI
- **� WebSocket System**: Real-time bidirectional communication with chat, gaming, and collaboration
- **�📡 Real-time Updates**: Auto-refreshing webhook event display with 5-second intervals
- **🔄 Live Communication**: Persistent WebSocket connections with automatic reconnection and HTTP fallback
- **🔒 Signature Verification**: Security with X-Webhook-Signature validation
- **🎯 Interactive Testing**: Built-in webhook testing interface with predefined examples
- **🎮 Real-time Gaming**: Multi-user Tic-tac-toe with synchronized game state
- **📝 Collaborative Editing**: Live document editing with real-time synchronization
- **📊 Event Analytics**: Statistics dashboard with source and event type tracking
- **🔍 Event Inspection**: Detailed header and payload viewing capabilities

### 🏢 Micro-Frontend Architecture

#### Module Federation Integration
- **📦 Webpack 5**: Runtime loading of independent micro-frontends
- **🔗 Shared Dependencies**: Optimized bundle sharing (React, libraries)
- **🚀 Independent Deployment**: Deploy micro-frontends without coordinating releases
- **🔄 Version Management**: Handle different framework versions across MFs

#### Inter-MF Communication
- **📡 Event Bus**: Loose coupling between micro-frontends
- **📊 Shared State**: Global state management across independent apps
- **🔔 Notifications**: Cross-MF messaging and updates
- **📈 Analytics**: Unified tracking across distributed architecture

#### Fault Isolation & Recovery
- **🛡️ Error Boundaries**: Prevent cascading failures between micro-frontends
- **🔄 Graceful Degradation**: Fallback UI when micro-frontends fail
- **📊 Health Monitoring**: Real-time status monitoring of each micro-frontend
- **🔧 Auto-Recovery**: Automatic retry and recovery mechanisms

### 🔧 Backend Features (Java Spring Boot 3.2.0)

#### Enterprise-Grade API
- **🌐 RESTful Architecture**: OpenAPI/Swagger documentation
- **🔒 Security**: JWT authentication, CORS, input validation
- **📊 Monitoring**: Spring Actuator health checks and metrics
- **🔄 Database**: JPA/Hibernate with H2 (dev) and Azure SQL (prod)

### ☁️ Cloud-Native Architecture (Azure)

#### Deployment Strategies
- **📦 Static Deployment**: CDN deployment without servers
- **🌐 Server Deployment**: Full SSR capabilities with Azure Container Apps
- **🔄 Hybrid Deployment**: Mixed static/dynamic deployment per route
- **🚀 Auto-Scaling**: Azure-managed scaling based on demand

#### Infrastructure as Code
- **🏗️ Bicep Templates**: Azure resource provisioning
- **🔧 Terraform**: Multi-cloud infrastructure management
- **☸️ Kubernetes**: Container orchestration with Helm charts
- **📊 Monitoring**: Application Insights and Azure Monitor integration

## 🎯 Live Demonstrations

### 🌐 Monolithic Frontend Demo
Visit [localhost:3000/modern-react](http://localhost:3000/modern-react) to explore:

1. **State Management Showcase**
   - Redux counter with time-travel debugging
   - Zustand theme switcher with persistence
   - Jotai atomic counters with granular updates
   - React Query data fetching with background refresh

2. **Virtual DOM Optimizations**
   - Virtual scrolling with 10,000 items
   - Memoization comparison (optimized vs unoptimized)
   - Lazy loading components with Suspense
   - Real-time performance metrics display

3. **Navigation Features**
   - Smart prefetching demonstration
   - Breadcrumb navigation across nested routes
   - Mobile-responsive menu with animations
   - Accessibility features testing

4. **Event-Driven Communication**
   - Real-time webhook receiver with auto-refresh
   - Interactive webhook testing with predefined examples
   - WebSocket-powered real-time chat system
   - Multi-user real-time gaming (Tic-tac-toe)
   - Collaborative document editing with live synchronization
   - Push notification broadcasting system
   - Event filtering by source (GitHub, Stripe, etc.)
   - Detailed event inspection with headers and payloads
   - Statistics dashboard with event analytics

### 🏢 Micro-Frontend Portal Demo
Visit [localhost:3002](http://localhost:3002) to explore:

1. **Module Federation**
   - Dynamic loading of User Management MF
   - Shared dependency optimization
   - Runtime integration without build coordination

2. **Fault Isolation**
   - Error boundary testing (intentional failures)
   - Graceful degradation examples
   - Independent MF recovery

3. **Inter-MF Communication**
   - Event bus messaging between micro-frontends
   - Shared state synchronization
   - Cross-domain analytics tracking

## 📚 Architecture Documentation

### Comprehensive Guides
- **[Azure Cloud Architecture](./docs/architecture/azure-cloud-architecture.md)**: Complete enterprise Azure architecture with microservices, security, and global distribution
- **[WebSocket System Diagrams](./docs/sequence-diagrams/websocket-system.md)**: Real-time communication architecture with sequence diagrams for chat, gaming, and collaboration
- **[Webhook System Diagrams](./docs/sequence-diagrams/webhook-system.md)**: Complete webhook architecture flow diagrams
- **[Caching System Diagrams](./docs/sequence-diagrams/caching-system.md)**: Multi-layer caching strategy diagrams
- **[State Management Diagrams](./docs/sequence-diagrams/state-management.md)**: Zustand and Redux flow patterns
- **[Component Diagrams](./COMPONENT_DIAGRAMS.md)**: Component interaction patterns  
- **[Micro-Frontend Architecture](./MICRO_FRONTEND_ARCHITECTURE.md)**: Detailed MF implementation
- **[Modern React Guide](./MODERN_REACT_VIRTUAL_DOM_GUIDE.md)**: React optimization patterns

### Implementation Details
- **State Management**: Multi-pattern approach with Redux, Zustand, Jotai, React Query
- **Virtual DOM**: Performance optimization techniques and monitoring
- **Module Federation**: Webpack 5 configuration and best practices
- **Error Handling**: Comprehensive error boundaries and recovery strategies
- **WebSocket System**: Real-time bidirectional communication with chat, gaming, and collaboration
- **Webhook System**: Event-driven communication with signature verification and real-time UI
- **Azure Architecture**: Enterprise-grade cloud infrastructure with microservices and global distribution
- **Caching Architecture**: Multi-layer caching with memory, IndexedDB, and Service Worker
- **Monitoring**: Application Insights and performance tracking
- **Identity**: Azure Active Directory integration

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
- 🔗 **Webhook Demo**: <http://localhost:3000/webhooks>
- 💬 **WebSocket Demo**: <http://localhost:3000/websockets>
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
