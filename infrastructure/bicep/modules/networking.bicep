// Networking Infrastructure Module
// Implements enterprise-grade networking with VNets, subnets, and security zones

@description('Environment name')
param environment string

@description('Azure region for deployment')
param location string

@description('Resource prefix for naming')
param prefix string

@description('Resource tags')
param tags object

// Variables for CIDR blocks
var vnetAddressSpace = '10.0.0.0/16'
var subnets = {
  frontend: {
    name: 'frontend-subnet'
    addressPrefix: '10.0.1.0/24'
  }
  apiGateway: {
    name: 'api-gateway-subnet'
    addressPrefix: '10.0.2.0/24'
  }
  mcpGateway: {
    name: 'mcp-gateway-subnet'
    addressPrefix: '10.0.3.0/24'
  }
  mcpFramework: {
    name: 'mcp-framework-subnet'
    addressPrefix: '10.0.4.0/24'
  }
  aiPlatform: {
    name: 'ai-platform-subnet'
    addressPrefix: '10.0.5.0/24'
  }
  microservices: {
    name: 'microservices-subnet'
    addressPrefix: '10.0.6.0/24'
  }
  eventStreaming: {
    name: 'event-streaming-subnet'
    addressPrefix: '10.0.7.0/24'
  }
  dataPlatform: {
    name: 'data-platform-subnet'
    addressPrefix: '10.0.8.0/24'
  }
  database: {
    name: 'database-subnet'
    addressPrefix: '10.0.9.0/24'
  }
  monitoring: {
    name: 'monitoring-subnet'
    addressPrefix: '10.0.10.0/24'
  }
  security: {
    name: 'security-subnet'
    addressPrefix: '10.0.11.0/24'
  }
  devops: {
    name: 'devops-subnet'
    addressPrefix: '10.0.12.0/24'
  }
  privateEndpoints: {
    name: 'private-endpoints-subnet'
    addressPrefix: '10.0.13.0/24'
  }
  bastionHost: {
    name: 'AzureBastionSubnet'
    addressPrefix: '10.0.14.0/26'
  }
  applicationGateway: {
    name: 'application-gateway-subnet'
    addressPrefix: '10.0.15.0/24'
  }
}

// Network Security Groups
resource frontendNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${prefix}-${environment}-frontend-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource apiGatewayNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${prefix}-${environment}-api-gateway-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowAPIGatewayManagement'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3443'
          sourceAddressPrefix: 'ApiManagement'
          destinationAddressPrefix: 'VirtualNetwork'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource microservicesNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${prefix}-${environment}-microservices-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowVNetInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'VirtualNetwork'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyInternetInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4000
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource databaseNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${prefix}-${environment}-database-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowMicroservicesSubnet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRanges: ['1433', '5432', '3306', '10250-10255']
          sourceAddressPrefix: subnets.microservices.addressPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllOtherInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4000
          direction: 'Inbound'
        }
      }
    ]
  }
}

