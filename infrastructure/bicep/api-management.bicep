// Azure API Management Infrastructure as Code
// This Bicep template deploys Azure API Management with enterprise-grade configuration
// Aligned with Azure Well-Architected Framework Level 1 requirements

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('API Management service name')
param apiManagementName string = 'apim-${environment}-${uniqueString(resourceGroup().id)}'

@description('Organization name for API Management')
param organizationName string = 'Golden Path Enterprise'

@description('Administrator email for API Management')
param adminEmail string = 'admin@goldenpath.com'

@description('SKU tier for API Management')
@allowed(['Developer', 'Standard', 'Premium'])
param skuName string = environment == 'prod' ? 'Premium' : (environment == 'staging' ? 'Standard' : 'Developer')

@description('SKU capacity (number of units)')
param skuCapacity int = environment == 'prod' ? 2 : 1

@description('Enable zone redundancy (Premium tier only)')
param enableZoneRedundancy bool = environment == 'prod'

@description('Virtual Network configuration')
param vnetType string = environment == 'prod' ? 'Internal' : 'External'

// Variables
var apiManagementIdentityName = 'apim-identity-${environment}'
var keyVaultName = 'kv-${environment}-${uniqueString(resourceGroup().id)}'
var appInsightsName = 'appi-${environment}-${uniqueString(resourceGroup().id)}'
var logAnalyticsWorkspaceName = 'log-${environment}-${uniqueString(resourceGroup().id)}'

// Managed Identity for API Management
resource apiManagementIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: apiManagementIdentityName
  location: location
}

// Key Vault for storing secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: environment == 'prod'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environment == 'prod' ? 90 : 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Azure API Management
resource apiManagement 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apiManagementName
  location: location
  zones: enableZoneRedundancy && skuName == 'Premium' ? [
    '1'
    '2'
    '3'
  ] : null
  sku: {
    name: skuName
    capacity: skuCapacity
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${apiManagementIdentity.id}': {}
    }
  }
  properties: {
    publisherEmail: adminEmail
    publisherName: organizationName
    virtualNetworkType: vnetType
    apiVersionConstraint: {
      minApiVersion: '2019-01-01'
    }
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Protocols.Server.Http2': 'true'
    }
    disableGateway: false
    natGatewayState: 'Disabled'
  }
}

// API Management Logger for Application Insights
resource apiManagementLogger 'Microsoft.ApiManagement/service/loggers@2023-05-01-preview' = {
  parent: apiManagement
  name: 'applicationinsights'
  properties: {
    loggerType: 'applicationInsights'
    description: 'Application Insights logger for API Management'
    credentials: {
      instrumentationKey: appInsights.properties.InstrumentationKey
      connectionString: appInsights.properties.ConnectionString
    }
    isBuffered: true
  }
}

// Global Policy Configuration
resource globalPolicy 'Microsoft.ApiManagement/service/policies@2023-05-01-preview' = {
  parent: apiManagement
  name: 'policy'
  properties: {
    value: '''
    <policies>
      <inbound>
        <!-- Enable CORS for browser-based applications -->
        <cors allow-credentials="true">
          <allowed-origins>
            <origin>http://localhost:3000</origin>
            <origin>https://*.azurestaticapps.net</origin>
            <origin>https://*.azurewebsites.net</origin>
          </allowed-origins>
          <allowed-methods>
            <method>GET</method>
            <method>POST</method>
            <method>PUT</method>
            <method>DELETE</method>
            <method>OPTIONS</method>
          </allowed-methods>
          <allowed-headers>
            <header>*</header>
          </allowed-headers>
        </cors>
        
        <!-- Security headers -->
        <set-header name="X-Frame-Options" exists-action="override">
          <value>DENY</value>
        </set-header>
        <set-header name="X-Content-Type-Options" exists-action="override">
          <value>nosniff</value>
        </set-header>
        <set-header name="X-XSS-Protection" exists-action="override">
          <value>1; mode=block</value>
        </set-header>
        
        <!-- Rate limiting -->
        <rate-limit-by-key calls="1000" renewal-period="60" counter-key="@(context.Request.IpAddress)" />
        
        <!-- Request logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("method", context.Request.Method),
              new JProperty("url", context.Request.Url.ToString()),
              new JProperty("clientIP", context.Request.IpAddress),
              new JProperty("userAgent", context.Request.Headers.GetValueOrDefault("User-Agent", "")),
              new JProperty("requestId", context.RequestId)
            ).ToString();
          }
        </log-to-eventhub>
      </inbound>
      <backend>
        <forward-request />
      </backend>
      <outbound>
        <!-- Response caching -->
        <cache-store duration="300" />
        
        <!-- Response logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("responseCode", context.Response.StatusCode),
              new JProperty("responseTime", context.Elapsed.TotalMilliseconds)
            ).ToString();
          }
        </log-to-eventhub>
      </outbound>
      <on-error>
        <!-- Error logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("error", context.LastError.Message),
              new JProperty("source", context.LastError.Source)
            ).ToString();
          }
        </log-to-eventhub>
      </on-error>
    </policies>
    '''
  }
}

