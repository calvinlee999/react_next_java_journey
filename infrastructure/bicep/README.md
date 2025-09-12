# Azure API Management Infrastructure

This directory contains Infrastructure as Code (IaC) templates for deploying Azure API Management as part of the Level 1 Azure Well-Architected Framework implementation.

## 🏗️ Architecture Overview

The infrastructure provides a complete Azure API Management solution with:

- **Enterprise Security**: Managed Identity, Key Vault integration, OAuth 2.0/JWT validation
- **Performance & Reliability**: Caching policies, circuit breakers, zone redundancy
- **Monitoring & Analytics**: Application Insights integration, custom metrics, health checks
- **Developer Experience**: Developer portal, comprehensive documentation, API versioning
- **Cost Optimization**: Environment-specific scaling, resource tagging

## 📁 File Structure

```
infrastructure/bicep/
├── api-management.bicep                 # Main Bicep template
├── api-management.parameters.dev.json   # Development environment parameters
├── api-management.parameters.prod.json  # Production environment parameters
├── deploy-api-management.sh             # Deployment script
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI**: Install from [Microsoft Docs](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Login**: Run `az login` to authenticate
3. **Subscription Access**: Ensure you have Contributor access to the target subscription

### Deploy to Development

```bash
./deploy-api-management.sh -e dev -g rg-goldenpath-dev
```

### Deploy to Production

```bash
./deploy-api-management.sh -e prod -g rg-goldenpath-prod -s YOUR_SUBSCRIPTION_ID
```

## 🔧 Configuration

### Environment Parameters

#### Development Environment (`api-management.parameters.dev.json`)
- **SKU**: Developer (cost-optimized for development)
- **Capacity**: 1 unit
- **Zone Redundancy**: Disabled
- **Certificate Management**: Self-signed for testing

#### Production Environment (`api-management.parameters.prod.json`)
- **SKU**: Premium (enterprise features)
- **Capacity**: 2 units (auto-scaling capable)
- **Zone Redundancy**: Enabled for high availability
- **Certificate Management**: Key Vault integration

### Deployment Script Options

```bash
./deploy-api-management.sh [OPTIONS]

Options:
  -e, --environment    Environment (dev, staging, prod) [default: dev]
  -g, --resource-group Resource group name [required]
  -s, --subscription   Azure subscription ID [optional]
  -l, --location       Azure region [default: East US]
  -h, --help          Show help message
