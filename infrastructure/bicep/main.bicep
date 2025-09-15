// Main AI Platform Infrastructure Deployment
// This template orchestrates the complete 13-layer infrastructure deployment

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Primary Azure region for deployment')
param primaryLocation string = 'eastus2'

@description('Secondary Azure region for disaster recovery')
param secondaryLocation string = 'westus2'

@description('Tertiary Azure region for compliance (EU)')
param tertiaryLocation string = 'northeurope'

@description('Resource prefix for naming consistency')
@minLength(2)
@maxLength(10)
param prefix string = 'aiplatform'

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Project: 'AI-Platform'
  CostCenter: 'Technology'
  Owner: 'Platform-Team'
  CreatedBy: 'Bicep-IaC'
}

// Resource Groups
resource primaryRg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${prefix}-${environment}-primary-rg'
  location: primaryLocation
  tags: tags
}

resource secondaryRg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${prefix}-${environment}-secondary-rg'
  location: secondaryLocation
  tags: tags
}

resource tertiaryRg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${prefix}-${environment}-tertiary-rg'
  location: tertiaryLocation
  tags: tags
}

resource sharedRg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${prefix}-${environment}-shared-rg'
  location: primaryLocation
  tags: tags
}

// Layer 1: Security Infrastructure
module security 'modules/security.bicep' = {
  name: 'security-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
  }
}

// Layer 2: Monitoring Infrastructure
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
  }
}

// Layer 3: DevOps Infrastructure
module devops 'modules/devops.bicep' = {
  name: 'devops-deployment'
  scope: sharedRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
  }
}

// Layer 13: Networking Foundation (deployed first)
module networking 'modules/networking.bicep' = {
  name: 'networking-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
  }
}

// Layer 4: Frontend Infrastructure
module frontend 'modules/frontend.bicep' = {
  name: 'frontend-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    frontendSubnetId: networking.outputs.frontendSubnetId
  }
  dependsOn: [
    networking
    security
  ]
}

// Layer 5: API Gateway Infrastructure
module apiGateway 'modules/api-gateway.bicep' = {
  name: 'api-gateway-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    apiGatewaySubnetId: networking.outputs.apiGatewaySubnetId
    keyVaultId: security.outputs.keyVaultId
  }
  dependsOn: [
    networking
    security
  ]
}

// Layer 6-7: MCP Infrastructure (Gateway + Framework)
module mcpPlatform 'modules/mcp-platform.bicep' = {
  name: 'mcp-platform-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    mcpGatewaySubnetId: networking.outputs.mcpGatewaySubnetId
    mcpFrameworkSubnetId: networking.outputs.mcpFrameworkSubnetId
    keyVaultId: security.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    containerRegistryId: devops.outputs.containerRegistryId
  }
  dependsOn: [
    networking
    security
    monitoring
    devops
  ]
}

// Layer 8: AI Platform Infrastructure
module aiPlatform 'modules/ai-platform.bicep' = {
  name: 'ai-platform-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    aiPlatformSubnetId: networking.outputs.aiPlatformSubnetId
    keyVaultId: security.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    networking
    security
    monitoring
  ]
}

// Layer 9: Microservices Infrastructure
module microservices 'modules/microservices.bicep' = {
  name: 'microservices-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    microservicesSubnetId: networking.outputs.microservicesSubnetId
    databaseSubnetId: networking.outputs.databaseSubnetId
    keyVaultId: security.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    containerRegistryId: devops.outputs.containerRegistryId
  }
  dependsOn: [
    networking
    security
    monitoring
    devops
  ]
}

// Layer 10-11: Event Streaming Infrastructure
module eventStreaming 'modules/event-streaming.bicep' = {
  name: 'event-streaming-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    eventStreamingSubnetId: networking.outputs.eventStreamingSubnetId
    keyVaultId: security.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    networking
    security
    monitoring
  ]
}

// Layer 12: Data Platform Infrastructure
module dataPlatform 'modules/data-platform.bicep' = {
  name: 'data-platform-deployment'
  scope: primaryRg
  params: {
    environment: environment
    location: primaryLocation
    prefix: prefix
    tags: tags
    vnetId: networking.outputs.vnetId
    dataPlatformSubnetId: networking.outputs.dataPlatformSubnetId
    keyVaultId: security.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    networking
    security
    monitoring
  ]
}

// Disaster Recovery Infrastructure
module disasterRecovery 'modules/disaster-recovery.bicep' = {
  name: 'disaster-recovery-deployment'
  scope: secondaryRg
  params: {
    environment: environment
    location: secondaryLocation
    prefix: prefix
    tags: tags
    primaryKeyVaultId: security.outputs.keyVaultId
    primaryCosmosDbAccountName: microservices.outputs.cosmosDbAccountName
  }
  dependsOn: [
    security
    microservices
  ]
}

// EU Compliance Infrastructure
module euCompliance 'modules/eu-compliance.bicep' = {
  name: 'eu-compliance-deployment'
  scope: tertiaryRg
  params: {
    environment: environment
    location: tertiaryLocation
    prefix: prefix
    tags: tags
  }
}

// Outputs for reference by other deployments
output resourceGroupIds object = {
  primary: primaryRg.id
  secondary: secondaryRg.id
  tertiary: tertiaryRg.id
  shared: sharedRg.id
}

output networkingOutputs object = networking.outputs
output securityOutputs object = security.outputs
output monitoringOutputs object = monitoring.outputs
output devopsOutputs object = devops.outputs

output deploymentSummary object = {
  environment: environment
  primaryLocation: primaryLocation
  secondaryLocation: secondaryLocation
  tertiaryLocation: tertiaryLocation
  prefix: prefix
  timestamp: utcNow()
  layers: {
    security: 'Deployed'
    monitoring: 'Deployed'
    devops: 'Deployed'
    networking: 'Deployed'
    frontend: 'Deployed'
    apiGateway: 'Deployed'
    mcpPlatform: 'Deployed'
    aiPlatform: 'Deployed'
    microservices: 'Deployed'
    eventStreaming: 'Deployed'
    dataPlatform: 'Deployed'
    disasterRecovery: 'Deployed'
    euCompliance: 'Deployed'
  }
}
