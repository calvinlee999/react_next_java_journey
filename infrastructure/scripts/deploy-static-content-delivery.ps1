# Azure Static Content Delivery Deployment Script (PowerShell)
# Deploys Azure Blob Storage, CDN, and Front Door for optimized content delivery

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoCDN,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoFrontDoor,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoStaticWebsite,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show help if requested
if ($Help) {
    Write-Host "Azure Static Content Delivery Deployment Script"
    Write-Host ""
    Write-Host "SYNTAX:"
    Write-Host "  .\deploy-static-content-delivery.ps1 -ResourceGroup <name> -SubscriptionId <id> [options]"
    Write-Host ""
    Write-Host "PARAMETERS:"
    Write-Host "  -Environment <env>      Deployment environment (dev, staging, prod) [default: dev]"
    Write-Host "  -ResourceGroup <name>   Azure resource group name [required]"
    Write-Host "  -Location <region>      Azure region [default: eastus]"
    Write-Host "  -SubscriptionId <id>    Azure subscription ID [required]"
    Write-Host "  -NoCDN                  Skip CDN deployment"
    Write-Host "  -NoFrontDoor           Skip Front Door deployment"
    Write-Host "  -NoStaticWebsite       Skip static website hosting"
    Write-Host "  -Help                  Show this help message"
    Write-Host ""
    Write-Host "EXAMPLES:"
    Write-Host "  .\deploy-static-content-delivery.ps1 -Environment dev -ResourceGroup rg-reactjava-dev -SubscriptionId 12345678-1234-1234-1234-123456789012"
    Write-Host "  .\deploy-static-content-delivery.ps1 -Environment prod -ResourceGroup rg-reactjava-prod -SubscriptionId 12345678-1234-1234-1234-123456789012 -NoCDN"
    exit 0
}

# Validate required parameters
if (-not $ResourceGroup) {
    Write-Error "Resource group is required. Use -ResourceGroup parameter"
    exit 1
}

if (-not $SubscriptionId) {
    Write-Error "Subscription ID is required. Use -SubscriptionId parameter"
    exit 1
}

# Set deployment flags
$DeployCDN = -not $NoCDN
$DeployFrontDoor = -not $NoFrontDoor
$DeployStaticWebsite = -not $NoStaticWebsite

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BicepDir = Split-Path -Parent $ScriptDir
$ParametersFile = Join-Path $BicepDir "static-content-delivery.parameters.$Environment.json"

Write-Status "Starting Azure Static Content Delivery deployment..."
Write-Status "Environment: $Environment"
Write-Status "Resource Group: $ResourceGroup"
Write-Status "Location: $Location"
Write-Status "Subscription: $SubscriptionId"
Write-Status "Deploy CDN: $DeployCDN"
Write-Status "Deploy Front Door: $DeployFrontDoor"
Write-Status "Deploy Static Website: $DeployStaticWebsite"

# Check if Azure CLI is installed
try {
    $azVersion = az version 2>$null
    if (-not $azVersion) {
        throw "Azure CLI not found"
    }
    Write-Status "Azure CLI found"
} catch {
    Write-Error "Azure CLI is not installed. Please install it first."
    Write-Status "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if parameters file exists
if (-not (Test-Path $ParametersFile)) {
    Write-Error "Parameters file not found: $ParametersFile"
    exit 1
}

Write-Status "Using parameters file: $ParametersFile"

# Login check
Write-Status "Checking Azure login status..."
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Warning "Not logged in to Azure. Please log in."
        az login
    }
} catch {
    Write-Warning "Not logged in to Azure. Please log in."
    az login
}

# Set subscription
Write-Status "Setting Azure subscription..."
az account set --subscription $SubscriptionId

# Check if resource group exists, create if not
Write-Status "Checking resource group..."
try {
    $rg = az group show --name $ResourceGroup 2>$null | ConvertFrom-Json
    if (-not $rg) {
        Write-Status "Creating resource group: $ResourceGroup"
        az group create --name $ResourceGroup --location $Location
        Write-Success "Resource group created successfully"
    } else {
        Write-Status "Resource group already exists"
    }
} catch {
    Write-Status "Creating resource group: $ResourceGroup"
    az group create --name $ResourceGroup --location $Location
    Write-Success "Resource group created successfully"
}

# Update parameters file with dynamic values
Write-Status "Updating deployment parameters..."
$TempParamsFile = [System.IO.Path]::GetTempFileName() + ".json"

