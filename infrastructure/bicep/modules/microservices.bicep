// Microservices Infrastructure Module
// Implements backend services infrastructure with databases and caching

@description('Environment name')
param environment string

@description('Azure region for deployment')
param location string

@description('Resource prefix for naming')
param prefix string

@description('Resource tags')
param tags object

@description('Virtual Network ID')
param vnetId string

@description('Microservices Subnet ID')
param microservicesSubnetId string

@description('Database Subnet ID')
param databaseSubnetId string

@description('Key Vault ID for secrets')
param keyVaultId string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Container Registry ID')
param containerRegistryId string

// Azure SQL Database for transactional data
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${prefix}-${environment}-sql'
  location: location
  tags: tags
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: 'P@ssw0rd123!' // In production, use Key Vault reference
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    restrictOutboundNetworkAccess: 'Disabled'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: '${prefix}-${environment}-db'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'S2' : 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environment == 'prod' ? 268435456000 : 2147483648 // 250GB vs 2GB
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: environment == 'prod' ? true : false
    readScale: environment == 'prod' ? 'Enabled' : 'Disabled'
    requestedBackupStorageRedundancy: 'Geo'
  }
}

// PostgreSQL Database for application data
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${prefix}-${environment}-postgres'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Standard_D2s_v3' : 'Standard_B1ms'
    tier: environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    administratorLogin: 'pgadmin'
    administratorLoginPassword: 'P@ssw0rd123!' // In production, use Key Vault reference
    version: '14'
    storage: {
      storageSizeGB: environment == 'prod' ? 256 : 32
      autoGrow: 'Enabled'
      tier: 'P10'
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 30 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: databaseSubnetId
      privateDnsZoneArmResourceId: postgresPrivateDnsZone.id
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Enabled'
      dayOfWeek: 0
      startHour: 2
      startMinute: 0
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: '${prefix}appdb'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Private DNS Zone for PostgreSQL
resource postgresPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${prefix}-${environment}.postgres.database.azure.com'
  location: 'global'
  tags: tags
}

resource postgresPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresPrivateDnsZone
  name: '${prefix}-${environment}-postgres-dns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// Azure Cosmos DB for NoSQL data
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-09-15' = {
  name: '${prefix}-${environment}-cosmos'
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: environment == 'prod' ? true : false
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: environment == 'prod' ? 240 : 1440
        backupRetentionIntervalInHours: environment == 'prod' ? 720 : 168
        backupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
      }
    }
    isVirtualNetworkFilterEnabled: true
    virtualNetworkRules: [
      {
        id: microservicesSubnetId
        ignoreMissingVNetServiceEndpoint: false
      }
    ]
    ipRules: []
    disableKeyBasedMetadataWriteAccess: false
    enableFreeTier: environment != 'prod'
    enableAnalyticalStorage: false
    analyticalStorageConfiguration: {
      schemaType: 'WellDefined'
    }
    publicNetworkAccess: 'Enabled'
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    cors: []
    disableLocalAuth: false
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-09-15' = {
  parent: cosmosAccount
  name: '${prefix}AppDatabase'
  properties: {
    resource: {
      id: '${prefix}AppDatabase'
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-09-15' = {
  parent: cosmosDatabase
  name: 'UserData'
  properties: {
    resource: {
      id: 'UserData'
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      defaultTtl: -1
    }
  }
}

// Azure Cache for Redis
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: '${prefix}-${environment}-redis'
  location: location
  tags: tags
  properties: {
    sku: {
      name: environment == 'prod' ? 'Premium' : 'Standard'
      family: environment == 'prod' ? 'P' : 'C'
      capacity: environment == 'prod' ? 1 : 0
    }
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxfragmentationmemory-reserved': environment == 'prod' ? '90' : '30'
      'maxmemory-reserved': environment == 'prod' ? '90' : '30'
    }
    enableNonSslPort: false
    redisVersion: '6'
    publicNetworkAccess: 'Enabled'
    subnetId: environment == 'prod' ? microservicesSubnetId : null
    staticIP: null
  }
}

// Azure Service Bus for messaging
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: '${prefix}-${environment}-servicebus'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Standard'
    tier: environment == 'prod' ? 'Premium' : 'Standard'
  }
  properties: {
    premiumMessagingPartitions: environment == 'prod' ? 1 : 0
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    zoneRedundant: environment == 'prod' ? true : false
  }
}

resource serviceBusQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'user-events'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: false
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    maxDeliveryCount: 10
    enablePartitioning: false
  }
}

resource serviceBusTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'platform-events'
  properties: {
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: false
    defaultMessageTimeToLive: 'P14D'
    enableBatchedOperations: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enablePartitioning: false
  }
}

// App Service Plan for hosting backend services
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${prefix}-${environment}-asp'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'P1v3' : 'B1'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
    size: environment == 'prod' ? 'P1v3' : 'B1'
    family: environment == 'prod' ? 'Pv3' : 'B'
    capacity: environment == 'prod' ? 2 : 1
  }
  kind: 'linux'
  properties: {
    perSiteScaling: false
    elasticScaleEnabled: false
    maximumElasticWorkerCount: 1
    isSpot: false
    reserved: true
    isXenon: false
    hyperV: false
    targetWorkerCount: 0
    targetWorkerSizeId: 0
    zoneRedundant: environment == 'prod' ? true : false
  }
}

// Outputs
output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName

output postgresServerName string = postgresServer.name
output postgresDatabaseName string = postgresDatabase.name
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName

output cosmosDbAccountName string = cosmosAccount.name
output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDatabaseName string = cosmosDatabase.name

output redisCacheName string = redisCache.name
output redisCacheHostName string = redisCache.properties.hostName
output redisCachePort int = redisCache.properties.port
output redisCacheSslPort int = redisCache.properties.sslPort

output serviceBusNamespaceName string = serviceBusNamespace.name
output serviceBusEndpoint string = 'https://${serviceBusNamespace.name}.servicebus.windows.net/'

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
