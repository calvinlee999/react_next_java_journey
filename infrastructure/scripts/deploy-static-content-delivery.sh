#!/bin/bash

# Azure Static Content Delivery Deployment Script
# Deploys Azure Blob Storage, CDN, and Front Door for optimized content delivery

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
RESOURCE_GROUP=""
LOCATION="eastus"
SUBSCRIPTION_ID=""
DEPLOY_CDN=true
DEPLOY_FRONT_DOOR=true
DEPLOY_STATIC_WEBSITE=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV          Deployment environment (dev, staging, prod) [default: dev]"
    echo "  -g, --resource-group GROUP     Azure resource group name [required]"
    echo "  -l, --location LOCATION        Azure region [default: eastus]"
    echo "  -s, --subscription-id ID       Azure subscription ID [required]"
    echo "  --no-cdn                       Skip CDN deployment"
    echo "  --no-front-door               Skip Front Door deployment"
    echo "  --no-static-website           Skip static website hosting"
    echo "  -h, --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev -g rg-reactjava-dev -s 12345678-1234-1234-1234-123456789012"
    echo "  $0 -e prod -g rg-reactjava-prod -s 12345678-1234-1234-1234-123456789012 --no-cdn"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -s|--subscription-id)
            SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        --no-cdn)
            DEPLOY_CDN=false
            shift
            ;;
        --no-front-door)
            DEPLOY_FRONT_DOOR=false
            shift
            ;;
        --no-static-website)
            DEPLOY_STATIC_WEBSITE=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$RESOURCE_GROUP" ]]; then
    print_error "Resource group is required. Use -g or --resource-group"
    show_usage
    exit 1
fi

if [[ -z "$SUBSCRIPTION_ID" ]]; then
    print_error "Subscription ID is required. Use -s or --subscription-id"
    show_usage
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Environment must be one of: dev, staging, prod"
    exit 1
fi

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_DIR="$SCRIPT_DIR"
PARAMETERS_FILE="$BICEP_DIR/static-content-delivery.parameters.$ENVIRONMENT.json"

print_status "Starting Azure Static Content Delivery deployment..."
print_status "Environment: $ENVIRONMENT"
print_status "Resource Group: $RESOURCE_GROUP"
print_status "Location: $LOCATION"
print_status "Subscription: $SUBSCRIPTION_ID"
print_status "Deploy CDN: $DEPLOY_CDN"
print_status "Deploy Front Door: $DEPLOY_FRONT_DOOR"
print_status "Deploy Static Website: $DEPLOY_STATIC_WEBSITE"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    print_status "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if parameters file exists
if [[ ! -f "$PARAMETERS_FILE" ]]; then
    print_error "Parameters file not found: $PARAMETERS_FILE"
    exit 1
fi

print_status "Using parameters file: $PARAMETERS_FILE"

# Login check
print_status "Checking Azure login status..."
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Please log in."
    az login
fi

# Set subscription
print_status "Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

# Check if resource group exists, create if not
print_status "Checking resource group..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    print_status "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    print_success "Resource group created successfully"
else
    print_status "Resource group already exists"
fi

# Update parameters file with dynamic values
print_status "Updating deployment parameters..."
TEMP_PARAMS_FILE="/tmp/static-content-delivery.parameters.$ENVIRONMENT.$(date +%s).json"
cp "$PARAMETERS_FILE" "$TEMP_PARAMS_FILE"

# Update parameters using jq if available, otherwise use sed
if command -v jq &> /dev/null; then
    jq --arg env "$ENVIRONMENT" \
       --arg location "$LOCATION" \
       --argjson enableCDN "$DEPLOY_CDN" \
       --argjson enableFrontDoor "$DEPLOY_FRONT_DOOR" \
       --argjson enableStaticWebsite "$DEPLOY_STATIC_WEBSITE" \
       '.parameters.environment.value = $env |
        .parameters.location.value = $location |
        .parameters.enableCDN.value = $enableCDN |
        .parameters.enableFrontDoor.value = $enableFrontDoor |
        .parameters.enableStaticWebsite.value = $enableStaticWebsite' \
       "$PARAMETERS_FILE" > "$TEMP_PARAMS_FILE"
else
    print_warning "jq not found, using static parameters file"
    cp "$PARAMETERS_FILE" "$TEMP_PARAMS_FILE"
fi

# Deploy Bicep template
print_status "Starting Bicep deployment..."
DEPLOYMENT_NAME="static-content-delivery-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_DIR/static-content-delivery-clean.bicep" \
    --parameters "@$TEMP_PARAMS_FILE" \
    --name "$DEPLOYMENT_NAME" \
    --verbose

if [[ $? -eq 0 ]]; then
    print_success "Bicep deployment completed successfully"
    
    # Get deployment outputs
    print_status "Retrieving deployment outputs..."
    OUTPUTS=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output json)
    
    if [[ -n "$OUTPUTS" && "$OUTPUTS" != "null" ]]; then
        echo ""
        print_success "=== Deployment Outputs ==="
        echo "$OUTPUTS" | jq -r '
            "Storage Account: " + (.storageAccountName.value // "N/A"),
            "Static Website URL: " + (.staticWebsiteUrl.value // "N/A"),
            "Blob Storage URL: " + (.blobStorageUrl.value // "N/A"),
            (if .cdnWebsiteEndpointUrl.value then "CDN Website URL: " + .cdnWebsiteEndpointUrl.value else empty end),
            (if .cdnAssetsEndpointUrl.value then "CDN Assets URL: " + .cdnAssetsEndpointUrl.value else empty end),
            (if .frontDoorEndpointUrl.value then "Front Door URL: " + .frontDoorEndpointUrl.value else empty end),
            "",
            "=== Resource URLs ===",
            (.resourceUrls.value | to_entries[] | "\(.key): \(.value)")
        '
    fi
    
    # Enable static website hosting if requested
    if [[ "$DEPLOY_STATIC_WEBSITE" == "true" ]]; then
        print_status "Enabling static website hosting..."
        STORAGE_ACCOUNT_NAME=$(echo "$OUTPUTS" | jq -r '.storageAccountName.value')
        
        if [[ -n "$STORAGE_ACCOUNT_NAME" && "$STORAGE_ACCOUNT_NAME" != "null" ]]; then
            az storage blob service-properties update \
                --account-name "$STORAGE_ACCOUNT_NAME" \
                --static-website \
                --index-document "index.html" \
                --404-document "404.html" \
                --auth-mode login
            
            print_success "Static website hosting enabled"
        else
            print_warning "Could not retrieve storage account name for static website configuration"
        fi
    fi
    
    # Cleanup temporary files
    rm -f "$TEMP_PARAMS_FILE"
    
    echo ""
    print_success "Azure Static Content Delivery deployment completed successfully!"
    print_status "You can now upload your static files to the storage account"
    
    if [[ "$DEPLOY_CDN" == "true" ]]; then
        print_status "CDN is configured and ready to cache your content"
    fi
    
    if [[ "$DEPLOY_FRONT_DOOR" == "true" ]]; then
        print_status "Front Door is configured with WAF protection"
    fi
    
else
    print_error "Bicep deployment failed"
    rm -f "$TEMP_PARAMS_FILE"
    exit 1
fi

print_status "Next steps:"
echo "1. Upload your static website files to the storage account"
echo "2. Update your DNS records to point to the CDN or Front Door endpoint"
echo "3. Configure custom domains if needed"
echo "4. Test your website and monitor performance metrics"