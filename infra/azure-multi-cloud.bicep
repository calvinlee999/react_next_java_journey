// Enhanced Azure Infrastructure for Next.js with CDN and Container Apps
// Supports both Static Generation (Blob Storage + CDN) and SSR (Container Apps)

@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Name of the environment')
param environmentName string

@description('Deployment type: static, ssr, or hybrid')
@allowed(['static', 'ssr', 'hybrid'])
param deploymentType string = 'hybrid'

@description('Principal ID for role assignments')
param principalId string = ''

// Variables
var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))
var tags = { 
  'azd-env-name': environmentName
  'deployment-type': deploymentType
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
    
    // Enable static website hosting
    staticWebsite: {
      enabled: true
      indexDocument: 'index.html'
      errorDocument404Path: 'index.html'
    }
    
    // CORS configuration for web apps
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
  }
}

// Container for static assets
resource staticAssetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
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
  properties: {}
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: 'cdn-endpoint-${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    originHostHeader: storageAccount.properties.primaryEndpoints.web
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
    
    deliveryPolicy: {
      rules: [
        {
          name: 'StaticAssetsCaching'
          order: 1
          conditions: [
            {
              name: 'UrlPath'
              parameters: {
                operator: 'BeginsWith'
                matchValues: ['/_next/static/']
                transforms: []
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlPathMatchConditionParameters'
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '365.00:00:00'
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleCacheExpirationActionParameters'
              }
            }
          ]
        }
        {
          name: 'SPARouting'
          order: 2
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                operator: 'Equal'
                matchValues: ['']
                transforms: ['Lowercase']
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlFileExtensionMatchConditionParameters'
              }
            }
          ]
          actions: [
            {
              name: 'UrlRewrite'
              parameters: {
                sourcePattern: '/'
                destination: '/index.html'
                preserveUnmatchedPath: false
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRewriteActionParameters'
              }
            }
          ]
        }
      ]
    }
  }
}

// ================================
// Container Apps Environment (for SSR)
// ================================
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = if (deploymentType == 'ssr' || deploymentType == 'hybrid') {
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

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = if (deploymentType == 'ssr' || deploymentType == 'hybrid') {
  name: 'cae-${resourceToken}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? logAnalyticsWorkspace.properties.customerId : ''
        sharedKey: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? logAnalyticsWorkspace.listKeys().primarySharedKey : ''
      }
    }
  }
}

// ================================
// Container Registry
// ================================
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = if (deploymentType == 'ssr' || deploymentType == 'hybrid') {
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
resource nextjsContainerApp 'Microsoft.App/containerApps@2023-05-01' = if (deploymentType == 'ssr' || deploymentType == 'hybrid') {
  name: 'ca-nextjs-${resourceToken}'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerAppsEnvironment.id : ''
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
          server: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerRegistry.properties.loginServer : ''
          username: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerRegistry.listCredentials().username : ''
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerRegistry.listCredentials().passwords[0].value : ''
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'nextjs-app'
          image: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? '${containerRegistry.properties.loginServer}/nextjs-app:latest' : 'nginx:alpine'
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
// Application Insights
// ================================
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${resourceToken}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? logAnalyticsWorkspace.id : ''
  }
}

// ================================
// Front Door for Global CDN and Routing
// ================================
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = if (deploymentType == 'hybrid') {
  name: 'fd-${resourceToken}'
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = if (deploymentType == 'hybrid') {
  parent: frontDoorProfile
  name: 'fd-endpoint-${resourceToken}'
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

// Origin group for static assets
resource staticOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = if (deploymentType == 'hybrid') {
  parent: frontDoorProfile
  name: 'static-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/index.html'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

// Origin for static assets (CDN endpoint)
resource staticOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = if (deploymentType == 'hybrid') {
  parent: staticOriginGroup
  name: 'static-origin'
  properties: {
    hostName: cdnEndpoint.properties.hostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: cdnEndpoint.properties.hostName
    priority: 1
    weight: 1000
    enabled: true
  }
}

// Origin group for SSR
resource ssrOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = if (deploymentType == 'hybrid') {
  parent: frontDoorProfile
  name: 'ssr-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/api/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

// Origin for SSR (Container App)
resource ssrOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = if (deploymentType == 'hybrid') {
  parent: ssrOriginGroup
  name: 'ssr-origin'
  properties: {
    hostName: (deploymentType == 'ssr' || deploymentType == 'hybrid') ? nextjsContainerApp.properties.configuration.ingress.fqdn : ''
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabled: true
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
output AZURE_CONTAINER_REGISTRY_SERVER string = (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerRegistry.properties.loginServer : ''
output AZURE_CONTAINER_REGISTRY_USERNAME string = (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerRegistry.listCredentials().username : ''
output AZURE_CONTAINER_APPS_ENVIRONMENT_NAME string = (deploymentType == 'ssr' || deploymentType == 'hybrid') ? containerAppsEnvironment.name : ''
output AZURE_CONTAINER_APP_URL string = (deploymentType == 'ssr' || deploymentType == 'hybrid') ? 'https://${nextjsContainerApp.properties.configuration.ingress.fqdn}' : ''
output AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING string = applicationInsights.properties.ConnectionString
output AZURE_FRONT_DOOR_ENDPOINT string = (deploymentType == 'hybrid') ? 'https://${frontDoorEndpoint.properties.hostName}' : ''