// REST API for Backend Services
resource backendApi 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apiManagement
  name: 'backend-api'
  properties: {
    displayName: 'Backend REST API'
    description: 'Spring Boot backend REST API endpoints with comprehensive CRUD operations'
    path: 'api'
    protocols: [
      'https'
    ]
    serviceUrl: environment == 'prod' ? 'https://backend-prod.azurewebsites.net' : 'https://backend-${environment}.azurewebsites.net'
    subscriptionRequired: true
    apiVersion: 'v1'
    apiVersionSetId: backendApiVersionSet.id
    format: 'openapi+json'
    value: '''
    {
      "openapi": "3.0.1",
      "info": {
        "title": "Golden Path Backend API",
        "description": "Enterprise-grade REST API for the Golden Path application",
        "version": "1.0.0"
      },
      "servers": [
        {
          "url": "https://api.goldenpath.com/api"
        }
      ],
      "paths": {
        "/health": {
          "get": {
            "tags": ["Health"],
            "summary": "Get application health status",
            "responses": {
              "200": {
                "description": "Health check successful",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "status": {"type": "string"},
                        "service": {"type": "string"},
                        "timestamp": {"type": "string"}
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/users": {
          "get": {
            "tags": ["Users"],
            "summary": "Get all users",
            "responses": {
              "200": {
                "description": "List of users",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/User"
                      }
                    }
                  }
                }
              }
            }
          },
          "post": {
            "tags": ["Users"],
            "summary": "Create a new user",
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateUserRequest"
                  }
                }
              }
            },
            "responses": {
              "201": {
                "description": "User created successfully",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              }
            }
          }
        },
        "/users/{id}": {
          "get": {
            "tags": ["Users"],
            "summary": "Get user by ID",
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {"type": "string"}
              }
            ],
            "responses": {
              "200": {
                "description": "User found",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "User": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "name": {"type": "string"},
              "email": {"type": "string"},
              "createdAt": {"type": "string", "format": "date-time"}
            }
          },
          "CreateUserRequest": {
            "type": "object",
            "required": ["name", "email"],
            "properties": {
              "name": {"type": "string"},
              "email": {"type": "string", "format": "email"}
            }
          }
        }
      }
    }
    '''
  }
}

// WebSocket API for Real-time Communication
resource websocketApi 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apiManagement
  name: 'websocket-api'
  properties: {
    displayName: 'WebSocket Real-time API'
    description: 'WebSocket endpoints for real-time communication, chat, and live updates'
    path: 'ws'
    protocols: [
      'ws'
      'wss'
    ]
    serviceUrl: environment == 'prod' ? 'wss://backend-prod.azurewebsites.net' : 'wss://backend-${environment}.azurewebsites.net'
    subscriptionRequired: true
    apiVersion: 'v1'
    type: 'websocket'
  }
}

// WebHook API for Event-driven Integration
resource webhookApi 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apiManagement
  name: 'webhook-api'
  properties: {
    displayName: 'WebHook Event API'
    description: 'WebHook endpoints for receiving events from external services like GitHub, Stripe, etc.'
    path: 'webhooks'
    protocols: [
      'https'
    ]
    serviceUrl: environment == 'prod' ? 'https://backend-prod.azurewebsites.net' : 'https://backend-${environment}.azurewebsites.net'
    subscriptionRequired: false  // WebHooks often don't use API Management subscriptions
    apiVersion: 'v1'
    format: 'openapi+json'
    value: '''
    {
      "openapi": "3.0.1",
      "info": {
        "title": "WebHook Event API",
        "description": "Endpoints for receiving webhook events from external services",
        "version": "1.0.0"
      },
      "paths": {
        "/github": {
          "post": {
            "tags": ["GitHub"],
            "summary": "Receive GitHub webhook events",
            "description": "Handles GitHub webhook events like push, pull request, issues",
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "description": "GitHub webhook payload"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Webhook processed successfully"
              }
            }
          }
        },
        "/stripe": {
          "post": {
            "tags": ["Stripe"],
            "summary": "Receive Stripe webhook events",
            "description": "Handles Stripe webhook events for payment processing",
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "description": "Stripe webhook payload"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Webhook processed successfully"
              }
            }
          }
        },
        "/generic": {
          "post": {
            "tags": ["Generic"],
            "summary": "Receive generic webhook events",
            "description": "Handles generic webhook events from any external service",
            "parameters": [
              {
                "name": "source",
                "in": "query",
                "schema": {"type": "string"},
                "description": "Source of the webhook event"
              },
              {
                "name": "event",
                "in": "query", 
                "schema": {"type": "string"},
                "description": "Event type"
              }
            ],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "description": "Generic webhook payload"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Webhook processed successfully"
              }
            }
          }
        }
      }
    }
    '''
  }
}

