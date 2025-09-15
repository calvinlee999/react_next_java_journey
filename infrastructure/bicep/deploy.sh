#!/bin/bash

# Azure AI Platform Infrastructure Deployment Script
# This script deploys the complete 13-layer enterprise infrastructure

set -e  # Exit on any error

# Configuration
SUBSCRIPTION_ID=""
DEPLOYMENT_NAME="ai-platform-infrastructure-$(date +%Y%m%d-%H%M%S)"
TEMPLATE_FILE="./main.bicep"
LOCATION="eastus2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is logged in
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Check if Bicep CLI is installed
    if ! command -v az bicep &> /dev/null; then
        print_warning "Bicep CLI not found. Installing Bicep..."
        az bicep install
    fi
    
    print_success "Prerequisites check completed."
}

# Function to validate template
validate_template() {
    local environment=$1
    print_status "Validating Bicep template for $environment environment..."
    
    if az deployment sub validate \
        --location "$LOCATION" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@parameters/${environment}.parameters.json" \
        --only-show-errors; then
        print_success "Template validation passed for $environment environment."
    else
        print_error "Template validation failed for $environment environment."
        exit 1
    fi
}

# Function to estimate deployment cost
estimate_cost() {
    local environment=$1
    print_status "Estimating deployment cost for $environment environment..."
    
    # Note: Azure doesn't have a direct CLI command for cost estimation
    # This would typically be done through Azure Cost Management APIs
    print_warning "Cost estimation feature not implemented in this script."
    print_status "Please use Azure Cost Management in the portal for cost estimation."
}

# Function to deploy infrastructure
deploy_infrastructure() {
    local environment=$1
    local whatif=${2:-false}
    
    if [ "$whatif" = true ]; then
        print_status "Running what-if analysis for $environment environment..."
        az deployment sub what-if \
            --location "$LOCATION" \
            --template-file "$TEMPLATE_FILE" \
            --parameters "@parameters/${environment}.parameters.json" \
            --name "$DEPLOYMENT_NAME-whatif"
    else
        print_status "Deploying infrastructure for $environment environment..."
        print_warning "This will deploy real Azure resources and may incur costs."
        
        # Confirm deployment
        read -p "Do you want to continue with the deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled by user."
            exit 0
        fi
        
        # Start deployment
        print_status "Starting deployment: $DEPLOYMENT_NAME"
        if az deployment sub create \
            --location "$LOCATION" \
            --template-file "$TEMPLATE_FILE" \
            --parameters "@parameters/${environment}.parameters.json" \
            --name "$DEPLOYMENT_NAME" \
            --verbose; then
            print_success "Deployment completed successfully!"
            
            # Get deployment outputs
            print_status "Retrieving deployment outputs..."
            az deployment sub show \
                --name "$DEPLOYMENT_NAME" \
                --query properties.outputs \
                --output table
        else
            print_error "Deployment failed!"
            exit 1
        fi
    fi
}

# Function to clean up resources
cleanup_resources() {
    local environment=$1
    print_warning "This will DELETE all resources for $environment environment!"
    read -p "Are you sure you want to delete all resources? Type 'DELETE' to confirm: " -r
    echo
    if [[ $REPLY == "DELETE" ]]; then
        print_status "Deleting resource groups for $environment environment..."
        
        # Get resource groups to delete
        local resource_groups=(
            "aiplatform-${environment}-primary-rg"
            "aiplatform-${environment}-secondary-rg"
            "aiplatform-${environment}-tertiary-rg"
            "aiplatform-${environment}-shared-rg"
        )
        
        for rg in "${resource_groups[@]}"; do
            if az group exists --name "$rg"; then
                print_status "Deleting resource group: $rg"
                az group delete --name "$rg" --yes --no-wait
            else
                print_warning "Resource group $rg does not exist, skipping..."
            fi
        done
        
        print_success "Cleanup initiated. Resources are being deleted in the background."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show deployment status
show_status() {
    local deployment_name=${1:-$DEPLOYMENT_NAME}
    print_status "Checking deployment status..."
    
    az deployment sub show \
        --name "$deployment_name" \
        --query '{name:name, state:properties.provisioningState, timestamp:properties.timestamp}' \
        --output table
}

# Function to show help
show_help() {
    echo "Azure AI Platform Infrastructure Deployment Script"
    echo
    echo "Usage: $0 [OPTIONS] ENVIRONMENT"
    echo
    echo "ENVIRONMENT:"
    echo "  dev          Deploy development environment"
    echo "  staging      Deploy staging environment"
    echo "  prod         Deploy production environment"
    echo
    echo "OPTIONS:"
    echo "  --validate   Validate template only"
    echo "  --whatif     Show what-if analysis"
    echo "  --cost       Estimate deployment cost"
    echo "  --status     Show deployment status"
    echo "  --cleanup    Delete all resources"
    echo "  --help       Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev                     # Deploy development environment"
    echo "  $0 --validate prod         # Validate production template"
    echo "  $0 --whatif prod          # Show what-if for production"
    echo "  $0 --cleanup dev          # Delete development resources"
}

# Main function
main() {
    local environment=""
    local action="deploy"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --validate)
                action="validate"
                shift
                ;;
            --whatif)
                action="whatif"
                shift
                ;;
            --cost)
                action="cost"
                shift
                ;;
            --status)
                action="status"
                shift
                ;;
            --cleanup)
                action="cleanup"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            dev|staging|prod)
                environment=$1
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check if environment is provided (except for status and help)
    if [[ "$action" != "status" && "$action" != "help" && -z "$environment" ]]; then
        print_error "Environment must be specified (dev, staging, or prod)"
        show_help
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Execute action
    case $action in
        validate)
            validate_template "$environment"
            ;;
        whatif)
            validate_template "$environment"
            deploy_infrastructure "$environment" true
            ;;
        cost)
            estimate_cost "$environment"
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup_resources "$environment"
            ;;
        deploy)
            validate_template "$environment"
            deploy_infrastructure "$environment"
            ;;
    esac
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi