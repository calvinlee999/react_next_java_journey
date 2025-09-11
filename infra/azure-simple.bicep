// Simplified Azure Infrastructure for Next.js with CDN and Container Apps
// Supports both Static Generation (Blob Storage + CDN) and SSR (Container Apps)

@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Name of the environment')
param environmentName string

@description('Principal ID for role assignments')
param principalId string = ''

// Variables
var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))
var tags = { 
  'azd-env-name': environmentName
}

// ================================
// Storage Account for Static Assets
// ================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    allowCrossTenantReplication: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    publicNetworkAccess: 'Enabled'
  }
}

// Blob Services configuration
resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'HEAD', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// Container for static assets
resource staticAssetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'static-assets'
  properties: {
    publicAccess: 'Blob'
  }
}

// Web container for static website hosting
resource webContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: '$web'
  properties: {
    publicAccess: 'Blob'
  }
}

// ================================
// CDN Profile and Endpoint
// ================================
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: 'cdn-${resourceToken}'
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: 'cdn-endpoint-${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'text/plain'
      'text/html'
      'text/css'
      'application/x-javascript'
      'text/javascript'
      'application/javascript'
      'application/json'
      'application/xml'
    ]
    isCompressionEnabled: true
    
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
          httpPort: 80
          httpsPort: 443
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
  }
}

// ================================
// Log Analytics and Application Insights
// ================================
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${resourceToken}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// ================================
// Container Apps Environment
// ================================
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${resourceToken}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// ================================
// Container Registry
// ================================
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acr${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
  }
}

// ================================
// Container App for Next.js SSR
// ================================
resource nextjsContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-nextjs-${resourceToken}'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'nextjs-app'
          image: '${containerRegistry.properties.loginServer}/nextjs-app:latest'
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'CLOUD_PROVIDER'
              value: 'azure'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            }
            {
              name: 'AZURE_CDN_ENDPOINT'
              value: 'https://${cdnEndpoint.properties.hostName}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3000
              }
              initialDelaySeconds: 30
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3000
              }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 2
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

// ================================
// Role Assignments
// ================================
resource storageContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  scope: storageAccount
  name: guid(storageAccount.id, principalId, 'Storage Blob Data Contributor')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: principalId
  }
}

// ================================
// Outputs
// ================================
output AZURE_STORAGE_ACCOUNT_NAME string = storageAccount.name
output AZURE_STORAGE_ACCOUNT_KEY string = storageAccount.listKeys().keys[0].value
output AZURE_CDN_ENDPOINT string = 'https://${cdnEndpoint.properties.hostName}'
output AZURE_CDN_PROFILE_NAME string = cdnProfile.name
output AZURE_CONTAINER_REGISTRY_SERVER string = containerRegistry.properties.loginServer
output AZURE_CONTAINER_REGISTRY_USERNAME string = containerRegistry.listCredentials().username
output AZURE_CONTAINER_APPS_ENVIRONMENT_NAME string = containerAppsEnvironment.name
output AZURE_CONTAINER_APP_URL string = 'https://${nextjsContainerApp.properties.configuration.ingress.fqdn}'
output AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING string = applicationInsights.properties.ConnectionString