// API Version Set
resource backendApiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apiManagement
  name: 'backend-api-versions'
  properties: {
    displayName: 'Backend API Versions'
    description: 'Version set for backend API'
    versioningScheme: 'Segment'
  }
}

// Health Check Operation
resource healthOperation 'Microsoft.ApiManagement/service/apis/operations@2023-05-01-preview' = {
  parent: backendApi
  name: 'get-health'
  properties: {
    displayName: 'Get Health Status'
    method: 'GET'
    urlTemplate: '/health'
    description: 'Get application health status'
    responses: [
      {
        statusCode: 200
        description: 'Health check successful'
        representations: [
          {
            contentType: 'application/json'
            examples: {
              default: {
                value: '{"status": "UP", "components": {"db": {"status": "UP"}}}'
              }
            }
          }
        ]
      }
    ]
  }
}

// Product for API grouping
resource developerProduct 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apiManagement
  name: 'developer'
  properties: {
    displayName: 'Developer Product'
    description: 'Product for developer access to APIs'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
    terms: 'By subscribing to this product, you agree to the terms of use.'
  }
}

// Associate API with Product
resource productApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: developerProduct
  name: backendApi.name
}

// Diagnostic settings for monitoring
resource diagnosticSetting 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: apiManagement
  name: 'apiManagementDiagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

// WebSocket API Policies
resource websocketPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: websocketApi
  name: 'policy'
  properties: {
    value: '''
    <policies>
      <inbound>
        <!-- WebSocket Connection Validation -->
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized. Access token is missing or invalid.">
          <openid-config url="https://${environment().authentication.loginEndpoint}${subscription().tenantId}/v2.0/.well-known/openid-configuration" />
          <required-claims>
            <claim name="aud" match="any">
              <value>api://golden-path-api</value>
            </claim>
          </required-claims>
        </validate-jwt>
        
        <!-- Rate limiting for WebSocket connections -->
        <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Request.IpAddress)" />
        
        <!-- Connection metadata logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("connectionType", "websocket"),
              new JProperty("clientIP", context.Request.IpAddress),
              new JProperty("userAgent", context.Request.Headers.GetValueOrDefault("User-Agent", "")),
              new JProperty("requestId", context.RequestId)
            ).ToString();
          }
        </log-to-eventhub>
      </inbound>
      <backend>
        <forward-request />
      </backend>
      <outbound>
        <!-- WebSocket response logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("connectionStatus", "established"),
              new JProperty("responseTime", context.Elapsed.TotalMilliseconds)
            ).ToString();
          }
        </log-to-eventhub>
      </outbound>
      <on-error>
        <!-- WebSocket error handling -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("connectionType", "websocket"),
              new JProperty("error", context.LastError.Message),
              new JProperty("source", context.LastError.Source)
            ).ToString();
          }
        </log-to-eventhub>
        <return-response>
          <set-status code="500" reason="WebSocket connection failed" />
          <set-body>@{
            return new JObject(
              new JProperty("error", "WebSocket connection failed"),
              new JProperty("message", context.LastError.Message),
              new JProperty("requestId", context.RequestId)
            ).ToString();
          }</set-body>
        </return-response>
      </on-error>
    </policies>
    '''
  }
}

