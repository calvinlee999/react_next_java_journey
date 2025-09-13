// Azure Static Content Delivery - Level 1 Well-Architected Framework
// Implements Azure Blob Storage, CDN, and Front Door for global content delivery

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Location for Azure resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'reactjavajourney'

@description('Enable Azure Front Door for advanced routing and WAF')
param enableFrontDoor bool = true

@description('Enable Azure CDN for content caching')
param enableCDN bool = true

@description('Enable static website hosting on Blob Storage')
param enableStaticWebsite bool = true

@description('Tags for resource organization')
param tags object = {
  Environment: environment
  Application: appName
  ManagedBy: 'Bicep'
  Purpose: 'StaticContentDelivery'
}

// Variables
var storageAccountName = '${appName}${environment}storage${uniqueString(resourceGroup().id)}'
var cdnProfileName = '${appName}-${environment}-cdn'
var frontDoorProfileName = '${appName}-${environment}-frontdoor'
var staticWebsiteContainerName = '$web'

// Azure Storage Account for Static Content
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    accessTier: 'Hot'
    publicNetworkAccess: 'Enabled'
    allowSharedKeyAccess: true
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// Enable static website hosting via management API
resource staticWebsiteConfig 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = if (enableStaticWebsite) {
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
          maxAgeInSeconds: 86400
        }
      ]
    }
  }
}

// Static Website Container
resource staticWebsiteContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = if (enableStaticWebsite) {
  parent: staticWebsiteConfig
  name: staticWebsiteContainerName
  properties: {
    publicAccess: 'Blob'
    metadata: {
      purpose: 'static-website-hosting'
      environment: environment
    }
  }
}

// Assets Container for Images, CSS, JS
resource assetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: staticWebsiteConfig
  name: 'assets'
  properties: {
    publicAccess: 'Blob'
    metadata: {
      purpose: 'static-assets'
      environment: environment
    }
  }
}

// Media Container for Videos, Audio, Large Files
resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: staticWebsiteConfig
  name: 'media'
  properties: {
    publicAccess: 'Blob'
    metadata: {
      purpose: 'media-content'
      environment: environment
    }
  }
}

