#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Azure Cross-Border Payment Infrastructure Deployment Script for PowerShell

.DESCRIPTION
    This PowerShell script deploys the complete Azure infrastructure using Bicep templates
    for the enterprise cross-border payment platform.

.PARAMETER Environment
    Environment to deploy (dev, staging, prod). Default: dev

.PARAMETER Location
    Azure region for deployment. Default: eastus2

.PARAMETER ResourceGroup
    Resource group name. Default: rg-payments-{environment}

.PARAMETER SubscriptionId
    Azure subscription ID. Default: current subscription

.PARAMETER SkipValidation
    Skip pre-deployment validation

.PARAMETER WhatIf
    Show what would be deployed without deploying

.PARAMETER EstimateCost
    Estimate deployment costs

.EXAMPLE
    .\deploy.ps1
    Deploy to dev environment with defaults

.EXAMPLE
    .\deploy.ps1 -Environment prod -Location westeurope
    Deploy to prod environment in West Europe

.EXAMPLE
    .\deploy.ps1 -WhatIf -EstimateCost
    Preview deployment with cost estimates

.NOTES
    Requires Azure PowerShell module and Bicep CLI
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter()]
    [string]$Location = 'eastus2',
    
    [Parameter()]
    [string]$ResourceGroup,
    
    [Parameter()]
    [string]$SubscriptionId,
    
    [Parameter()]
    [switch]$SkipValidation,
    
    [Parameter()]
    [switch]$WhatIf,
    
    [Parameter()]
    [switch]$EstimateCost
)

# Script configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TemplateDir = Join-Path $ProjectRoot 'templates'
$LogDir = Join-Path $ScriptDir 'logs'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $LogDir "deploy-$Timestamp.log"

# Default values
if (-not $ResourceGroup) {
    $ResourceGroup = "rg-payments-$Environment"
}

if (-not $SubscriptionId) {
    $SubscriptionId = $env:AZURE_SUBSCRIPTION_ID
}

if (-not $Location -and $env:AZURE_LOCATION) {
    $Location = $env:AZURE_LOCATION
}