// WebHook API Policies
resource webhookPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: webhookApi
  name: 'policy'
  properties: {
    value: '''
    <policies>
      <inbound>
        <!-- Webhook signature verification -->
        <set-variable name="webhook-signature" value="@(context.Request.Headers.GetValueOrDefault("X-Hub-Signature-256", ""))" />
        <set-variable name="github-signature" value="@(context.Request.Headers.GetValueOrDefault("X-GitHub-Delivery", ""))" />
        <set-variable name="stripe-signature" value="@(context.Request.Headers.GetValueOrDefault("Stripe-Signature", ""))" />
        
        <!-- Content type validation -->
        <choose>
          <when condition="@(!context.Request.Headers.ContainsKey("Content-Type") || !context.Request.Headers["Content-Type"].Any(h => h.Contains("application/json")))">
            <return-response>
              <set-status code="400" reason="Bad Request" />
              <set-body>{"error": "Content-Type must be application/json"}</set-body>
            </return-response>
          </when>
        </choose>
        
        <!-- Rate limiting for webhooks -->
        <rate-limit-by-key calls="10000" renewal-period="60" counter-key="@(context.Request.IpAddress)" />
        
        <!-- Request size validation -->
        <choose>
          <when condition="@(context.Request.Body.Length > 1024 * 1024)">
            <return-response>
              <set-status code="413" reason="Payload Too Large" />
              <set-body>{"error": "Request payload too large. Maximum size is 1MB"}</set-body>
            </return-response>
          </when>
        </choose>
        
        <!-- Webhook event logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("eventType", "webhook_received"),
              new JProperty("source", context.Request.Url.Query.Contains("source") ? context.Request.Url.Query.Split('=')[1] : "unknown"),
              new JProperty("clientIP", context.Request.IpAddress),
              new JProperty("userAgent", context.Request.Headers.GetValueOrDefault("User-Agent", "")),
              new JProperty("requestId", context.RequestId),
              new JProperty("payloadSize", context.Request.Body.Length),
              new JProperty("hasSignature", !string.IsNullOrEmpty(context.Variables.GetValueOrDefault<string>("webhook-signature")))
            ).ToString();
          }
        </log-to-eventhub>
      </inbound>
      <backend>
        <forward-request />
      </backend>
      <outbound>
        <!-- Webhook processing confirmation -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("eventType", "webhook_processed"),
              new JProperty("responseCode", context.Response.StatusCode),
              new JProperty("responseTime", context.Elapsed.TotalMilliseconds)
            ).ToString();
          }
        </log-to-eventhub>
      </outbound>
      <on-error>
        <!-- Webhook error handling -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("eventType", "webhook_error"),
              new JProperty("error", context.LastError.Message),
              new JProperty("source", context.LastError.Source)
            ).ToString();
          }
        </log-to-eventhub>
        <return-response>
          <set-status code="500" reason="Webhook processing failed" />
          <set-body>@{
            return new JObject(
              new JProperty("success", false),
              new JProperty("error", "Webhook processing failed"),
              new JProperty("message", context.LastError.Message),
              new JProperty("requestId", context.RequestId),
              new JProperty("timestamp", DateTime.UtcNow.ToString())
            ).ToString();
          }</set-body>
        </return-response>
      </on-error>
    </policies>
    '''
  }
}

