// DevOps Infrastructure Module
// Implements CI/CD pipeline infrastructure with container registry and build agents

@description('Environment name')
param environment string

@description('Azure region for deployment')
param location string

@description('Resource prefix for naming')
param prefix string

@description('Resource tags')
param tags object

// Azure Container Registry for storing container images
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: '${prefix}${environment}acr'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Standard'
  }
  properties: {
    adminUserEnabled: false
    policies: {
      quarantinePolicy: {
        status: 'enabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'enabled'
      }
      retentionPolicy: {
        days: environment == 'prod' ? 30 : 7
        status: 'enabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
    dataEndpointEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    zoneRedundancy: environment == 'prod' ? 'Enabled' : 'Disabled'
  }
}

// Storage Account for build artifacts and cache
resource buildStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${prefix}${environment}buildst'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    dnsEndpointType: 'Standard'
    defaultToOAuthAuthentication: false
    publicNetworkAccess: 'Enabled'
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    networkAcls: {
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
    encryption: {
      requireInfrastructureEncryption: false
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

// Container for build artifacts
resource buildArtifactsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${buildStorageAccount.name}/default/build-artifacts'
  properties: {
    immutableStorageWithVersioning: {
      enabled: false
    }
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: 'None'
  }
}

// Container for deployment packages
resource deploymentPackagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${buildStorageAccount.name}/default/deployment-packages'
  properties: {
    immutableStorageWithVersioning: {
      enabled: false
    }
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: 'None'
  }
}

// Container for test results
resource testResultsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${buildStorageAccount.name}/default/test-results'
  properties: {
    immutableStorageWithVersioning: {
      enabled: false
    }
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: 'None'
  }
}

// Application Insights for DevOps monitoring
resource devopsAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${prefix}-${environment}-devops-insights'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    RetentionInDays: 90
    SamplingPercentage: 100
    DisableIpMasking: false
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Azure DevOps Service Connection (placeholder for manual configuration)
// Note: This typically requires Azure DevOps API calls or manual setup

// GitHub Actions self-hosted runner VM Scale Set (optional)
resource runnerVmss 'Microsoft.Compute/virtualMachineScaleSets@2023-09-01' = if (environment == 'prod') {
  name: '${prefix}-${environment}-runners-vmss'
  location: location
  tags: tags
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'Standard'
    capacity: 2
  }
  properties: {
    orchestrationMode: 'Flexible'
    platformFaultDomainCount: 1
    virtualMachineProfile: {
      storageProfile: {
        osDisk: {
          osType: 'Linux'
          createOption: 'FromImage'
          caching: 'ReadWrite'
          managedDisk: {
            storageAccountType: 'Premium_LRS'
          }
          diskSizeGB: 128
        }
        imageReference: {
          publisher: 'canonical'
          offer: '0001-com-ubuntu-server-focal'
          sku: '20_04-lts-gen2'
          version: 'latest'
        }
      }
      osProfile: {
        computerNamePrefix: '${prefix}-runner'
        adminUsername: 'azureuser'
        disablePasswordAuthentication: true
        linuxConfiguration: {
          ssh: {
            publicKeys: [
              {
                path: '/home/azureuser/.ssh/authorized_keys'
                keyData: 'ssh-rsa PLACEHOLDER_SSH_KEY' // Replace with actual SSH key
              }
            ]
          }
        }
      }
      networkProfile: {
        networkInterfaceConfigurations: [
          {
            name: 'nic-config'
            properties: {
              primary: true
              ipConfigurations: [
                {
                  name: 'ipconfig1'
                  properties: {
                    subnet: {
                      id: '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Network/virtualNetworks/${prefix}-${environment}-vnet/subnets/devops-subnet'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
      extensionProfile: {
        extensions: [
          {
            name: 'customScript'
            properties: {
              publisher: 'Microsoft.Azure.Extensions'
              type: 'CustomScript'
              typeHandlerVersion: '2.1'
              autoUpgradeMinorVersion: true
              settings: {
                script: base64('''
#!/bin/bash
# Install Docker
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl start docker
systemctl enable docker
usermod -aG docker azureuser

# Install GitHub Actions Runner (requires manual token configuration)
mkdir -p /opt/actions-runner
cd /opt/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
chown -R azureuser:azureuser /opt/actions-runner

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Java
apt-get install -y openjdk-11-jdk

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | bash
''')
              }
            }
          }
        ]
      }
    }
    scaleInPolicy: {
      rules: ['Default']
    }
    upgradePolicy: {
      mode: 'Manual'
    }
  }
}

// Auto-scaling settings for runner VMSS
resource vmssAutoscale 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (environment == 'prod') {
  name: '${prefix}-${environment}-runners-autoscale'
  location: location
  tags: tags
  properties: {
    name: '${prefix}-${environment}-runners-autoscale'
    targetResourceUri: runnerVmss.id
    enabled: true
    profiles: [
      {
        name: 'default'
        capacity: {
          minimum: '1'
          maximum: '10'
          default: '2'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'Percentage CPU'
              metricNamespace: 'Microsoft.Compute/virtualMachineScaleSets'
              metricResourceUri: runnerVmss.id
              operator: 'GreaterThan'
              threshold: 70
              timeAggregation: 'Average'
              timeGrain: 'PT5M'
              timeWindow: 'PT15M'
              statistic: 'Average'
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
          {
            metricTrigger: {
              metricName: 'Percentage CPU'
              metricNamespace: 'Microsoft.Compute/virtualMachineScaleSets'
              metricResourceUri: runnerVmss.id
              operator: 'LessThan'
              threshold: 30
              timeAggregation: 'Average'
              timeGrain: 'PT5M'
              timeWindow: 'PT15M'
              statistic: 'Average'
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
  }
}

// Outputs
output containerRegistryId string = containerRegistry.id
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer

output buildStorageAccountId string = buildStorageAccount.id
output buildStorageAccountName string = buildStorageAccount.name
output buildStorageAccountPrimaryEndpoints object = buildStorageAccount.properties.primaryEndpoints

output devopsAppInsightsId string = devopsAppInsights.id
output devopsAppInsightsInstrumentationKey string = devopsAppInsights.properties.InstrumentationKey
output devopsAppInsightsConnectionString string = devopsAppInsights.properties.ConnectionString

output runnerVmssId string = environment == 'prod' ? runnerVmss.id : ''
output runnerVmssName string = environment == 'prod' ? runnerVmss.name : ''
