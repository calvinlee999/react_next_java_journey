#!/bin/bash

# Azure API Management Deployment Script
# This script deploys Azure API Management using Infrastructure as Code (Bicep)
# Supports multiple environments with appropriate configurations

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_FILE="$SCRIPT_DIR/api-management.bicep"

# Default values
ENVIRONMENT="dev"
RESOURCE_GROUP=""
SUBSCRIPTION=""
LOCATION="East US"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy Azure API Management infrastructure"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment (dev, staging, prod) [default: dev]"
    echo "  -g, --resource-group Resource group name [required]"
    echo "  -s, --subscription   Azure subscription ID [optional]"
    echo "  -l, --location       Azure region [default: East US]"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev -g rg-goldenpath-dev"
    echo "  $0 -e prod -g rg-goldenpath-prod -s 12345678-1234-1234-1234-123456789012"
}

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    fi
    
    # Check if user is logged in
    if ! az account show &> /dev/null; then
        error "Not logged in to Azure. Please run 'az login' first."
    fi
    
    # Check if Bicep is available
    if ! az bicep version &> /dev/null; then
        log "Installing Bicep..."
        az bicep install
    fi
    
    log "Prerequisites check completed successfully"
}

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
    fi
}

set_subscription() {
    if [[ -n "$SUBSCRIPTION" ]]; then
        log "Setting active subscription to: $SUBSCRIPTION"
        az account set --subscription "$SUBSCRIPTION"
    fi
    
    # Display current subscription
    CURRENT_SUB=$(az account show --query "name" -o tsv)
    log "Using subscription: $CURRENT_SUB"
}

create_resource_group() {
    log "Checking if resource group '$RESOURCE_GROUP' exists..."
    
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
        az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    else
        log "Resource group '$RESOURCE_GROUP' already exists"
    fi
}

validate_bicep() {
    log "Validating Bicep template..."
    
    PARAMETERS_FILE="$SCRIPT_DIR/api-management.parameters.$ENVIRONMENT.json"
    
    if [[ ! -f "$PARAMETERS_FILE" ]]; then
        error "Parameters file not found: $PARAMETERS_FILE"
    fi
    
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$BICEP_FILE" \
        --parameters "@$PARAMETERS_FILE"
    
    log "Bicep template validation completed successfully"
}

deploy_infrastructure() {
    log "Starting Azure API Management deployment for environment: $ENVIRONMENT"
    
    PARAMETERS_FILE="$SCRIPT_DIR/api-management.parameters.$ENVIRONMENT.json"
    DEPLOYMENT_NAME="apim-deployment-$(date +%Y%m%d-%H%M%S)"
    
    log "Deployment name: $DEPLOYMENT_NAME"
    log "Using parameters file: $PARAMETERS_FILE"
    
    # Deploy the infrastructure
    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$BICEP_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --name "$DEPLOYMENT_NAME" \
        --verbose
    
    log "Deployment completed successfully"
}

get_deployment_outputs() {
    log "Retrieving deployment outputs..."
    
    # Get the latest deployment
    LATEST_DEPLOYMENT=$(az deployment group list \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?starts_with(name, 'apim-deployment')] | sort_by(@, &properties.timestamp) | [-1].name" \
        -o tsv)
    
    if [[ -n "$LATEST_DEPLOYMENT" ]]; then
        echo -e "${BLUE}=== Deployment Outputs ===${NC}"
        az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$LATEST_DEPLOYMENT" \
            --query "properties.outputs" \
            -o table
        
        # Get specific important outputs
        GATEWAY_URL=$(az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$LATEST_DEPLOYMENT" \
            --query "properties.outputs.apiManagementGatewayUrl.value" \
            -o tsv)
        
        PORTAL_URL=$(az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$LATEST_DEPLOYMENT" \
            --query "properties.outputs.developerPortalUrl.value" \
            -o tsv)
        
        echo -e "${GREEN}"
        echo "🔗 API Gateway URL: $GATEWAY_URL"
        echo "👨‍💻 Developer Portal: $PORTAL_URL"
        echo -e "${NC}"
    fi
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
        -s|--subscription)
            SUBSCRIPTION="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate required parameters
if [[ -z "$RESOURCE_GROUP" ]]; then
    error "Resource group is required. Use -g or --resource-group option."
fi

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                Azure API Management Deployment                ║"
    echo "║                     Level 1 Well-Architected                  ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "Starting deployment with the following configuration:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  Location: $LOCATION"
    echo "  Subscription: ${SUBSCRIPTION:-'(current)'}"
    echo ""
    
    validate_environment
    check_prerequisites
    set_subscription
    create_resource_group
    validate_bicep
    deploy_infrastructure
    get_deployment_outputs
    
    echo -e "${GREEN}"
    echo "🎉 Azure API Management deployment completed successfully!"
    echo "🔗 Your API gateway is now ready for enterprise-grade API management"
    echo "📚 Documentation: https://docs.microsoft.com/en-us/azure/api-management/"
    echo -e "${NC}"
}

# Execute main function
main