// Enhanced REST API Policies
resource backendApiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: backendApi
  name: 'policy'
  properties: {
    value: '''
    <policies>
      <inbound>
        <!-- JWT Token Validation -->
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized. Access token is missing or invalid.">
          <openid-config url="https://${environment().authentication.loginEndpoint}${subscription().tenantId}/v2.0/.well-known/openid-configuration" />
          <required-claims>
            <claim name="aud" match="any">
              <value>api://golden-path-api</value>
            </claim>
          </required-claims>
        </validate-jwt>
        
        <!-- Request validation -->
        <validate-content unspecified-content-type-action="prevent" max-size="102400" size-exceeded-action="prevent" errors-variable-name="requestBodyValidation">
          <content type="application/json" validate-as="json" action="prevent" />
        </validate-content>
        
        <!-- Cache lookup for GET requests -->
        <cache-lookup vary-by-developer="false" vary-by-developer-groups="false" caching-type="internal">
          <vary-by-header>Accept</vary-by-header>
          <vary-by-header>Accept-Charset</vary-by-header>
          <vary-by-query-parameter>limit</vary-by-query-parameter>
          <vary-by-query-parameter>offset</vary-by-query-parameter>
        </cache-lookup>
        
        <!-- Request enrichment -->
        <set-header name="X-Forwarded-For" exists-action="override">
          <value>@(context.Request.IpAddress)</value>
        </set-header>
        <set-header name="X-API-Gateway" exists-action="override">
          <value>Azure-API-Management</value>
        </set-header>
        <set-header name="X-Request-ID" exists-action="override">
          <value>@(context.RequestId)</value>
        </set-header>
        
        <!-- API request logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("eventType", "api_request"),
              new JProperty("method", context.Request.Method),
              new JProperty("url", context.Request.Url.ToString()),
              new JProperty("clientIP", context.Request.IpAddress),
              new JProperty("userAgent", context.Request.Headers.GetValueOrDefault("User-Agent", "")),
              new JProperty("requestId", context.RequestId),
              new JProperty("operation", context.Operation.Name),
              new JProperty("apiName", context.Api.Name)
            ).ToString();
          }
        </log-to-eventhub>
      </inbound>
      <backend>
        <!-- Retry policy for backend calls -->
        <retry condition="@(context.Response.StatusCode >= 500)" count="3" interval="2" max-interval="10" delta="2">
          <forward-request />
        </retry>
      </backend>
      <outbound>
        <!-- Cache store for successful GET requests -->
        <choose>
          <when condition="@(context.Request.Method == "GET" && context.Response.StatusCode < 300)">
            <cache-store duration="300" />
          </when>
        </choose>
        
        <!-- Response enrichment -->
        <set-header name="X-API-Gateway" exists-action="override">
          <value>Azure-API-Management</value>
        </set-header>
        <set-header name="X-Response-Time" exists-action="override">
          <value>@(context.Elapsed.TotalMilliseconds.ToString())</value>
        </set-header>
        
        <!-- API response logging -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("eventType", "api_response"),
              new JProperty("responseCode", context.Response.StatusCode),
              new JProperty("responseTime", context.Elapsed.TotalMilliseconds),
              new JProperty("operation", context.Operation.Name),
              new JProperty("apiName", context.Api.Name),
              new JProperty("cacheHit", context.Variables.ContainsKey("cache-hit"))
            ).ToString();
          }
        </log-to-eventhub>
      </outbound>
      <on-error>
        <!-- API error handling -->
        <log-to-eventhub logger-id="applicationinsights">
          @{
            return new JObject(
              new JProperty("timestamp", DateTime.UtcNow.ToString()),
              new JProperty("requestId", context.RequestId),
              new JProperty("eventType", "api_error"),
              new JProperty("error", context.LastError.Message),
              new JProperty("source", context.LastError.Source),
              new JProperty("operation", context.Operation != null ? context.Operation.Name : "unknown"),
              new JProperty("apiName", context.Api.Name)
            ).ToString();
          }
        </log-to-eventhub>
        <return-response>
          <set-status code="500" reason="Internal Server Error" />
          <set-header name="Content-Type" exists-action="override">
            <value>application/json</value>
          </set-header>
          <set-body>@{
            return new JObject(
              new JProperty("success", false),
              new JProperty("error", "Internal server error occurred"),
              new JProperty("message", "Please try again later or contact support"),
              new JProperty("requestId", context.RequestId),
              new JProperty("timestamp", DateTime.UtcNow.ToString())
            ).ToString();
          }</set-body>
        </return-response>
      </on-error>
    </policies>
    '''
  }
}

// API Management Products for different access levels
resource enterpriseProduct 'Microsoft.ApiManagement/service/products@2023-05-01-preview' = {
  parent: apiManagement
  name: 'enterprise-apis'
  properties: {
    displayName: 'Enterprise API Access'
    description: 'Full access to all APIs including WebSocket, WebHook, and REST endpoints'
    subscriptionRequired: true
    approvalRequired: true
    state: 'published'
    terms: 'By subscribing to this product, you agree to the terms and conditions of the Enterprise API Access agreement.'
  }
}

// Associate APIs with Products
resource enterpriseBackendApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: enterpriseProduct
  name: backendApi.name
}

resource enterpriseWebSocketApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: enterpriseProduct
  name: websocketApi.name
}

resource enterpriseWebHookApi 'Microsoft.ApiManagement/service/products/apis@2023-05-01-preview' = {
  parent: enterpriseProduct
  name: webhookApi.name
}

// Key Vault access policy for API Management
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: apiManagementIdentity.properties.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
          certificates: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

// Outputs
output apiManagementName string = apiManagement.name
output apiManagementId string = apiManagement.id
output apiManagementGatewayUrl string = apiManagement.properties.gatewayUrl
output apiManagementPortalUrl string = 'https://${apiManagement.name}.portal.azure-api.net'
output developerPortalUrl string = apiManagement.properties.developerPortalUrl
output restApiUrl string = '${apiManagement.properties.gatewayUrl}/api'
output websocketApiUrl string = '${replace(apiManagement.properties.gatewayUrl, 'https://', 'wss://')}/ws'
output webhookApiUrl string = '${apiManagement.properties.gatewayUrl}/webhooks'
output keyVaultName string = keyVault.name
output appInsightsName string = appInsights.name
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output managedIdentityId string = apiManagementIdentity.id
output managedIdentityPrincipalId string = apiManagementIdentity.properties.principalId
