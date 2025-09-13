@description('Real-time AI Inference with Azure ML, AI Foundry, Personalizer and Confluent Kafka/Flink integration')
param location string = resourceGroup().location
param environmentName string = 'dev'
param projectName string = 'ai-realtime-inference'

// Naming conventions
param aiFoundryResourceName string = 'aif-${projectName}-${environmentName}'
param machineLearningWorkspaceName string = 'mlw-${projectName}-${environmentName}'
param personalizerName string = 'personalizer-${projectName}-${environmentName}'
param confluentServiceName string = 'confluent-${projectName}-${environmentName}'
param apiManagementName string = 'apim-${projectName}-${environmentName}'
param storageAccountName string = 'st${projectName}${environmentName}001'
param keyVaultName string = 'kv-${projectName}-${environmentName}'
param applicationInsightsName string = 'ai-${projectName}-${environmentName}'
param logAnalyticsWorkspaceName string = 'law-${projectName}-${environmentName}'

// AI Model Configuration
param aiModelDeployments array = [
  {
    name: 'gpt-4o-mini'
    modelName: 'gpt-4o-mini'
    modelVersion: 'latest'
    capacity: 20
    purpose: 'text-generation'
  }
  {
    name: 'gpt-5-mini'
    modelName: 'gpt-5-mini'
    modelVersion: 'latest'
    capacity: 30
    purpose: 'text-generation-advanced'
  }
  {
    name: 'text-embedding-ada-002'
    modelName: 'text-embedding-ada-002'
    modelVersion: 'latest'
    capacity: 10
    purpose: 'embeddings'
  }
  {
    name: 'phi-3-5-vision-instruct'
    modelName: 'Phi-3.5-vision-instruct'
    modelVersion: '2'
    capacity: 5
    purpose: 'vision-language'
  }
]

// Kafka Topics for AI Pipeline
param kafkaTopics array = [
  {
    name: 'user-events'
    partitions: 6
    retentionMs: 604800000 // 7 days
  }
  {
    name: 'ai-inference-requests'
    partitions: 12
    retentionMs: 259200000 // 3 days
  }
  {
    name: 'ai-inference-responses'
    partitions: 12
    retentionMs: 259200000 // 3 days
  }
  {
    name: 'personalization-events'
    partitions: 6
    retentionMs: 2592000000 // 30 days
  }
  {
    name: 'real-time-features'
    partitions: 6
    retentionMs: 86400000 // 1 day
  }
]

// Common tags
var commonTags = {
  Environment: environmentName
  Project: projectName
  Purpose: 'Real-Time-AI-Inference'
  CreatedBy: 'Bicep-Template'
  AICapabilities: 'ML-Foundry-Personalizer-Kafka'
}

// Log Analytics Workspace for monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: commonTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights for AI monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: commonTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Key Vault for secure storage of API keys and secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: commonTags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    accessPolicies: []
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Storage Account for ML artifacts and data
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    defaultToOAuthAuthentication: false
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    accessTier: 'Hot'
  }
}

// Container for ML models and datasets
resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: []
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource mlContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'ml-artifacts'
  properties: {
    publicAccess: 'None'
  }
}

resource dataContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'training-data'
  properties: {
    publicAccess: 'None'
  }
}

// Azure Machine Learning Workspace
resource machineLearningWorkspace 'Microsoft.MachineLearningServices/workspaces@2024-04-01' = {
  name: machineLearningWorkspaceName
  location: location
  tags: commonTags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    friendlyName: 'Real-time AI Inference Workspace'
    description: 'Azure ML workspace for real-time AI inference with Kafka integration'
    storageAccount: storageAccount.id
    keyVault: keyVault.id
    applicationInsights: applicationInsights.id
    hbiWorkspace: false
    managedNetwork: {
      isolationMode: 'Disabled'
    }
    publicNetworkAccess: 'Enabled'
    discoveryUrl: 'https://${location}.api.azureml.ms/discovery'
  }
}

// Azure AI Foundry Service (Cognitive Services Multi-Service Account)
resource aiFoundryService 'Microsoft.CognitiveServices/accounts@2024-06-01-preview' = {
  name: aiFoundryResourceName
  location: location
  tags: commonTags
  sku: {
    name: 'S0'
  }
  kind: 'AIServices'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    apiProperties: {
      statisticsEnabled: false
    }
    customSubDomainName: aiFoundryResourceName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    disableLocalAuth: false
  }
}

// AI Foundry Model Deployments
resource aiModelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-06-01-preview' = [for deployment in aiModelDeployments: {
  parent: aiFoundryService
  name: deployment.name
  properties: {
    model: {
      format: 'OpenAI'
      name: deployment.modelName
      version: deployment.modelVersion
    }
    raiPolicyName: 'Microsoft.DefaultV2'
    versionUpgradeOption: 'OnceCurrentVersionExpired'
  }
  sku: {
    name: 'Standard'
    capacity: deployment.capacity
  }
}]

// Azure AI Personalizer
resource personalizer 'Microsoft.CognitiveServices/accounts@2024-06-01-preview' = {
  name: personalizerName
  location: location
  tags: commonTags
  sku: {
    name: 'S0'
  }
  kind: 'Personalizer'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: personalizerName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
  }
}