```

## 🏛️ Architecture Components

### 1. API Management Service
- **Purpose**: Central API gateway for all backend services
- **Features**: Security policies, rate limiting, caching, analytics
- **Integration**: Connects React frontend to Java Spring Boot backends

### 2. Managed Identity
- **Purpose**: Secure access to Azure resources without credentials
- **Scope**: System-assigned identity for Key Vault and Application Insights access
- **Benefits**: Enhanced security, automatic credential rotation

### 3. Key Vault Integration
- **Purpose**: Secure storage of certificates, secrets, and API keys
- **Access**: Via Managed Identity with least-privilege permissions
- **Certificates**: SSL/TLS certificates for custom domains

### 4. Application Insights
- **Purpose**: Advanced monitoring, logging, and analytics
- **Metrics**: Request telemetry, performance counters, custom events
- **Alerting**: Proactive monitoring with Azure Monitor integration

### 5. Developer Portal
- **Purpose**: Self-service API documentation and testing
- **Features**: Interactive API explorer, code samples, subscription management
- **Customization**: Branded experience with custom themes and content

## 🔒 Security Implementation

### Authentication & Authorization
- **Azure Active Directory**: Integration for enterprise identity
- **OAuth 2.0/JWT**: Standard-compliant token validation
- **API Keys**: Subscription-based access control
- **IP Restrictions**: Network-level security controls

### Data Protection
- **HTTPS Enforcement**: All traffic encrypted in transit
- **Key Vault**: Secure certificate and secret management
- **Managed Identity**: Eliminates credential exposure
- **Network Security**: VNet integration for private connectivity

### Compliance Features
- **Audit Logging**: Complete request/response logging
- **Data Residency**: Region-specific deployments
- **Access Controls**: Role-based access management
- **Monitoring**: Real-time security event tracking

## 📊 Monitoring & Analytics

### Performance Metrics
- **Request Latency**: P50, P95, P99 percentiles
- **Throughput**: Requests per second, concurrent connections
- **Error Rates**: 4xx/5xx response tracking
- **Cache Performance**: Hit ratios, cache efficiency

### Health Monitoring
- **Health Checks**: Automated endpoint monitoring
- **Circuit Breakers**: Automatic failure protection
- **Dependency Tracking**: Backend service health
- **SLA Monitoring**: Availability and performance SLAs

### Custom Analytics
- **Business Metrics**: API usage patterns, feature adoption
- **User Analytics**: Geographic distribution, usage trends
- **Cost Analysis**: Resource utilization, optimization opportunities
- **Capacity Planning**: Growth projections, scaling recommendations

## 🔄 DevOps Integration

### CI/CD Pipeline Support
- **Bicep Validation**: Template linting and validation
- **Parameter Management**: Environment-specific configurations
- **Deployment Automation**: Azure DevOps/GitHub Actions integration
- **Rollback Capabilities**: Safe deployment strategies

### Environment Management
- **Blue-Green Deployments**: Zero-downtime updates
- **Feature Flags**: Gradual feature rollouts
- **Configuration Management**: Environment isolation
- **Compliance Scanning**: Automated security assessments

## 🛠️ Maintenance & Operations

### Regular Tasks
1. **Certificate Renewal**: Monitor Key Vault certificate expiration
2. **Capacity Planning**: Review metrics and scale as needed
3. **Security Updates**: Apply latest API Management updates
4. **Policy Reviews**: Validate and update security policies

### Backup & Recovery
- **Configuration Backup**: API definitions and policies
- **Disaster Recovery**: Multi-region deployment options
- **Data Export**: Analytics and audit log archival
- **Point-in-Time Recovery**: Service configuration snapshots

### Cost Optimization
- **Resource Tagging**: Comprehensive cost allocation
- **Usage Analysis**: Identify optimization opportunities
- **Reserved Instances**: Long-term cost savings
- **Auto-scaling**: Dynamic capacity adjustment

## 📚 Documentation Links

- [Azure API Management Documentation](https://docs.microsoft.com/en-us/azure/api-management/)
- [Architecture Diagrams](../../docs/architecture/azure-cloud-architecture.md)
- [Sequence Diagrams](../../docs/sequence-diagrams/azure-api-management-flow.md)
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

## 🆘 Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Validate template syntax
az deployment group validate \
  --resource-group YOUR_RG \
  --template-file api-management.bicep \
  --parameters @api-management.parameters.dev.json

# Check deployment status
az deployment group list --resource-group YOUR_RG --query "[?contains(name, 'apim-deployment')]"
```

#### Access Issues
```bash
# Verify permissions
az role assignment list --assignee $(az account show --query user.name -o tsv)

# Check resource health
az resource show --ids /subscriptions/YOUR_SUB/resourceGroups/YOUR_RG/providers/Microsoft.ApiManagement/service/YOUR_APIM
```

#### Performance Issues
```bash
# Review metrics
az monitor metrics list \
  --resource /subscriptions/YOUR_SUB/resourceGroups/YOUR_RG/providers/Microsoft.ApiManagement/service/YOUR_APIM \
  --metric "Requests,Duration,Capacity"
```

### Support Resources
- **Azure Support**: Create support tickets for platform issues
- **Community**: Stack Overflow with `azure-api-management` tag
- **Documentation**: Microsoft Learn modules and tutorials
- **Best Practices**: Azure Architecture Center guidance

## 🤝 Contributing

When making changes to the infrastructure:

1. **Test Locally**: Validate Bicep templates before committing
2. **Environment Isolation**: Test in development before production
3. **Documentation**: Update README and architecture diagrams
4. **Security Review**: Ensure compliance with security policies
5. **Performance Testing**: Validate performance impact of changes

## 📝 License

This infrastructure template is part of the Golden Path React + Java + Azure template. See the main repository README for license information.