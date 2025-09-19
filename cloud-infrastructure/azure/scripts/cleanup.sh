#!/bin/bash

# Azure Cross-Border Payment Infrastructure Cleanup Script
# This script safely removes Azure resources to avoid unnecessary costs

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/cleanup-$TIMESTAMP.log"

# Default values
DEFAULT_ENVIRONMENT="dev"
CONFIRM_DELETION=true
PRESERVE_DATA=false
EXPORT_CONFIG=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Help function
show_help() {
    cat << EOF
Azure Cross-Border Payment Infrastructure Cleanup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment       Environment to cleanup (dev, staging, prod) [default: $DEFAULT_ENVIRONMENT]
    -g, --resource-group    Resource group name [default: rg-payments-{environment}]
    -s, --subscription-id   Azure subscription ID [default: current subscription]
    --force                 Skip deletion confirmation prompts
    --preserve-data         Preserve data resources (databases, storage)
    --export-config         Export configuration before deletion
    -h, --help             Show this help message

EXAMPLES:
    $0                                          # Cleanup dev environment with confirmation
    $0 -e staging --force                      # Force cleanup staging without prompts
    $0 --preserve-data --export-config         # Cleanup but preserve data and export configs

SAFETY FEATURES:
    - Interactive confirmation prompts
    - Data preservation options
    - Configuration export
    - Detailed logging

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
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -s|--subscription-id)
                SUBSCRIPTION_ID="$2"
                shift 2
                ;;
            --force)
                CONFIRM_DELETION=false
                shift
                ;;
            --preserve-data)
                PRESERVE_DATA=true
                shift
                ;;
            --export-config)
                EXPORT_CONFIG=true
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
    
    # Set defaults
    ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
    RESOURCE_GROUP="${RESOURCE_GROUP:-rg-payments-$ENVIRONMENT}"
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        error_exit "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    fi
}

