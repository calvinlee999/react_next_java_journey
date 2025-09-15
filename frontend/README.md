# MCP FinTech Platform Demo Frontend

## Overview

This is a comprehensive React-based frontend demonstration of the Model Context Protocol (MCP) enabled FinTech platform. The demo showcases intelligent workflow coordination, real-time risk management, customer journey automation, and data-driven insights.

## Features

### 🔄 Customer Journey Automation
- **Intelligent Loan Application Processing**: Automated workflow coordination with AI agent orchestration
- **Multi-Domain Coordination**: Seamless integration across user management, credit assessment, and documentation
- **Real-time Progress Tracking**: Live updates on application status and workflow execution

### 🛡️ Real-time Risk Management
- **Fraud Detection**: AI-powered transaction fraud detection with real-time alerts
- **Credit Risk Assessment**: Dynamic credit scoring and risk categorization
- **Portfolio Risk Analysis**: Comprehensive portfolio risk monitoring with VaR calculations

### 📊 Data-Driven Insights
- **Customer Behavior Analytics**: Advanced segmentation and behavior pattern analysis
- **Transaction Insights**: Real-time transaction monitoring and trend analysis
- **Data Product Management**: Quality monitoring and metadata tracking for data products

### 🤖 Agentic Workflow Monitoring
- **Real-time Event Streaming**: Live monitoring of workflow execution and tool usage
- **Agent Performance Metrics**: Tracking of agent efficiency and success rates
- **Kafka Integration**: Event stream monitoring with topic-level insights

## Technology Stack

- **React 19.1.0**: Modern React with hooks and concurrent features
- **Next.js 15.5.3**: Full-stack framework with server-side rendering
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Framer Motion 12.23.12**: Smooth animations and transitions
- **Tailwind CSS**: Utility-first styling with responsive design
- **Heroicons**: Consistent iconography throughout the application

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Java Spring Boot backend (optional - demo runs in simulation mode)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment variables**
   The `.env.local` file is already configured for demo mode

### Running the Demo

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Access the MCP Demo**
   Go to [http://localhost:3000/mcp-demo](http://localhost:3000/mcp-demo)

## Demo Features

The MCP demo includes four main sections accessible from the navigation dashboard:

1. **Customer Journey Automation** - Interactive loan application workflow
2. **Real-time Risk Management** - Live risk monitoring and fraud detection
3. **Data-Driven Insights** - Customer analytics and transaction insights
4. **Agentic Workflow Monitor** - Real-time event streaming and agent performance

## Architecture

### Component Structure
```
src/
├── components/mcp-demo/        # Demo components
│   ├── CustomerJourneyDemo.tsx
│   ├── RiskManagementDemo.tsx
│   ├── DataInsightsDemo.tsx
│   └── AgenticWorkflowMonitor.tsx
├── pages/mcp-demo/            # Demo pages
├── services/mcpService.ts     # API integration
├── types/mcpTypes.ts          # TypeScript types
```

### Key Features
- **Type-safe API integration** with comprehensive TypeScript interfaces
- **Real-time updates** via WebSocket simulation
- **Responsive design** with Tailwind CSS
- **Interactive animations** with Framer Motion
- **Demo mode** with realistic simulated data

## Environment Configuration

The demo is pre-configured with environment variables in `.env.local`:
- Demo mode enabled for standalone operation
- Simulated real-time events and API responses
- Feature flags for agentic mode and Kafka monitoring

## Next.js Information

This project is built with [Next.js](https://nextjs.org) and uses:
- [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for optimized font loading
- [Geist](https://vercel.com/font) font family
- App Router for modern routing capabilities

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [React Documentation](https://react.dev) - React concepts and patterns
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - TypeScript usage

## Deploy on Vercel

The easiest way to deploy this demo is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
