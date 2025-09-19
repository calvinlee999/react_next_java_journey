#!/bin/bash

# Azure Cross-Border Payment Infrastructure Deployment Script
# This script deploys the complete Azure infrastructure using Bicep templates

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$PROJECT_ROOT/templates"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/deploy-$TIMESTAMP.log"

# Default values
DEFAULT_ENVIRONMENT="dev"
DEFAULT_LOCATION="eastus2"
DEFAULT_SUBSCRIPTION_ID=""
SKIP_VALIDATION=false
WHAT_IF=false
ESTIMATE_COST=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
    
    case $level in
        "ERROR")
            echo -e "${RED}ERROR: ${message}${NC}" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}WARNING: ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}SUCCESS: ${message}${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}INFO: ${message}${NC}"
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Cleanup on exit
cleanup() {
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Deployment failed. Check logs at $LOG_FILE"
    fi
}
trap cleanup EXIT

# Help function
show_help() {
    cat << EOF
Azure Cross-Border Payment Infrastructure Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment       Environment (dev, staging, prod) [default: $DEFAULT_ENVIRONMENT]
    -l, --location          Azure region [default: $DEFAULT_LOCATION]
    -g, --resource-group    Resource group name [default: rg-payments-{environment}]
    -s, --subscription-id   Azure subscription ID [default: current subscription]
    --skip-validation       Skip pre-deployment validation
    --what-if              Show what would be deployed without deploying
    --estimate-cost        Estimate deployment costs
    -h, --help             Show this help message

EXAMPLES:
    $0                                          # Deploy to dev with defaults
    $0 -e prod -l westeurope                   # Deploy to prod in West Europe
    $0 --what-if --estimate-cost               # Preview deployment with costs
    $0 -g my-custom-rg -e staging             # Deploy to custom resource group

ENVIRONMENT VARIABLES:
    AZURE_SUBSCRIPTION_ID      Azure subscription ID
    AZURE_LOCATION            Default Azure region
    ADMIN_USERNAME            Admin username for resources
    SSH_KEY_PATH              Path to SSH public key
    UNIQUE_SUFFIX             Unique suffix for resource naming

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -l|--location)
                LOCATION="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -s|--subscription-id)
                SUBSCRIPTION_ID="$2"
                shift 2
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --what-if)
                WHAT_IF=true
                shift
                ;;
            --estimate-cost)
                ESTIMATE_COST=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Set defaults for unspecified parameters
    ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
    LOCATION="${LOCATION:-${AZURE_LOCATION:-$DEFAULT_LOCATION}}"
    SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-${AZURE_SUBSCRIPTION_ID:-$DEFAULT_SUBSCRIPTION_ID}}"
    RESOURCE_GROUP="${RESOURCE_GROUP:-rg-payments-$ENVIRONMENT}"
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        error_exit "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        error_exit "Azure CLI is not installed. Please install Azure CLI."
    fi
    
    # Check Bicep CLI
    if ! command -v bicep &> /dev/null; then
        error_exit "Bicep CLI is not installed. Please install Bicep CLI."
    fi
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        error_exit "Not logged in to Azure. Please run 'az login'."
    fi
    
    # Set subscription if specified
    if [[ -n "$SUBSCRIPTION_ID" ]]; then
        log "INFO" "Setting subscription to $SUBSCRIPTION_ID"
        az account set --subscription "$SUBSCRIPTION_ID" || error_exit "Failed to set subscription"
    fi
    
    # Get current subscription
    CURRENT_SUBSCRIPTION=$(az account show --query id -o tsv)
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    log "INFO" "Using subscription: $SUBSCRIPTION_NAME ($CURRENT_SUBSCRIPTION)"
    
    log "SUCCESS" "Prerequisites check completed"
}

# Create log directory
create_log_directory() {
    if [[ ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log "INFO" "Created log directory: $LOG_DIR"
    fi
}

# Generate unique suffix
generate_unique_suffix() {
    if [[ -z "${UNIQUE_SUFFIX:-}" ]]; then
        UNIQUE_SUFFIX=$(openssl rand -hex 3)
        log "INFO" "Generated unique suffix: $UNIQUE_SUFFIX"
    fi
}

# Get admin credentials
get_admin_credentials() {
    ADMIN_USERNAME="${ADMIN_USERNAME:-paymentsadmin}"
    
    if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
        ADMIN_PASSWORD=$(openssl rand -base64 32)
        log "INFO" "Generated admin password (stored in Key Vault)"
    fi
    
    if [[ -n "${SSH_KEY_PATH:-}" ]] && [[ -f "$SSH_KEY_PATH" ]]; then
        SSH_PUBLIC_KEY=$(cat "$SSH_KEY_PATH")
        log "INFO" "Using SSH key from: $SSH_KEY_PATH"
    else
        SSH_PUBLIC_KEY=""
        log "WARN" "No SSH public key specified. SSH access will be disabled."
    fi
}

# Validate deployment
validate_deployment() {
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log "INFO" "Skipping validation as requested"
        return 0
    fi
    
    log "INFO" "Validating deployment template..."
    
    local validation_result
    validation_result=$(az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$TEMPLATE_DIR/main.bicep" \
        --parameters \
            environment="$ENVIRONMENT" \
            location="$LOCATION" \
            uniqueSuffix="$UNIQUE_SUFFIX" \
            adminUsername="$ADMIN_USERNAME" \
            adminPassword="$ADMIN_PASSWORD" \
            sshPublicKey="$SSH_PUBLIC_KEY" \
        --query "error" -o tsv 2>&1)
    
    if [[ "$validation_result" != "null" ]] && [[ -n "$validation_result" ]]; then
        error_exit "Template validation failed: $validation_result"
    fi
    
    log "SUCCESS" "Template validation passed"
}

# Estimate costs
estimate_costs() {
    if [[ "$ESTIMATE_COST" != "true" ]]; then
        return 0
    fi
    
    log "INFO" "Estimating deployment costs..."
    
    # Cost estimation based on environment
    case "$ENVIRONMENT" in
        "dev")
            ESTIMATED_MONTHLY_COST="$8,000"
            ;;
        "staging")
            ESTIMATED_MONTHLY_COST="$25,000"
            ;;
        "prod")
            ESTIMATED_MONTHLY_COST="$58,000"
            ;;
    esac
    
    log "INFO" "Estimated monthly cost for $ENVIRONMENT environment: $ESTIMATED_MONTHLY_COST USD"
}