// Confluent Cloud Service (Marketplace offering)
resource confluentOrganization 'Microsoft.Confluent/organizations@2024-02-13' = {
  name: confluentServiceName
  location: location
  tags: commonTags
  properties: {
    offerDetail: {
      publisherId: 'confluentinc'
      id: 'confluent-cloud-azure-prod'
      planId: 'confluent-cloud-azure-payg-prod'
      planName: 'Confluent Cloud - Pay as you Go'
      termUnit: 'P1M'
    }
    userDetail: {
      firstName: 'Azure'
      lastName: 'Admin'
      emailAddress: 'admin@company.com'
    }
  }
}

// API Management for AI Services Gateway
resource apiManagement 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apiManagementName
  location: location
  tags: commonTags
  sku: {
    name: 'Developer'
    capacity: 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: 'admin@company.com'
    publisherName: 'AI Inference Gateway'
    notificationSenderEmail: 'apimgmt-noreply@mail.windowsazure.com'
    hostnameConfigurations: [
      {
        type: 'Proxy'
        hostName: '${apiManagementName}.azure-api.net'
        negotiateClientCertificate: false
        defaultSslBinding: true
        certificateSource: 'BuiltIn'
      }
    ]
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'False'
    }
    virtualNetworkType: 'None'
    disableGateway: false
    apiVersionConstraint: {}
    publicNetworkAccess: 'Enabled'
  }
}

// Store AI service keys in Key Vault
resource aiFoundryKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ai-foundry-key'
  properties: {
    value: aiFoundryService.listKeys().key1
    contentType: 'text/plain'
  }
}

resource personalizerKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'personalizer-key'
  properties: {
    value: personalizer.listKeys().key1
    contentType: 'text/plain'
  }
}

resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
    contentType: 'text/plain'
  }
}

// RBAC assignments for AI services
resource mlWorkspaceStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, machineLearningWorkspace.id, 'StorageBlobDataContributor')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: machineLearningWorkspace.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource aiFoundryKeyVaultRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, aiFoundryService.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: aiFoundryService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource personalizerKeyVaultRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, personalizer.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: personalizer.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Outputs for integration (secrets stored in Key Vault, not exposed)
output aiFoundryEndpoint string = aiFoundryService.properties.endpoint
output aiFoundryResourceId string = aiFoundryService.id

output machineLearningWorkspaceId string = machineLearningWorkspace.id
output machineLearningWorkspaceName string = machineLearningWorkspace.name

output personalizerEndpoint string = personalizer.properties.endpoint
output personalizerResourceId string = personalizer.id

output confluentOrganizationId string = confluentOrganization.id
output confluentResourceName string = confluentOrganization.name

output apiManagementGatewayUrl string = 'https://${apiManagement.properties.gatewayUrl}'
output apiManagementResourceId string = apiManagement.id

output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultResourceId string = keyVault.id

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id

output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey

output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.properties.customerId
output logAnalyticsResourceId string = logAnalyticsWorkspace.id

// Configuration object for SDK integration
output aiInferenceConfig object = {
  aiFoundry: {
    endpoint: aiFoundryService.properties.endpoint
    resourceId: aiFoundryService.id
    modelDeployments: {
      'gpt-4o-mini': {
        name: 'gpt-4o-mini'
        purpose: 'text-generation'
        endpoint: '${aiFoundryService.properties.endpoint}models'
      }
      'gpt-5-mini': {
        name: 'gpt-5-mini'
        purpose: 'text-generation-advanced'
        endpoint: '${aiFoundryService.properties.endpoint}models'
      }
      'text-embedding-ada-002': {
        name: 'text-embedding-ada-002'
        purpose: 'embeddings'
        endpoint: '${aiFoundryService.properties.endpoint}models'
      }
      'phi-3-5-vision-instruct': {
        name: 'phi-3-5-vision-instruct'
        purpose: 'vision-language'
        endpoint: '${aiFoundryService.properties.endpoint}models'
      }
    }
  }
  machineLearning: {
    workspaceId: machineLearningWorkspace.id
    workspaceName: machineLearningWorkspace.name
    endpoint: 'https://${location}.api.azureml.ms'
  }
  personalizer: {
    endpoint: personalizer.properties.endpoint
    resourceId: personalizer.id
  }
  confluent: {
    organizationId: confluentOrganization.id
    topics: kafkaTopics
  }
  apiManagement: {
    gatewayUrl: apiManagement.properties.gatewayUrl
    resourceId: apiManagement.id
  }
  monitoring: {
    applicationInsights: {
      connectionString: applicationInsights.properties.ConnectionString
      instrumentationKey: applicationInsights.properties.InstrumentationKey
    }
    logAnalytics: {
      workspaceId: logAnalyticsWorkspace.properties.customerId
      resourceId: logAnalyticsWorkspace.id
    }
  }
  storage: {
    accountName: storageAccount.name
    containers: {
      mlArtifacts: mlContainer.name
      trainingData: dataContainer.name
    }
  }
  keyVault: {
    uri: keyVault.properties.vaultUri
    resourceId: keyVault.id
  }
}
