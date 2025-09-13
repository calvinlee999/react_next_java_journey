@description('Confluent Cloud on Azure Marketplace integration with Azure API Management')
param location string = resourceGroup().location
param environmentName string = 'dev'
param confluentServiceName string = 'confluent-kafka-${environmentName}'
param apiManagementName string = 'apim-${environmentName}'
param storageAccountName string = 'confluentstore${environmentName}'
param keyVaultName string = 'kv-confluent-${environmentName}'

// Tags for resource organization
var commonTags = {
  Environment: environmentName
  Project: 'Azure-Level1-Confluent'
  Purpose: 'Event-Driven-Architecture'
  CreatedBy: 'Bicep-Template'
}

// Storage Account for Kafka message persistence and Flink checkpoints
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

// Blob containers for different Kafka/Flink use cases
resource kafkaTopicsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/kafka-topics'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Kafka topic configurations and schemas'
    }
  }
}

resource flinkCheckpointsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/flink-checkpoints'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Apache Flink checkpoint storage'
    }
  }
}

resource schemaRegistryContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/schema-registry'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Schema Registry backup and versioning'
    }
  }
}

// Key Vault for Confluent Cloud credentials and Kafka certificates
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: commonTags
  properties: {
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
  }
}

// API Management instance with AsyncAPI support
resource apiManagement 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apiManagementName
  location: location
  tags: commonTags
  sku: {
    name: 'Developer'
    capacity: 1
  }
  properties: {
    publisherEmail: 'admin@company.com'
    publisherName: 'Azure Level 1 Team'
    notificationSenderEmail: 'apimgmt-noreply@mail.windowsazure.com'
    hostnameConfigurations: [
      {
        type: 'Proxy'
        hostName: '${apiManagementName}.azure-api.net'
        defaultSslBinding: true
        certificateSource: 'BuiltIn'
      }
    ]
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'False'
    }
    virtualNetworkType: 'None'
    disableGateway: false
    apiVersionConstraint: {
      minApiVersion: '2019-12-01'
    }
  }
}

// Log Analytics Workspace for monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-confluent-${environmentName}'
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

// Application Insights for Kafka/Flink applications monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-confluent-${environmentName}'
  location: location
  kind: 'web'
  tags: commonTags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Named Values in API Management for Confluent Cloud integration
resource confluentClusterUrlNamedValue 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  name: 'confluent-cluster-url'
  properties: {
    displayName: 'Confluent-Cluster-URL'
    value: 'https://pkc-example.us-west-2.aws.confluent.cloud:9092'
    secret: false
    tags: ['confluent', 'kafka']
  }
  parent: apiManagement
}

resource confluentApiKeyNamedValue 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  name: 'confluent-api-key'
  properties: {
    displayName: 'Confluent-API-Key'
    keyVault: {
      secretIdentifier: '${keyVault.properties.vaultUri}secrets/confluent-api-key'
    }
    secret: true
    tags: ['confluent', 'authentication']
  }
  parent: apiManagement
}

resource confluentApiSecretNamedValue 'Microsoft.ApiManagement/service/namedValues@2023-05-01-preview' = {
  name: 'confluent-api-secret'
  properties: {
    displayName: 'Confluent-API-Secret'
    keyVault: {
      secretIdentifier: '${keyVault.properties.vaultUri}secrets/confluent-api-secret'
    }
    secret: true
    tags: ['confluent', 'authentication']
  }
  parent: apiManagement
}

// Event Hubs Namespace for hybrid scenarios and Azure-native integration
resource eventHubsNamespace 'Microsoft.EventHub/namespaces@2023-01-01-preview' = {
  name: 'ehns-confluent-${environmentName}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 1
  }
  tags: commonTags
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    zoneRedundant: false
    isAutoInflateEnabled: true
    maximumThroughputUnits: 10
    kafkaEnabled: true
  }
}

// Event Hub for Kafka compatibility testing
resource eventHub 'Microsoft.EventHub/namespaces/eventhubs@2023-01-01-preview' = {
  name: 'kafka-compat-events'
  properties: {
    messageRetentionInDays: 3
    partitionCount: 4
    status: 'Active'
  }
  parent: eventHubsNamespace
}

// Outputs for integration with other systems
output apiManagementName string = apiManagement.name
output apiManagementUrl string = 'https://${apiManagement.properties.gatewayUrl}'
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output storageAccountName string = storageAccount.name
output storageAccountBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
output eventHubsNamespace string = eventHubsNamespace.name
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id

// Resource naming outputs for other templates
output resourceNames object = {
  apiManagement: apiManagement.name
  keyVault: keyVault.name
  storageAccount: storageAccount.name
  applicationInsights: applicationInsights.name
  eventHubsNamespace: eventHubsNamespace.name
  logAnalyticsWorkspace: logAnalyticsWorkspace.name
}