# Logging function
function Write-Log {
    param(
        [Parameter(Mandatory)]
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SUCCESS')]
        [string]$Level,
        
        [Parameter(Mandatory)]
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Create log directory if it doesn't exist
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    # Write to log file
    Add-Content -Path $LogFile -Value $LogEntry
    
    # Write to console with colors
    switch ($Level) {
        'INFO'    { Write-Host $LogEntry -ForegroundColor Blue }
        'WARN'    { Write-Warning $LogEntry }
        'ERROR'   { Write-Error $LogEntry }
        'SUCCESS' { Write-Host $LogEntry -ForegroundColor Green }
    }
}

# Error handling
function Stop-ScriptWithError {
    param([string]$Message)
    Write-Log -Level ERROR -Message $Message
    throw $Message
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log -Level INFO -Message "Checking prerequisites..."
    
    # Check Azure PowerShell module
    if (-not (Get-Module -ListAvailable -Name Az.Accounts)) {
        Stop-ScriptWithError "Azure PowerShell module is not installed. Please install with: Install-Module -Name Az"
    }
    
    # Check Bicep CLI
    try {
        $null = Get-Command bicep -ErrorAction Stop
    }
    catch {
        Stop-ScriptWithError "Bicep CLI is not installed. Please install Bicep CLI."
    }
    
    # Check Azure login
    try {
        $context = Get-AzContext -ErrorAction Stop
        if (-not $context) {
            Stop-ScriptWithError "Not logged in to Azure. Please run Connect-AzAccount."
        }
    }
    catch {
        Stop-ScriptWithError "Not logged in to Azure. Please run Connect-AzAccount."
    }
    
    # Set subscription if specified
    if ($SubscriptionId) {
        Write-Log -Level INFO -Message "Setting subscription to $SubscriptionId"
        try {
            Set-AzContext -SubscriptionId $SubscriptionId -ErrorAction Stop | Out-Null
        }
        catch {
            Stop-ScriptWithError "Failed to set subscription: $($_.Exception.Message)"
        }
    }
    
    # Get current subscription
    $currentContext = Get-AzContext
    Write-Log -Level INFO -Message "Using subscription: $($currentContext.Subscription.Name) ($($currentContext.Subscription.Id))"
    
    Write-Log -Level SUCCESS -Message "Prerequisites check completed"
}

# Generate unique suffix
function Get-UniqueSuffix {
    if ($env:UNIQUE_SUFFIX) {
        return $env:UNIQUE_SUFFIX
    }
    
    $suffix = -join ((1..6) | ForEach-Object { Get-Random -Minimum 0 -Maximum 16 | ForEach-Object { '{0:x}' -f $_ } })
    Write-Log -Level INFO -Message "Generated unique suffix: $suffix"
    return $suffix
}

# Get admin credentials
function Get-AdminCredentials {
    $adminUsername = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { 'paymentsadmin' }
    
    $adminPassword = if ($env:ADMIN_PASSWORD) { 
        $env:ADMIN_PASSWORD 
    } else {
        # Generate a secure password
        $bytes = New-Object byte[] 32
        [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
        [Convert]::ToBase64String($bytes)
    }
    
    $sshPublicKey = ""
    if ($env:SSH_KEY_PATH -and (Test-Path $env:SSH_KEY_PATH)) {
        $sshPublicKey = Get-Content $env:SSH_KEY_PATH -Raw
        Write-Log -Level INFO -Message "Using SSH key from: $($env:SSH_KEY_PATH)"
    }
    else {
        Write-Log -Level WARN -Message "No SSH public key specified. SSH access will be disabled."
    }
    
    return @{
        Username = $adminUsername
        Password = $adminPassword
        SshPublicKey = $sshPublicKey.Trim()
    }
}

# Validate deployment
function Test-DeploymentTemplate {
    param(
        [string]$ResourceGroupName,
        [hashtable]$Parameters
    )
    
    if ($SkipValidation) {
        Write-Log -Level INFO -Message "Skipping validation as requested"
        return
    }
    
    Write-Log -Level INFO -Message "Validating deployment template..."
    
    try {
        $validationResult = Test-AzResourceGroupDeployment `
            -ResourceGroupName $ResourceGroupName `
            -TemplateFile (Join-Path $TemplateDir 'main.bicep') `
            -TemplateParameterObject $Parameters `
            -ErrorAction Stop
        
        if ($validationResult) {
            $errorMessages = $validationResult | ForEach-Object { $_.Message }
            Stop-ScriptWithError "Template validation failed: $($errorMessages -join '; ')"
        }
        
        Write-Log -Level SUCCESS -Message "Template validation passed"
    }
    catch {
        Stop-ScriptWithError "Template validation failed: $($_.Exception.Message)"
    }
}

# Estimate costs
function Get-CostEstimate {
    if (-not $EstimateCost) {
        return
    }
    
    Write-Log -Level INFO -Message "Estimating deployment costs..."
    
    $estimatedCost = switch ($Environment) {
        'dev'     { '$8,000' }
        'staging' { '$25,000' }
        'prod'    { '$58,000' }
    }
    
    Write-Log -Level INFO -Message "Estimated monthly cost for $Environment environment: $estimatedCost USD"
}

# Create resource group
function New-PaymentResourceGroup {
    param([string]$Name, [string]$Location)
    
    Write-Log -Level INFO -Message "Creating resource group: $Name"
    
    try {
        $existingRg = Get-AzResourceGroup -Name $Name -ErrorAction SilentlyContinue
        if ($existingRg) {
            Write-Log -Level INFO -Message "Resource group $Name already exists"
        }
        else {
            $tags = @{
                Environment = $Environment
                Application = 'cross-border-payments'
                CostCenter = 'fintech-operations'
                Owner = 'payment-platform-team'
                Compliance = 'pci-dss-level1'
            }
            
            New-AzResourceGroup -Name $Name -Location $Location -Tag $tags -ErrorAction Stop | Out-Null
            Write-Log -Level SUCCESS -Message "Created resource group: $Name"
        }
    }
    catch {
        Stop-ScriptWithError "Failed to create resource group: $($_.Exception.Message)"
    }
}

# Deploy infrastructure
function Deploy-Infrastructure {
    param(
        [string]$ResourceGroupName,
        [hashtable]$Parameters,
        [string]$UniqueSuffix
    )
    
    Write-Log -Level INFO -Message "Starting infrastructure deployment..."
    
    $deploymentName = "main-deployment-$Timestamp"
    
    try {
        if ($WhatIf) {
            Write-Log -Level INFO -Message "Running in what-if mode (no actual deployment)"
            
            $whatIfResult = Get-AzResourceGroupDeploymentWhatIfResult `
                -ResourceGroupName $ResourceGroupName `
                -Name $deploymentName `
                -TemplateFile (Join-Path $TemplateDir 'main.bicep') `
                -TemplateParameterObject $Parameters `
                -ErrorAction Stop
            
            Write-Host $whatIfResult.Change | Out-String
        }
        else {
            $deployment = New-AzResourceGroupDeployment `
                -ResourceGroupName $ResourceGroupName `
                -Name $deploymentName `
                -TemplateFile (Join-Path $TemplateDir 'main.bicep') `
                -TemplateParameterObject $Parameters `
                -Verbose `
                -ErrorAction Stop
            
            Write-Log -Level SUCCESS -Message "Infrastructure deployment completed successfully"
            
            # Display outputs
            if ($deployment.Outputs) {
                Write-Log -Level INFO -Message "Deployment outputs:"
                $deployment.Outputs | Format-Table -AutoSize
            }
            
            return $deployment
        }
    }
    catch {
        Stop-ScriptWithError "Infrastructure deployment failed: $($_.Exception.Message)"
    }
}

# Post-deployment configuration
function Set-PostDeploymentConfig {
    param(
        [object]$Deployment,
        [hashtable]$AdminCredentials
    )
    
    if ($WhatIf) {
        return
    }
    
    Write-Log -Level INFO -Message "Running post-deployment configuration..."
    
    try {
        # Store admin credentials in Key Vault
        if ($Deployment.Outputs.keyVaultName) {
            $keyVaultName = $Deployment.Outputs.keyVaultName.Value
            Write-Log -Level INFO -Message "Storing admin credentials in Key Vault: $keyVaultName"
            
            $usernameSecret = ConvertTo-SecureString -String $AdminCredentials.Username -AsPlainText -Force
            $passwordSecret = ConvertTo-SecureString -String $AdminCredentials.Password -AsPlainText -Force
            
            Set-AzKeyVaultSecret -VaultName $keyVaultName -Name 'admin-username' -SecretValue $usernameSecret -ContentType 'text/plain' | Out-Null
            Set-AzKeyVaultSecret -VaultName $keyVaultName -Name 'admin-password' -SecretValue $passwordSecret -ContentType 'text/plain' | Out-Null
            
            Write-Log -Level SUCCESS -Message "Admin credentials stored in Key Vault"
        }
        
        Write-Log -Level SUCCESS -Message "Post-deployment configuration completed"
    }
    catch {
        Write-Log -Level WARN -Message "Post-deployment configuration failed: $($_.Exception.Message)"
    }
}

# Print deployment summary
function Write-DeploymentSummary {
    param([object]$Deployment)
    
    if ($WhatIf) {
        Write-Log -Level INFO -Message "What-if deployment preview completed"
        return
    }
    
    $estimatedCost = switch ($Environment) {
        'dev'     { '$8,000' }
        'staging' { '$25,000' }
        'prod'    { '$58,000' }
    }
    
    $currentContext = Get-AzContext
    
    Write-Host @"

============================================
🎉 DEPLOYMENT SUMMARY
============================================

Environment:        $Environment
Location:           $Location
Resource Group:     $ResourceGroup
Subscription:       $($currentContext.Subscription.Name)

Estimated Monthly Cost: $estimatedCost USD

Next Steps:
1. Configure application deployments to AKS
2. Set up monitoring dashboards in Azure Monitor
3. Configure API Management policies
4. Test payment workflows
5. Set up backup and disaster recovery procedures

Useful PowerShell Commands:
- View resources: Get-AzResource -ResourceGroupName $ResourceGroup | Format-Table
- Monitor deployments: Get-AzResourceGroupDeployment -ResourceGroupName $ResourceGroup | Format-Table
- Access Key Vault: Get-AzKeyVault -ResourceGroupName $ResourceGroup | Format-Table

Documentation: $ProjectRoot\docs\azure-cross-border-payment-architecture.md
Logs: $LogFile

============================================

"@ -ForegroundColor Green
}

# Main execution
function Main {
    try {
        Write-Log -Level INFO -Message "Starting Azure Cross-Border Payment Infrastructure Deployment"
        Write-Log -Level INFO -Message "Environment: $Environment, Location: $Location"
        
        Test-Prerequisites
        
        $uniqueSuffix = Get-UniqueSuffix
        $adminCredentials = Get-AdminCredentials
        
        $deploymentParameters = @{
            environment = $Environment
            location = $Location
            uniqueSuffix = $uniqueSuffix
            adminUsername = $adminCredentials.Username
            adminPassword = $adminCredentials.Password
            sshPublicKey = $adminCredentials.SshPublicKey
        }
        
        New-PaymentResourceGroup -Name $ResourceGroup -Location $Location
        Test-DeploymentTemplate -ResourceGroupName $ResourceGroup -Parameters $deploymentParameters
        Get-CostEstimate
        
        $deployment = Deploy-Infrastructure -ResourceGroupName $ResourceGroup -Parameters $deploymentParameters -UniqueSuffix $uniqueSuffix
        Set-PostDeploymentConfig -Deployment $deployment -AdminCredentials $adminCredentials
        Write-DeploymentSummary -Deployment $deployment
        
        Write-Log -Level SUCCESS -Message "Deployment process completed successfully!"
    }
    catch {
        Write-Log -Level ERROR -Message "Deployment failed: $($_.Exception.Message)"
        throw
    }
}

# Execute main function
Main