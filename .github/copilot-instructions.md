# Golden Path Template - React, Java, Azure

This is a comprehensive Golden Path template for a production-grade financial technology application.

## Architecture Overview
- **Frontend**: React with Next.js for SSR/SSG capabilities
- **Backend**: Java Spring Boot with microservices architecture
- **Cloud**: Azure with enterprise-grade security and monitoring
- **Database**: Azure SQL Database with Redis Cache
- **Security**: Azure Active Directory, OAuth 2.0, JWT tokens
- **Monitoring**: Application Insights, Azure Monitor
- **CI/CD**: Azure DevOps with automated testing and deployment

## Project Checklist
- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Enterprise-grade React + Java + Azure application
- [x] Scaffold the Project - Complete project structure created
- [x] Customize the Project - Production-ready features implemented
- [x] Install Required Extensions - Standard VS Code setup
- [x] Compile the Project - Both frontend and backend compile successfully
- [x] Create and Run Task - VS Code tasks configured
- [ ] Launch the Project
- [ ] Ensure Documentation is Complete

## Development Guidelines
- Follow enterprise security best practices
- Implement comprehensive error handling and logging
- Use TypeScript for type safety
- Follow SOLID principles in Java backend
- Implement proper authentication and authorization
- Use environment-specific configurations
- Implement health checks and monitoring

## Quick Start Commands
1. Start Backend: `cd backend && ./mvnw spring-boot:run`
2. Start Frontend: `cd frontend && npm run dev`
3. Full Stack: Use VS Code Task "Start Full Stack"