// Main Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${prefix}-${environment}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [vnetAddressSpace]
    }
    enableDdosProtection: environment == 'prod' ? true : false
    subnets: [
      {
        name: subnets.frontend.name
        properties: {
          addressPrefix: subnets.frontend.addressPrefix
          networkSecurityGroup: {
            id: frontendNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.apiGateway.name
        properties: {
          addressPrefix: subnets.apiGateway.addressPrefix
          networkSecurityGroup: {
            id: apiGatewayNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.mcpGateway.name
        properties: {
          addressPrefix: subnets.mcpGateway.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.mcpFramework.name
        properties: {
          addressPrefix: subnets.mcpFramework.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.aiPlatform.name
        properties: {
          addressPrefix: subnets.aiPlatform.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.CognitiveServices'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.microservices.name
        properties: {
          addressPrefix: subnets.microservices.addressPrefix
          networkSecurityGroup: {
            id: microservicesNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.eventStreaming.name
        properties: {
          addressPrefix: subnets.eventStreaming.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.EventHub'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.dataPlatform.name
        properties: {
          addressPrefix: subnets.dataPlatform.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.database.name
        properties: {
          addressPrefix: subnets.database.addressPrefix
          networkSecurityGroup: {
            id: databaseNsg.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Sql'
            }
          ]
          delegations: [
            {
              name: 'Microsoft.DBforPostgreSQL/flexibleServers'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: subnets.monitoring.name
        properties: {
          addressPrefix: subnets.monitoring.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
      {
        name: subnets.security.name
        properties: {
          addressPrefix: subnets.security.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: subnets.devops.name
        properties: {
          addressPrefix: subnets.devops.addressPrefix
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.ContainerRegistry'
            }
          ]
        }
      }
      {
        name: subnets.privateEndpoints.name
        properties: {
          addressPrefix: subnets.privateEndpoints.addressPrefix
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnets.bastionHost.name
        properties: {
          addressPrefix: subnets.bastionHost.addressPrefix
        }
      }
      {
        name: subnets.applicationGateway.name
        properties: {
          addressPrefix: subnets.applicationGateway.addressPrefix
        }
      }
    ]
  }
}

// Public IP for Application Gateway
resource appGatewayPublicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: '${prefix}-${environment}-appgw-pip'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: '${prefix}-${environment}-appgw'
    }
  }
}

// Public IP for Bastion Host
resource bastionPublicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: '${prefix}-${environment}-bastion-pip'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// Azure Bastion for secure RDP/SSH access
resource bastionHost 'Microsoft.Network/bastionHosts@2023-09-01' = {
  name: '${prefix}-${environment}-bastion'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    ipConfigurations: [
      {
        name: 'IpConf'
        properties: {
          subnet: {
            id: '${vnet.id}/subnets/${subnets.bastionHost.name}'
          }
          publicIPAddress: {
            id: bastionPublicIp.id
          }
        }
      }
    ]
    enableTunneling: true
    enableIpConnect: true
    enableShareableLink: false
  }
}

// NAT Gateway for outbound internet access
resource natGatewayPublicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: '${prefix}-${environment}-nat-pip'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

resource natGateway 'Microsoft.Network/natGateways@2023-09-01' = {
  name: '${prefix}-${environment}-nat-gateway'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIpAddresses: [
      {
        id: natGatewayPublicIp.id
      }
    ]
    idleTimeoutInMinutes: 4
  }
}

// Outputs
output vnetId string = vnet.id
output vnetName string = vnet.name
output vnetAddressSpace string = vnetAddressSpace

// Subnet outputs
output frontendSubnetId string = '${vnet.id}/subnets/${subnets.frontend.name}'
output apiGatewaySubnetId string = '${vnet.id}/subnets/${subnets.apiGateway.name}'
output mcpGatewaySubnetId string = '${vnet.id}/subnets/${subnets.mcpGateway.name}'
output mcpFrameworkSubnetId string = '${vnet.id}/subnets/${subnets.mcpFramework.name}'
output aiPlatformSubnetId string = '${vnet.id}/subnets/${subnets.aiPlatform.name}'
output microservicesSubnetId string = '${vnet.id}/subnets/${subnets.microservices.name}'
output eventStreamingSubnetId string = '${vnet.id}/subnets/${subnets.eventStreaming.name}'
output dataPlatformSubnetId string = '${vnet.id}/subnets/${subnets.dataPlatform.name}'
output databaseSubnetId string = '${vnet.id}/subnets/${subnets.database.name}'
output monitoringSubnetId string = '${vnet.id}/subnets/${subnets.monitoring.name}'
output securitySubnetId string = '${vnet.id}/subnets/${subnets.security.name}'
output devopsSubnetId string = '${vnet.id}/subnets/${subnets.devops.name}'
output privateEndpointsSubnetId string = '${vnet.id}/subnets/${subnets.privateEndpoints.name}'
output applicationGatewaySubnetId string = '${vnet.id}/subnets/${subnets.applicationGateway.name}'

// Public IP outputs
output appGatewayPublicIpId string = appGatewayPublicIp.id
output bastionPublicIpId string = bastionPublicIp.id
output natGatewayPublicIpId string = natGatewayPublicIp.id

// Infrastructure outputs
output bastionHostId string = bastionHost.id
output natGatewayId string = natGateway.id

// NSG outputs
output frontendNsgId string = frontendNsg.id
output apiGatewayNsgId string = apiGatewayNsg.id
output microservicesNsgId string = microservicesNsg.id
output databaseNsgId string = databaseNsg.id