# Create log directory
create_log_directory() {
    if [[ ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log "INFO" "Created log directory: $LOG_DIR"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        error_exit "Azure CLI is not installed."
    fi
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        error_exit "Not logged in to Azure. Please run 'az login'."
    fi
    
    # Set subscription if specified
    if [[ -n "${SUBSCRIPTION_ID:-}" ]]; then
        log "INFO" "Setting subscription to $SUBSCRIPTION_ID"
        az account set --subscription "$SUBSCRIPTION_ID" || error_exit "Failed to set subscription"
    fi
    
    # Get current subscription
    CURRENT_SUBSCRIPTION=$(az account show --query id -o tsv)
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    log "INFO" "Using subscription: $SUBSCRIPTION_NAME ($CURRENT_SUBSCRIPTION)"
    
    log "SUCCESS" "Prerequisites check completed"
}

# Confirm deletion
confirm_deletion() {
    if [[ "$CONFIRM_DELETION" == "false" ]]; then
        log "WARN" "Force mode enabled - skipping confirmations"
        return 0
    fi
    
    echo
    echo -e "${RED}⚠️  WARNING: This will delete Azure resources!${NC}"
    echo
    echo "Environment: $ENVIRONMENT"
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Subscription: $SUBSCRIPTION_NAME"
    echo
    echo -e "${YELLOW}The following will be deleted:${NC}"
    echo "- All compute resources (AKS, VMs, App Services)"
    echo "- Networking resources (VNets, Load Balancers, Gateways)"
    echo "- API Management instances"
    echo "- Azure Cache for Redis"
    echo "- Key Vault (if not preserving data)"
    echo "- Storage accounts (if not preserving data)"
    echo "- Databases (if not preserving data)"
    echo
    
    if [[ "$PRESERVE_DATA" == "true" ]]; then
        echo -e "${GREEN}✓ Data resources will be preserved${NC}"
    else
        echo -e "${RED}⚠️  Data resources will be DELETED${NC}"
    fi
    
    echo
    read -p "Are you sure you want to proceed? (type 'DELETE' to confirm): " confirmation
    
    if [[ "$confirmation" != "DELETE" ]]; then
        log "INFO" "Cleanup cancelled by user"
        exit 0
    fi
    
    log "WARN" "User confirmed deletion - proceeding with cleanup"
}

# Export configuration
export_configuration() {
    if [[ "$EXPORT_CONFIG" != "true" ]]; then
        return 0
    fi
    
    log "INFO" "Exporting configuration before deletion..."
    
    local export_dir="$LOG_DIR/config-export-$TIMESTAMP"
    mkdir -p "$export_dir"
    
    # Export resource group details
    az group show --name "$RESOURCE_GROUP" > "$export_dir/resource-group.json" 2>/dev/null || true
    
    # Export resource list
    az resource list --resource-group "$RESOURCE_GROUP" > "$export_dir/resources.json" 2>/dev/null || true
    
    # Export specific configurations
    local key_vault_name
    key_vault_name=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
    if [[ -n "$key_vault_name" ]]; then
        az keyvault secret list --vault-name "$key_vault_name" > "$export_dir/keyvault-secrets.json" 2>/dev/null || true
    fi
    
    # Export deployment history
    az deployment group list --resource-group "$RESOURCE_GROUP" > "$export_dir/deployments.json" 2>/dev/null || true
    
    log "SUCCESS" "Configuration exported to: $export_dir"
}

# Delete compute resources
delete_compute_resources() {
    log "INFO" "Deleting compute resources..."
    
    # Delete AKS clusters
    local aks_clusters
    aks_clusters=$(az aks list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for cluster in $aks_clusters; do
        if [[ -n "$cluster" ]]; then
            log "INFO" "Deleting AKS cluster: $cluster"
            az aks delete --resource-group "$RESOURCE_GROUP" --name "$cluster" --yes --no-wait
        fi
    done
    
    # Delete App Service plans and apps
    local app_services
    app_services=$(az webapp list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for app in $app_services; do
        if [[ -n "$app" ]]; then
            log "INFO" "Deleting App Service: $app"
            az webapp delete --resource-group "$RESOURCE_GROUP" --name "$app"
        fi
    done
    
    local app_plans
    app_plans=$(az appservice plan list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for plan in $app_plans; do
        if [[ -n "$plan" ]]; then
            log "INFO" "Deleting App Service Plan: $plan"
            az appservice plan delete --resource-group "$RESOURCE_GROUP" --name "$plan" --yes
        fi
    done
    
    log "SUCCESS" "Compute resources deletion initiated"
}

# Delete networking resources
delete_networking_resources() {
    log "INFO" "Deleting networking resources..."
    
    # Delete Application Gateways
    local app_gateways
    app_gateways=$(az network application-gateway list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for gateway in $app_gateways; do
        if [[ -n "$gateway" ]]; then
            log "INFO" "Deleting Application Gateway: $gateway"
            az network application-gateway delete --resource-group "$RESOURCE_GROUP" --name "$gateway" --no-wait
        fi
    done
    
    # Delete Load Balancers
    local load_balancers
    load_balancers=$(az network lb list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for lb in $load_balancers; do
        if [[ -n "$lb" ]]; then
            log "INFO" "Deleting Load Balancer: $lb"
            az network lb delete --resource-group "$RESOURCE_GROUP" --name "$lb"
        fi
    done
    
    # Delete Public IPs
    local public_ips
    public_ips=$(az network public-ip list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for ip in $public_ips; do
        if [[ -n "$ip" ]]; then
            log "INFO" "Deleting Public IP: $ip"
            az network public-ip delete --resource-group "$RESOURCE_GROUP" --name "$ip"
        fi
    done
    
    # Delete VNets (this will delete subnets and NSGs)
    local vnets
    vnets=$(az network vnet list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for vnet in $vnets; do
        if [[ -n "$vnet" ]]; then
            log "INFO" "Deleting Virtual Network: $vnet"
            az network vnet delete --resource-group "$RESOURCE_GROUP" --name "$vnet"
        fi
    done
    
    log "SUCCESS" "Networking resources deletion completed"
}

# Delete API Management
delete_api_management() {
    log "INFO" "Deleting API Management resources..."
    
    local apim_services
    apim_services=$(az apim list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for apim in $apim_services; do
        if [[ -n "$apim" ]]; then
            log "INFO" "Deleting API Management: $apim"
            az apim delete --resource-group "$RESOURCE_GROUP" --name "$apim" --yes --no-wait
        fi
    done
    
    log "SUCCESS" "API Management deletion initiated"
}

# Delete caching resources
delete_caching_resources() {
    log "INFO" "Deleting caching resources..."
    
    local redis_caches
    redis_caches=$(az redis list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for cache in $redis_caches; do
        if [[ -n "$cache" ]]; then
            log "INFO" "Deleting Redis Cache: $cache"
            az redis delete --resource-group "$RESOURCE_GROUP" --name "$cache" --yes
        fi
    done
    
    log "SUCCESS" "Caching resources deletion completed"
}

# Delete data resources (conditional)
delete_data_resources() {
    if [[ "$PRESERVE_DATA" == "true" ]]; then
        log "INFO" "Preserving data resources as requested"
        return 0
    fi
    
    log "INFO" "Deleting data resources..."
    
    # Delete SQL databases and servers
    local sql_servers
    sql_servers=$(az sql server list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for server in $sql_servers; do
        if [[ -n "$server" ]]; then
            log "INFO" "Deleting SQL Server: $server"
            az sql server delete --resource-group "$RESOURCE_GROUP" --name "$server" --yes
        fi
    done
    
    # Delete Storage accounts
    local storage_accounts
    storage_accounts=$(az storage account list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for account in $storage_accounts; do
        if [[ -n "$account" ]]; then
            log "INFO" "Deleting Storage Account: $account"
            az storage account delete --resource-group "$RESOURCE_GROUP" --name "$account" --yes
        fi
    done
    
    # Delete Key Vault
    local key_vaults
    key_vaults=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for vault in $key_vaults; do
        if [[ -n "$vault" ]]; then
            log "INFO" "Deleting Key Vault: $vault"
            az keyvault delete --resource-group "$RESOURCE_GROUP" --name "$vault"
            # Purge soft-deleted vault
            az keyvault purge --name "$vault" --location "$(az keyvault show --name "$vault" --query location -o tsv 2>/dev/null || echo 'eastus2')" 2>/dev/null || true
        fi
    done
    
    log "SUCCESS" "Data resources deletion completed"
}

# Delete monitoring resources
delete_monitoring_resources() {
    log "INFO" "Deleting monitoring resources..."
    
    # Delete Application Insights
    local app_insights
    app_insights=$(az monitor app-insights component show --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for insight in $app_insights; do
        if [[ -n "$insight" ]]; then
            log "INFO" "Deleting Application Insights: $insight"
            az monitor app-insights component delete --resource-group "$RESOURCE_GROUP" --app "$insight"
        fi
    done
    
    # Delete Log Analytics workspaces
    local workspaces
    workspaces=$(az monitor log-analytics workspace list --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv 2>/dev/null || true)
    for workspace in $workspaces; do
        if [[ -n "$workspace" ]]; then
            log "INFO" "Deleting Log Analytics Workspace: $workspace"
            az monitor log-analytics workspace delete --resource-group "$RESOURCE_GROUP" --workspace-name "$workspace" --yes
        fi
    done
    
    log "SUCCESS" "Monitoring resources deletion completed"
}

# Wait for long-running deletions
wait_for_deletions() {
    log "INFO" "Waiting for long-running deletions to complete..."
    
    # Check for running deployments
    local running_deployments=true
    local max_wait=600  # 10 minutes
    local waited=0
    
    while [[ "$running_deployments" == "true" ]] && [[ $waited -lt $max_wait ]]; do
        local deployments
        deployments=$(az deployment group list --resource-group "$RESOURCE_GROUP" --query "[?properties.provisioningState=='Running'].name" -o tsv 2>/dev/null || true)
        
        if [[ -z "$deployments" ]]; then
            running_deployments=false
        else
            log "INFO" "Waiting for deployments to complete: $deployments"
            sleep 30
            waited=$((waited + 30))
        fi
    done
    
    if [[ $waited -ge $max_wait ]]; then
        log "WARN" "Timeout waiting for deployments to complete"
    fi
    
    log "SUCCESS" "Deletion wait completed"
}

# Delete resource group
delete_resource_group() {
    log "INFO" "Checking if resource group can be deleted..."
    
    # Check remaining resources
    local remaining_resources
    remaining_resources=$(az resource list --resource-group "$RESOURCE_GROUP" --query "length([*])" -o tsv 2>/dev/null || echo "0")
    
    if [[ "$remaining_resources" -eq 0 ]]; then
        log "INFO" "Deleting empty resource group: $RESOURCE_GROUP"
        az group delete --name "$RESOURCE_GROUP" --yes --no-wait
        log "SUCCESS" "Resource group deletion initiated"
    else
        log "INFO" "Resource group still contains $remaining_resources resources"
        if [[ "$PRESERVE_DATA" == "true" ]]; then
            log "INFO" "Keeping resource group due to preserved data resources"
        else
            log "INFO" "Deleting resource group with remaining resources: $RESOURCE_GROUP"
            az group delete --name "$RESOURCE_GROUP" --yes --no-wait
            log "SUCCESS" "Resource group deletion initiated"
        fi
    fi
}

# Print cleanup summary
print_summary() {
    cat << EOF

============================================
🧹 CLEANUP SUMMARY
============================================

Environment:        $ENVIRONMENT
Resource Group:     $RESOURCE_GROUP
Subscription:       $SUBSCRIPTION_NAME

Actions Performed:
✓ Compute resources deleted
✓ Networking resources deleted
✓ API Management deleted
✓ Caching resources deleted
✓ Monitoring resources deleted

$(if [[ "$PRESERVE_DATA" == "true" ]]; then
    echo "⚠️  Data resources preserved"
else
    echo "✓ Data resources deleted"
fi)

$(if [[ "$EXPORT_CONFIG" == "true" ]]; then
    echo "✓ Configuration exported to: $LOG_DIR/config-export-$TIMESTAMP"
fi)

Note: Some resources may take additional time to fully delete.
You can monitor the deletion progress in the Azure portal.

Log file: $LOG_FILE

============================================

EOF
}

# Main execution
main() {
    create_log_directory
    parse_args "$@"
    
    log "INFO" "Starting Azure Cross-Border Payment Infrastructure Cleanup"
    log "INFO" "Environment: $ENVIRONMENT, Resource Group: $RESOURCE_GROUP"
    
    check_prerequisites
    confirm_deletion
    export_configuration
    
    delete_compute_resources
    delete_networking_resources
    delete_api_management
    delete_caching_resources
    delete_monitoring_resources
    delete_data_resources
    
    wait_for_deletions
    delete_resource_group
    print_summary
    
    log "SUCCESS" "Cleanup process completed successfully!"
}

# Execute main function with all arguments
main "$@"