try {
    $parameters = Get-Content $ParametersFile | ConvertFrom-Json
    $parameters.parameters.environment.value = $Environment
    $parameters.parameters.location.value = $Location
    $parameters.parameters.enableCDN.value = $DeployCDN
    $parameters.parameters.enableFrontDoor.value = $DeployFrontDoor
    $parameters.parameters.enableStaticWebsite.value = $DeployStaticWebsite
    
    $parameters | ConvertTo-Json -Depth 10 | Out-File $TempParamsFile -Encoding UTF8
} catch {
    Write-Warning "Could not update parameters dynamically, using static file"
    Copy-Item $ParametersFile $TempParamsFile
}

# Deploy Bicep template
Write-Status "Starting Bicep deployment..."
$DeploymentName = "static-content-delivery-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$BicepTemplate = Join-Path $BicepDir "static-content-delivery-clean.bicep"

try {
    $deployment = az deployment group create `
        --resource-group $ResourceGroup `
        --template-file $BicepTemplate `
        --parameters "@$TempParamsFile" `
        --name $DeploymentName `
        --output json | ConvertFrom-Json
    
    if ($deployment) {
        Write-Success "Bicep deployment completed successfully"
        
        # Get deployment outputs
        Write-Status "Retrieving deployment outputs..."
        $outputs = az deployment group show `
            --resource-group $ResourceGroup `
            --name $DeploymentName `
            --query "properties.outputs" `
            --output json | ConvertFrom-Json
        
        if ($outputs) {
            Write-Host ""
            Write-Success "=== Deployment Outputs ==="
            
            if ($outputs.storageAccountName.value) {
                Write-Host "Storage Account: $($outputs.storageAccountName.value)"
            }
            if ($outputs.staticWebsiteUrl.value) {
                Write-Host "Static Website URL: $($outputs.staticWebsiteUrl.value)"
            }
            if ($outputs.blobStorageUrl.value) {
                Write-Host "Blob Storage URL: $($outputs.blobStorageUrl.value)"
            }
            if ($outputs.cdnWebsiteEndpointUrl.value) {
                Write-Host "CDN Website URL: $($outputs.cdnWebsiteEndpointUrl.value)"
            }
            if ($outputs.cdnAssetsEndpointUrl.value) {
                Write-Host "CDN Assets URL: $($outputs.cdnAssetsEndpointUrl.value)"
            }
            if ($outputs.frontDoorEndpointUrl.value) {
                Write-Host "Front Door URL: $($outputs.frontDoorEndpointUrl.value)"
            }
            
            Write-Host ""
            Write-Success "=== Resource URLs ==="
            if ($outputs.resourceUrls.value) {
                $outputs.resourceUrls.value.PSObject.Properties | ForEach-Object {
                    if ($_.Value) {
                        Write-Host "$($_.Name): $($_.Value)"
                    }
                }
            }
        }
        
        # Enable static website hosting if requested
        if ($DeployStaticWebsite -and $outputs.storageAccountName.value) {
            Write-Status "Enabling static website hosting..."
            $StorageAccountName = $outputs.storageAccountName.value
            
            try {
                az storage blob service-properties update `
                    --account-name $StorageAccountName `
                    --static-website `
                    --index-document "index.html" `
                    --404-document "404.html" `
                    --auth-mode login
                
                Write-Success "Static website hosting enabled"
            } catch {
                Write-Warning "Could not configure static website hosting automatically"
            }
        }
        
        Write-Host ""
        Write-Success "Azure Static Content Delivery deployment completed successfully!"
        Write-Status "You can now upload your static files to the storage account"
        
        if ($DeployCDN) {
            Write-Status "CDN is configured and ready to cache your content"
        }
        
        if ($DeployFrontDoor) {
            Write-Status "Front Door is configured with WAF protection"
        }
        
    } else {
        Write-Error "Bicep deployment failed"
        exit 1
    }
    
} catch {
    Write-Error "Bicep deployment failed: $($_.Exception.Message)"
    exit 1
} finally {
    # Cleanup temporary files
    if (Test-Path $TempParamsFile) {
        Remove-Item $TempParamsFile -Force
    }
}

Write-Status "Next steps:"
Write-Host "1. Upload your static website files to the storage account"
Write-Host "2. Update your DNS records to point to the CDN or Front Door endpoint"
Write-Host "3. Configure custom domains if needed"
Write-Host "4. Test your website and monitor performance metrics"