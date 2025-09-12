#!/bin/bash

# Confluent Cloud on Azure Marketplace Deployment Script
# This script deploys the complete Confluent Cloud infrastructure with Azure integration

set -e

# Configuration
RESOURCE_GROUP_NAME="confluent-cloud-rg"
LOCATION="eastus"
DEPLOYMENT_NAME="confluent-cloud-deployment-$(date +%Y%m%d-%H%M%S)"
TEMPLATE_FILE="infrastructure/bicep/confluent-cloud-azure-clean.bicep"
PARAMETERS_FILE="infrastructure/bicep/confluent-cloud.parameters.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Confluent Cloud on Azure Marketplace Deployment${NC}"
echo "======================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Azure CLI is installed and user is logged in
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Create resource group
create_resource_group() {
    print_info "Creating resource group: $RESOURCE_GROUP_NAME"
    
    if az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
        print_warning "Resource group $RESOURCE_GROUP_NAME already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP_NAME" \
            --location "$LOCATION" \
            --tags "project=azure-level-1" "component=confluent-cloud" "environment=development"
        print_status "Resource group created successfully"
    fi
}

# Create parameters file if it doesn't exist
create_parameters_file() {
    if [ ! -f "$PARAMETERS_FILE" ]; then
        print_info "Creating parameters file..."
        
        mkdir -p "$(dirname "$PARAMETERS_FILE")"
        
        cat > "$PARAMETERS_FILE" << EOF
{
  "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "confluentOrganizationName": {
      "value": "azure-level-1-org"
    },
    "confluentClusterName": {
      "value": "event-streaming-cluster"
    },
    "location": {
      "value": "$LOCATION"
    },
    "environment": {
      "value": "development"
    },
    "tags": {
      "value": {
        "project": "azure-level-1",
        "component": "confluent-cloud",
        "architecture": "event-driven"
      }
    }
  }
}
EOF
        print_status "Parameters file created"
    else
        print_status "Parameters file already exists"
    fi
}

# Validate Bicep template
validate_template() {
    print_info "Validating Bicep template..."
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        print_error "Template file $TEMPLATE_FILE not found"
        exit 1
    fi
    
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --output table
    
    print_status "Template validation successful"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_info "Deploying Confluent Cloud infrastructure..."
    
    az deployment group create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --output table
    
    print_status "Infrastructure deployment completed"
}

# Get deployment outputs
get_deployment_outputs() {
    print_info "Retrieving deployment outputs..."
    
    local outputs=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query 'properties.outputs' \
        --output json)
    
    echo "$outputs" > "deployment-outputs.json"
    
    print_status "Deployment outputs saved to deployment-outputs.json"
    
    # Extract key information
    local confluent_org_id=$(echo "$outputs" | jq -r '.confluentOrganizationId.value // "N/A"')
    local storage_account=$(echo "$outputs" | jq -r '.storageAccountName.value // "N/A"')
    local key_vault=$(echo "$outputs" | jq -r '.keyVaultName.value // "N/A"')
    local api_management=$(echo "$outputs" | jq -r '.apiManagementName.value // "N/A"')
    
    echo ""
    echo "🎉 Deployment Summary:"
    echo "====================="
    echo "Confluent Organization ID: $confluent_org_id"
    echo "Storage Account: $storage_account"
    echo "Key Vault: $key_vault"
    echo "API Management: $api_management"
    echo ""
}

# Configure AsyncAPI integration
configure_asyncapi() {
    print_info "Configuring AsyncAPI integration..."
    
    # This would typically involve:
    # 1. Setting up API Management policies for AsyncAPI
    # 2. Configuring Kafka topic schema mappings
    # 3. Setting up monitoring and logging
    
    print_warning "AsyncAPI configuration requires manual setup in Azure API Management"
    print_info "Please follow the documentation for AsyncAPI integration"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_info "Setting up monitoring and alerts..."
    
    # Create Application Insights alerts for Kafka metrics
    local app_insights_name="confluent-insights-$(date +%s)"
    
    print_warning "Monitoring setup requires Confluent Cloud API keys"
    print_info "Please configure Confluent Cloud monitoring in the portal"
}

# Cleanup function for failed deployments
cleanup_failed_deployment() {
    print_error "Deployment failed. Cleaning up resources..."
    
    if az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
        read -p "Do you want to delete the resource group $RESOURCE_GROUP_NAME? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            az group delete --name "$RESOURCE_GROUP_NAME" --yes --no-wait
            print_status "Resource group deletion initiated"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 CONFLUENT CLOUD DEPLOYMENT                  ║"
    echo "║              Azure Level 1 Event-Driven Architecture        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Set trap to cleanup on failure
    trap cleanup_failed_deployment ERR
    
    check_prerequisites
    create_resource_group
    create_parameters_file
    validate_template
    deploy_infrastructure
    get_deployment_outputs
    configure_asyncapi
    setup_monitoring
    
    echo ""
    print_status "🎊 Confluent Cloud deployment completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Configure Confluent Cloud API keys in Key Vault"
    echo "2. Set up AsyncAPI specifications in API Management"
    echo "3. Configure Kafka topic schemas in Schema Registry"
    echo "4. Test event streaming with the provided React component"
    echo ""
    print_warning "Remember to secure your Confluent Cloud credentials!"
    
    # Remove trap
    trap - ERR
}

# Handle script arguments
case "${1:-}" in
    "validate")
        check_prerequisites
        validate_template
        ;;
    "deploy")
        main
        ;;
    "cleanup")
        cleanup_failed_deployment
        ;;
    *)
        echo "Usage: $0 {validate|deploy|cleanup}"
        echo ""
        echo "Commands:"
        echo "  validate  - Validate the Bicep template only"
        echo "  deploy    - Full deployment (default)"
        echo "  cleanup   - Clean up failed deployment resources"
        echo ""
        main
        ;;
esac