# Create resource group
create_resource_group() {
    log "INFO" "Creating resource group: $RESOURCE_GROUP"
    
    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log "INFO" "Resource group $RESOURCE_GROUP already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --tags \
                Environment="$ENVIRONMENT" \
                Application="cross-border-payments" \
                CostCenter="fintech-operations" \
                Owner="payment-platform-team" \
                Compliance="pci-dss-level1" \
            || error_exit "Failed to create resource group"
        
        log "SUCCESS" "Created resource group: $RESOURCE_GROUP"
    fi
}

# Deploy infrastructure
deploy_infrastructure() {
    log "INFO" "Starting infrastructure deployment..."
    
    local deployment_mode="--mode Complete"
    if [[ "$WHAT_IF" == "true" ]]; then
        deployment_mode="--what-if"
        log "INFO" "Running in what-if mode (no actual deployment)"
    fi
    
    local deployment_name="main-deployment-$TIMESTAMP"
    
    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$deployment_name" \
        --template-file "$TEMPLATE_DIR/main.bicep" \
        --parameters \
            environment="$ENVIRONMENT" \
            location="$LOCATION" \
            uniqueSuffix="$UNIQUE_SUFFIX" \
            adminUsername="$ADMIN_USERNAME" \
            adminPassword="$ADMIN_PASSWORD" \
            sshPublicKey="$SSH_PUBLIC_KEY" \
        $deployment_mode \
        --verbose \
        || error_exit "Infrastructure deployment failed"
    
    if [[ "$WHAT_IF" != "true" ]]; then
        log "SUCCESS" "Infrastructure deployment completed successfully"
        
        # Get deployment outputs
        log "INFO" "Retrieving deployment outputs..."
        az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$deployment_name" \
            --query "properties.outputs" \
            --output table
    fi
}

# Post-deployment configuration
post_deployment_config() {
    if [[ "$WHAT_IF" == "true" ]]; then
        return 0
    fi
    
    log "INFO" "Running post-deployment configuration..."
    
    # Store admin credentials in Key Vault
    local key_vault_name
    key_vault_name=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "main-deployment-$TIMESTAMP" \
        --query "properties.outputs.keyVaultName.value" -o tsv)
    
    if [[ -n "$key_vault_name" ]]; then
        log "INFO" "Storing admin credentials in Key Vault: $key_vault_name"
        
        az keyvault secret set \
            --vault-name "$key_vault_name" \
            --name "admin-username" \
            --value "$ADMIN_USERNAME" \
            --description "Payment platform admin username" \
            > /dev/null
        
        az keyvault secret set \
            --vault-name "$key_vault_name" \
            --name "admin-password" \
            --value "$ADMIN_PASSWORD" \
            --description "Payment platform admin password" \
            > /dev/null
        
        log "SUCCESS" "Admin credentials stored in Key Vault"
    fi
    
    log "SUCCESS" "Post-deployment configuration completed"
}

# Print deployment summary
print_summary() {
    if [[ "$WHAT_IF" == "true" ]]; then
        log "INFO" "What-if deployment preview completed"
        return 0
    fi
    
    cat << EOF

============================================
🎉 DEPLOYMENT SUMMARY
============================================

Environment:        $ENVIRONMENT
Location:           $LOCATION
Resource Group:     $RESOURCE_GROUP
Subscription:       $SUBSCRIPTION_NAME

Estimated Monthly Cost: $ESTIMATED_MONTHLY_COST USD

Next Steps:
1. Configure application deployments to AKS
2. Set up monitoring dashboards in Azure Monitor
3. Configure API Management policies
4. Test payment workflows
5. Set up backup and disaster recovery procedures

Useful Commands:
- View resources: az resource list --resource-group $RESOURCE_GROUP --output table
- Monitor deployments: az deployment group list --resource-group $RESOURCE_GROUP --output table
- Access Key Vault: az keyvault list --resource-group $RESOURCE_GROUP --output table

Documentation: $PROJECT_ROOT/docs/azure-cross-border-payment-architecture.md
Logs: $LOG_FILE

============================================

EOF
}

# Main execution
main() {
    create_log_directory
    parse_args "$@"
    
    log "INFO" "Starting Azure Cross-Border Payment Infrastructure Deployment"
    log "INFO" "Environment: $ENVIRONMENT, Location: $LOCATION"
    
    check_prerequisites
    generate_unique_suffix
    get_admin_credentials
    create_resource_group
    validate_deployment
    estimate_costs
    deploy_infrastructure
    post_deployment_config
    print_summary
    
    log "SUCCESS" "Deployment process completed successfully!"
}

# Execute main function with all arguments
main "$@"