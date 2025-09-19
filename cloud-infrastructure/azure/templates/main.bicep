// Main Bicep template for Azure Cross-Border Payment Infrastructure
targetScope = 'resourceGroup'

// ================================
// PARAMETERS
// ================================

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource naming')
param uniqueSuffix string = substring(uniqueString(resourceGroup().id), 0, 6)

@description('Administrator username')
@secure()
param adminUsername string

@description('Administrator password')
@secure()
param adminPassword string

@description('SSH public key for Linux VMs')
param sshPublicKey string

// ================================
// VARIABLES
// ================================

var resourceNames = {
  vnet: 'vnet-payments-${environment}-${uniqueSuffix}'
  aks: 'aks-payments-${environment}-${uniqueSuffix}'
  sqlServer: 'sql-payments-${environment}-${uniqueSuffix}'
  cosmosDb: 'cosmos-payments-${environment}-${uniqueSuffix}'
  eventHub: 'eh-payments-${environment}-${uniqueSuffix}'
  serviceBus: 'sb-payments-${environment}-${uniqueSuffix}'
  apiManagement: 'apim-payments-${environment}-${uniqueSuffix}'
  keyVault: 'kv-payments-${environment}-${uniqueSuffix}'
  logAnalytics: 'law-payments-${environment}-${uniqueSuffix}'
  appInsights: 'ai-payments-${environment}-${uniqueSuffix}'
  synapse: 'syn-payments-${environment}-${uniqueSuffix}'
  machineLearning: 'ml-payments-${environment}-${uniqueSuffix}'
  managedIdentity: 'mi-payments-${environment}-${uniqueSuffix}'
}

var tags = {
  Environment: environment
  Application: 'cross-border-payments'
  CostCenter: 'fintech-operations'
  Owner: 'payment-platform-team'
  Compliance: 'pci-dss-level1'
}

// Environment-specific configurations
var environmentConfig = {
  dev: {
    aksSku: 'Free'
    aksNodeCount: 2
    aksNodeSize: 'Standard_D2s_v3'
    sqlSku: 'S2'
    cosmosDbThroughput: 400
    eventHubSku: 'Standard'
    serviceBusSku: 'Standard'
    apiManagementSku: 'Developer'
    synapseNodeSize: 'Small'
  }
  staging: {
    aksSku: 'Standard'
    aksNodeCount: 3
    aksNodeSize: 'Standard_D4s_v3'
    sqlSku: 'S4'
    cosmosDbThroughput: 1000
    eventHubSku: 'Standard'
    serviceBusSku: 'Premium'
    apiManagementSku: 'Standard'
    synapseNodeSize: 'Medium'
  }
  prod: {
    aksSku: 'Standard'
    aksNodeCount: 5
    aksNodeSize: 'Standard_D8s_v3'
    sqlSku: 'P2'
    cosmosDbThroughput: 10000
    eventHubSku: 'Premium'
    serviceBusSku: 'Premium'
    apiManagementSku: 'Premium'
    synapseNodeSize: 'Large'
  }
}

// ================================
// MODULES
// ================================

// Managed Identity
module managedIdentity 'modules/identity/managed-identity.bicep' = {
  name: 'managedIdentity-deployment'
  params: {
    name: resourceNames.managedIdentity
    location: location
    tags: tags
  }
}

// Virtual Network
module vnet 'modules/network/vnet.bicep' = {
  name: 'vnet-deployment'
  params: {
    name: resourceNames.vnet
    location: location
    tags: tags
    environment: environment
  }
}

// Network Security Groups
module nsg 'modules/network/nsg.bicep' = {
  name: 'nsg-deployment'
  params: {
    location: location
    tags: tags
    environment: environment
  }
  dependsOn: [
    vnet
  ]
}