// CDN Profile
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = if (enableCDN) {
  name: cdnProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_Microsoft'
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

// CDN Endpoint for Static Website
resource cdnEndpointWebsite 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = if (enableCDN && enableStaticWebsite) {
  parent: cdnProfile
  name: '${appName}-${environment}-website'
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
      'image/svg+xml'
    ]
    isCompressionEnabled: true
    optimizationType: 'GeneralWebDelivery'
    origins: [
      {
        name: 'static-website-origin'
        properties: {
          hostName: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
          httpPort: 80
          httpsPort: 443
          originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
  }
}

// CDN Endpoint for Assets
resource cdnEndpointAssets 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = if (enableCDN) {
  parent: cdnProfile
  name: '${appName}-${environment}-assets'
  location: 'Global'
  tags: tags
  properties: {
    originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'text/plain'
      'text/css'
      'application/x-javascript'
      'text/javascript'
      'application/javascript'
      'application/json'
      'image/svg+xml'
    ]
    isCompressionEnabled: true
    optimizationType: 'GeneralWebDelivery'
    origins: [
      {
        name: 'blob-storage-origin'
        properties: {
          hostName: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
          httpPort: 80
          httpsPort: 443
          originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
  }
}

// Azure Front Door Profile
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = if (enableFrontDoor) {
  name: frontDoorProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

// Front Door Endpoint
resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = if (enableFrontDoor) {
  parent: frontDoorProfile
  name: '${appName}-${environment}-endpoint'
  location: 'Global'
  tags: tags
  properties: {
    enabledState: 'Enabled'
  }
}

// Origin Group for Static Website
resource frontDoorOriginGroupWebsite 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = if (enableFrontDoor && enableStaticWebsite) {
  parent: frontDoorProfile
  name: 'static-website-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
    sessionAffinityState: 'Disabled'
  }
}

// Origin for Static Website
resource frontDoorOriginWebsite 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = if (enableFrontDoor && enableStaticWebsite) {
  parent: frontDoorOriginGroupWebsite
  name: 'static-website-origin'
  properties: {
    hostName: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
    httpPort: 80
    httpsPort: 443
    originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.web, 'https://', ''), '/', '')
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// Origin Group for Assets
resource frontDoorOriginGroupAssets 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = if (enableFrontDoor) {
  parent: frontDoorProfile
  name: 'assets-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/assets/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
    sessionAffinityState: 'Disabled'
  }
}

// Origin for Assets
resource frontDoorOriginAssets 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = if (enableFrontDoor) {
  parent: frontDoorOriginGroupAssets
  name: 'assets-origin'
  properties: {
    hostName: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
    httpPort: 80
    httpsPort: 443
    originHostHeader: replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// Route for Static Website
resource frontDoorRouteWebsite 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = if (enableFrontDoor && enableStaticWebsite) {
  parent: frontDoorEndpoint
  name: 'website-route'
  properties: {
    originGroup: {
      id: frontDoorOriginGroupWebsite.id
    }
    supportedProtocols: ['Http', 'Https']
    patternsToMatch: ['/*']
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      queryStringCachingBehavior: 'IgnoreQueryString'
      compressionSettings: {
        contentTypesToCompress: [
          'text/plain'
          'text/html'
          'text/css'
          'application/x-javascript'
          'text/javascript'
          'application/javascript'
          'application/json'
          'application/xml'
          'image/svg+xml'
        ]
        isCompressionEnabled: true
      }
    }
  }
  dependsOn: [
    frontDoorOriginWebsite
  ]
}

// Route for Assets
resource frontDoorRouteAssets 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = if (enableFrontDoor) {
  parent: frontDoorEndpoint
  name: 'assets-route'
  properties: {
    originGroup: {
      id: frontDoorOriginGroupAssets.id
    }
    supportedProtocols: ['Http', 'Https']
    patternsToMatch: ['/assets/*', '/media/*']
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      queryStringCachingBehavior: 'IgnoreQueryString'
      compressionSettings: {
        contentTypesToCompress: [
          'text/css'
          'application/x-javascript'
          'text/javascript'
          'application/javascript'
          'image/svg+xml'
        ]
        isCompressionEnabled: true
      }
    }
  }
  dependsOn: [
    frontDoorOriginAssets
  ]
}

// WAF Policy for Front Door
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = if (enableFrontDoor) {
  name: '${appName}${environment}wafpolicy'
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 100
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitRule'
          priority: 1
          enabledState: 'Enabled'
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 1000
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              negateCondition: false
              matchValue: ['0.0.0.0/0']
            }
          ]
          action: 'Block'
        }
      ]
    }
  }
}

// Security Policy Association
resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2023-05-01' = if (enableFrontDoor) {
  parent: frontDoorProfile
  name: 'SecurityPolicy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicy.id
      }
      associations: [
        {
          domains: [
            {
              id: frontDoorEndpoint.id
            }
          ]
          patternsToMatch: ['/*']
        }
      ]
    }
  }
}

// Outputs
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output staticWebsiteUrl string = enableStaticWebsite ? storageAccount.properties.primaryEndpoints.web : ''
output blobStorageUrl string = storageAccount.properties.primaryEndpoints.blob

output cdnProfileName string = enableCDN ? cdnProfile.name : ''
output cdnWebsiteEndpointUrl string = enableCDN && enableStaticWebsite ? 'https://${cdnEndpointWebsite.properties.hostName}' : ''
output cdnAssetsEndpointUrl string = enableCDN ? 'https://${cdnEndpointAssets.properties.hostName}' : ''

output frontDoorProfileName string = enableFrontDoor ? frontDoorProfile.name : ''
output frontDoorEndpointUrl string = enableFrontDoor ? 'https://${frontDoorEndpoint.properties.hostName}' : ''
output frontDoorEndpointHostName string = enableFrontDoor ? frontDoorEndpoint.properties.hostName : ''

output wafPolicyId string = enableFrontDoor ? wafPolicy.id : ''

// Resource URLs for application configuration
output resourceUrls object = {
  staticWebsite: enableStaticWebsite ? storageAccount.properties.primaryEndpoints.web : ''
  blobStorage: storageAccount.properties.primaryEndpoints.blob
  cdnWebsite: enableCDN && enableStaticWebsite ? 'https://${cdnEndpointWebsite.properties.hostName}' : ''
  cdnAssets: enableCDN ? 'https://${cdnEndpointAssets.properties.hostName}' : ''
  frontDoor: enableFrontDoor ? 'https://${frontDoorEndpoint.properties.hostName}' : ''
}
