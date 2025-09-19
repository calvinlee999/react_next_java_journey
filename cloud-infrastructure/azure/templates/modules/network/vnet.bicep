// Virtual Network module for Cross-Border Payment Infrastructure
param name string
param location string
param tags object
param environment string

// Environment-specific VNET configurations
var vnetConfig = {
  dev: {
    addressPrefix: '10.0.0.0/16'
    subnets: {
      aks: '10.0.1.0/24'
      api: '10.0.2.0/24'
      data: '10.0.3.0/24'
      messaging: '10.0.4.0/24'
      gateway: '10.0.5.0/24'
      firewall: '10.0.6.0/24'
    }
  }
  staging: {
    addressPrefix: '10.1.0.0/16'
    subnets: {
      aks: '10.1.1.0/24'
      api: '10.1.2.0/24'
      data: '10.1.3.0/24'
      messaging: '10.1.4.0/24'
      gateway: '10.1.5.0/24'
      firewall: '10.1.6.0/24'
    }
  }
  prod: {
    addressPrefix: '10.2.0.0/16'
    subnets: {
      aks: '10.2.1.0/23'
      api: '10.2.3.0/24'
      data: '10.2.4.0/24'
      messaging: '10.2.5.0/24'
      gateway: '10.2.6.0/24'
      firewall: '10.2.7.0/24'
    }
  }
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetConfig[environment].addressPrefix
      ]
    }
    subnets: [
      {
        name: 'snet-aks'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.aks
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
      {
        name: 'snet-api'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.api
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: 'snet-data'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.data
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.DocumentDB'
            }
          ]
        }
      }
      {
        name: 'snet-messaging'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.messaging
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.EventHub'
            }
            {
              service: 'Microsoft.ServiceBus'
            }
          ]
        }
      }
      {
        name: 'snet-gateway'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.gateway
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.firewall
        }
      }
    ]
  }
}

// Network Security Groups for subnets
resource nsgAks 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: 'nsg-aks-${environment}'
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
        name: 'AllowKubernetesAPI'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '6443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1100
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
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

resource nsgApi 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: 'nsg-api-${environment}'
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
          priority: 1100
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
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

resource nsgData 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: 'nsg-data-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowSQLFromVNet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '1433'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowCosmosDBFromVNet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1100
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
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

resource nsgMessaging 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: 'nsg-messaging-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowEventHubsFromVNet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '9093'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowServiceBusFromVNet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '5671'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1100
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
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

// Associate NSGs with subnets
resource vnetWithNsg 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetConfig[environment].addressPrefix
      ]
    }
    subnets: [
      {
        name: 'snet-aks'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.aks
          networkSecurityGroup: {
            id: nsgAks.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
      {
        name: 'snet-api'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.api
          networkSecurityGroup: {
            id: nsgApi.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: 'snet-data'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.data
          networkSecurityGroup: {
            id: nsgData.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.Sql'
            }
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.DocumentDB'
            }
          ]
        }
      }
      {
        name: 'snet-messaging'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.messaging
          networkSecurityGroup: {
            id: nsgMessaging.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
          serviceEndpoints: [
            {
              service: 'Microsoft.EventHub'
            }
            {
              service: 'Microsoft.ServiceBus'
            }
          ]
        }
      }
      {
        name: 'snet-gateway'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.gateway
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: vnetConfig[environment].subnets.firewall
        }
      }
    ]
  }
  dependsOn: [
    vnet
    nsgAks
    nsgApi
    nsgData
    nsgMessaging
  ]
}

// Outputs
output id string = vnetWithNsg.id
output name string = vnetWithNsg.name
output addressPrefix string = vnetConfig[environment].addressPrefix

// Subnet IDs
output aksSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'snet-aks')
output apiSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'snet-api')
output dataSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'snet-data')
output messagingSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'snet-messaging')
output gatewaySubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'snet-gateway')
output firewallSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', name, 'AzureFirewallSubnet')

// NSG IDs
output nsgAksId string = nsgAks.id
output nsgApiId string = nsgApi.id
output nsgDataId string = nsgData.id
output nsgMessagingId string = nsgMessaging.id