// Key Vault
module keyVault 'modules/identity/key-vault.bicep' = {
  name: 'keyVault-deployment'
  params: {
    name: resourceNames.keyVault
    location: location
    tags: tags
    managedIdentityPrincipalId: managedIdentity.outputs.principalId
    environment: environment
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/monitoring/log-analytics.bicep' = {
  name: 'logAnalytics-deployment'
  params: {
    name: resourceNames.logAnalytics
    location: location
    tags: tags
    environment: environment
  }
}

// Application Insights
module appInsights 'modules/monitoring/app-insights.bicep' = {
  name: 'appInsights-deployment'
  params: {
    name: resourceNames.appInsights
    location: location
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// Azure Kubernetes Service
module aks 'modules/compute/aks.bicep' = {
  name: 'aks-deployment'
  params: {
    name: resourceNames.aks
    location: location
    tags: tags
    environment: environment
    sku: environmentConfig[environment].aksSku
    nodeCount: environmentConfig[environment].aksNodeCount
    nodeSize: environmentConfig[environment].aksNodeSize
    vnetSubnetId: vnet.outputs.aksSubnetId
    managedIdentityId: managedIdentity.outputs.id
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    sshPublicKey: sshPublicKey
  }
}

// Azure SQL Database
module sqlDatabase 'modules/data/sql-database.bicep' = {
  name: 'sqlDatabase-deployment'
  params: {
    serverName: resourceNames.sqlServer
    location: location
    tags: tags
    environment: environment
    sku: environmentConfig[environment].sqlSku
    adminUsername: adminUsername
    adminPassword: adminPassword
    vnetSubnetId: vnet.outputs.dataSubnetId
    managedIdentityId: managedIdentity.outputs.id
  }
}

// Azure Cosmos DB
module cosmosDb 'modules/data/cosmos-db.bicep' = {
  name: 'cosmosDb-deployment'
  params: {
    name: resourceNames.cosmosDb
    location: location
    tags: tags
    environment: environment
    throughput: environmentConfig[environment].cosmosDbThroughput
    vnetSubnetId: vnet.outputs.dataSubnetId
  }
}

// Azure Event Hubs
module eventHubs 'modules/messaging/event-hubs.bicep' = {
  name: 'eventHubs-deployment'
  params: {
    namespaceName: resourceNames.eventHub
    location: location
    tags: tags
    environment: environment
    sku: environmentConfig[environment].eventHubSku
    vnetSubnetId: vnet.outputs.messagingSubnetId
  }
}

// Azure Service Bus
module serviceBus 'modules/messaging/service-bus.bicep' = {
  name: 'serviceBus-deployment'
  params: {
    namespaceName: resourceNames.serviceBus
    location: location
    tags: tags
    environment: environment
    sku: environmentConfig[environment].serviceBusSku
    vnetSubnetId: vnet.outputs.messagingSubnetId
  }
}

// Azure API Management
module apiManagement 'modules/api/api-management.bicep' = {
  name: 'apiManagement-deployment'
  params: {
    name: resourceNames.apiManagement
    location: location
    tags: tags
    environment: environment
    sku: environmentConfig[environment].apiManagementSku
    vnetSubnetId: vnet.outputs.apiSubnetId
    appInsightsId: appInsights.outputs.id
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
  }
}

// Azure Synapse Analytics
module synapse 'modules/data/synapse.bicep' = {
  name: 'synapse-deployment'
  params: {
    workspaceName: resourceNames.synapse
    location: location
    tags: tags
    environment: environment
    nodeSize: environmentConfig[environment].synapseNodeSize
    managedIdentityId: managedIdentity.outputs.id
    storageAccountName: 'st${replace(resourceNames.synapse, '-', '')}dl'
  }
}

// Azure Machine Learning
module machineLearning 'modules/ml/machine-learning.bicep' = {
  name: 'machineLearning-deployment'
  params: {
    workspaceName: resourceNames.machineLearning
    location: location
    tags: tags
    environment: environment
    managedIdentityId: managedIdentity.outputs.id
    keyVaultId: keyVault.outputs.id
    appInsightsId: appInsights.outputs.id
    storageAccountName: 'st${replace(resourceNames.machineLearning, '-', '')}ml'
  }
}

// Azure Monitor Alerts
module monitoring 'modules/monitoring/monitor.bicep' = {
  name: 'monitoring-deployment'
  params: {
    location: location
    tags: tags
    environment: environment
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    aksClusterName: aks.outputs.name
    sqlServerName: sqlDatabase.outputs.serverName
    apiManagementName: apiManagement.outputs.name
  }
}

// ================================
// OUTPUTS
// ================================

output resourceGroupName string = resourceGroup().name
output location string = location
output environment string = environment

// Networking
output vnetId string = vnet.outputs.id
output vnetName string = vnet.outputs.name

// Compute
output aksClusterName string = aks.outputs.name
output aksFqdn string = aks.outputs.fqdn

// Data Services
output sqlServerName string = sqlDatabase.outputs.serverName
output sqlDatabaseName string = sqlDatabase.outputs.databaseName
output cosmosDbAccountName string = cosmosDb.outputs.accountName
output synapseWorkspaceName string = synapse.outputs.workspaceName

// Messaging
output eventHubNamespace string = eventHubs.outputs.namespaceName
output serviceBusNamespace string = serviceBus.outputs.namespaceName

// API Management
output apiManagementGatewayUrl string = apiManagement.outputs.gatewayUrl
output apiManagementPortalUrl string = apiManagement.outputs.portalUrl

// Security
output keyVaultName string = keyVault.outputs.name
output managedIdentityId string = managedIdentity.outputs.id

// Monitoring
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
output appInsightsName string = appInsights.outputs.name

// Machine Learning
output machineLearningWorkspaceName string = machineLearning.outputs.workspaceName