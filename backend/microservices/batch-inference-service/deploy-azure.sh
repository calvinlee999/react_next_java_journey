#!/bin/bash

# Azure Batch Inference Service Deployment Script
# Deploys the batch inference service to Azure Container Apps with Kafka and Spark integration

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP_NAME="fintech-batch-inference-rg"
LOCATION="eastus"
CONTAINER_APP_ENV="fintech-batch-env"
CONTAINER_APP_NAME="batch-inference-service"
CONTAINER_REGISTRY_NAME="fintechbatchregistry"
IMAGE_NAME="batch-inference-service"
IMAGE_TAG="latest"

# Azure services
STORAGE_ACCOUNT_NAME="fintechbatchstorage"
DATABRICKS_WORKSPACE="fintech-databricks-workspace"
KAFKA_NAMESPACE="fintech-eventhub-namespace"
KEY_VAULT_NAME="fintech-batch-keyvault"

echo -e "${GREEN}🚀 Starting Azure Batch Inference Service Deployment${NC}"

# Function to check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Azure CLI is available${NC}"
}

# Function to login to Azure
azure_login() {
    echo -e "${YELLOW}🔐 Checking Azure login status...${NC}"
    
    if ! az account show &> /dev/null; then
        echo -e "${YELLOW}Please login to Azure...${NC}"
        az login
    fi
    
    echo -e "${GREEN}✅ Azure login successful${NC}"
}

# Function to create resource group
create_resource_group() {
    echo -e "${YELLOW}📦 Creating resource group: ${RESOURCE_GROUP_NAME}${NC}"
    
    az group create \
        --name ${RESOURCE_GROUP_NAME} \
        --location ${LOCATION} \
        --output table
    
    echo -e "${GREEN}✅ Resource group created${NC}"
}

# Function to create Azure Container Registry
create_container_registry() {
    echo -e "${YELLOW}🐳 Creating Azure Container Registry: ${CONTAINER_REGISTRY_NAME}${NC}"
    
    az acr create \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --name ${CONTAINER_REGISTRY_NAME} \
        --sku Standard \
        --admin-enabled true \
        --output table
    
    echo -e "${GREEN}✅ Container Registry created${NC}"
}

# Function to build and push Docker image
build_and_push_image() {
    echo -e "${YELLOW}🔨 Building and pushing Docker image...${NC}"
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name ${CONTAINER_REGISTRY_NAME} --query loginServer --output tsv)
    
    # Login to ACR
    az acr login --name ${CONTAINER_REGISTRY_NAME}
    
    # Build image
    docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} .
    
    # Push image
    docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}
    
    echo -e "${GREEN}✅ Docker image built and pushed${NC}"
}

# Function to create Azure Storage Account
create_storage_account() {
    echo -e "${YELLOW}💾 Creating Azure Storage Account: ${STORAGE_ACCOUNT_NAME}${NC}"
    
    az storage account create \
        --name ${STORAGE_ACCOUNT_NAME} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --location ${LOCATION} \
        --sku Standard_LRS \
        --kind StorageV2 \
        --hierarchical-namespace true \
        --output table
    
    # Create containers for data lake
    STORAGE_KEY=$(az storage account keys list --account-name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP_NAME} --query '[0].value' --output tsv)
    
    az storage container create \
        --name fintech-datalake \
        --account-name ${STORAGE_ACCOUNT_NAME} \
        --account-key ${STORAGE_KEY}
    
    echo -e "${GREEN}✅ Storage Account created${NC}"
}

# Function to create Azure Databricks workspace
create_databricks_workspace() {
    echo -e "${YELLOW}⚡ Creating Azure Databricks workspace: ${DATABRICKS_WORKSPACE}${NC}"
    
    az databricks workspace create \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --name ${DATABRICKS_WORKSPACE} \
        --location ${LOCATION} \
        --sku premium \
        --output table
    
    echo -e "${GREEN}✅ Databricks workspace created${NC}"
}

# Function to create Event Hubs namespace (Kafka-compatible)
create_event_hubs() {
    echo -e "${YELLOW}📡 Creating Event Hubs namespace: ${KAFKA_NAMESPACE}${NC}"
    
    az eventhubs namespace create \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --name ${KAFKA_NAMESPACE} \
        --location ${LOCATION} \
        --sku Standard \
        --enable-kafka true \
        --output table
    
    # Create event hubs (Kafka topics)
    for topic in batch-inference-input batch-inference-output batch-metrics job-control model-updates user-events transaction-events credit-events journey-events; do
        az eventhubs eventhub create \
            --resource-group ${RESOURCE_GROUP_NAME} \
            --namespace-name ${KAFKA_NAMESPACE} \
            --name ${topic} \
            --partition-count 8 \
            --message-retention 7
    done
    
    echo -e "${GREEN}✅ Event Hubs namespace and topics created${NC}"
}

# Function to create Key Vault
create_key_vault() {
    echo -e "${YELLOW}🔐 Creating Key Vault: ${KEY_VAULT_NAME}${NC}"
    
    az keyvault create \
        --name ${KEY_VAULT_NAME} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --location ${LOCATION} \
        --enabled-for-deployment true \
        --enabled-for-template-deployment true \
        --output table
    
    echo -e "${GREEN}✅ Key Vault created${NC}"
}

# Function to create Container Apps environment
create_container_apps_environment() {
    echo -e "${YELLOW}🏗️ Creating Container Apps environment: ${CONTAINER_APP_ENV}${NC}"
    
    # Install Container Apps extension
    az extension add --name containerapp --upgrade
    
    # Register providers
    az provider register --namespace Microsoft.App
    az provider register --namespace Microsoft.OperationalInsights
    
    # Create Log Analytics workspace
    WORKSPACE_NAME="${CONTAINER_APP_ENV}-logs"
    az monitor log-analytics workspace create \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --workspace-name ${WORKSPACE_NAME} \
        --location ${LOCATION}
    
    # Get workspace details
    WORKSPACE_ID=$(az monitor log-analytics workspace show --query customerId -g ${RESOURCE_GROUP_NAME} -n ${WORKSPACE_NAME} --out tsv)
    WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys --query primarySharedKey -g ${RESOURCE_GROUP_NAME} -n ${WORKSPACE_NAME} --out tsv)
    
    # Create Container Apps environment
    az containerapp env create \
        --name ${CONTAINER_APP_ENV} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --location ${LOCATION} \
        --logs-workspace-id ${WORKSPACE_ID} \
        --logs-workspace-key ${WORKSPACE_KEY}
    
    echo -e "${GREEN}✅ Container Apps environment created${NC}"
}

# Function to deploy container app
deploy_container_app() {
    echo -e "${YELLOW}🚀 Deploying batch inference service...${NC}"
    
    # Get ACR credentials
    ACR_LOGIN_SERVER=$(az acr show --name ${CONTAINER_REGISTRY_NAME} --query loginServer --output tsv)
    ACR_USERNAME=$(az acr credential show --name ${CONTAINER_REGISTRY_NAME} --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name ${CONTAINER_REGISTRY_NAME} --query passwords[0].value --output tsv)
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list --account-name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP_NAME} --query '[0].value' --output tsv)
    
    # Get Event Hubs connection string
    EVENTHUB_CONNECTION=$(az eventhubs namespace authorization-rule keys list --resource-group ${RESOURCE_GROUP_NAME} --namespace-name ${KAFKA_NAMESPACE} --name RootManageSharedAccessKey --query primaryConnectionString --output tsv)
    
    # Deploy container app
    az containerapp create \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --environment ${CONTAINER_APP_ENV} \
        --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} \
        --registry-server ${ACR_LOGIN_SERVER} \
        --registry-username ${ACR_USERNAME} \
        --registry-password ${ACR_PASSWORD} \
        --target-port 8085 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 10 \
        --cpu 2.0 \
        --memory 4Gi \
        --env-vars \
            SPRING_PROFILES_ACTIVE=azure \
            AZURE_STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT_NAME} \
            AZURE_STORAGE_ACCOUNT_KEY=${STORAGE_KEY} \
            KAFKA_BOOTSTRAP_SERVERS=${KAFKA_NAMESPACE}.servicebus.windows.net:9093 \
            EVENTHUB_CONNECTION_STRING="${EVENTHUB_CONNECTION}" \
            JAVA_OPTS="-Xmx3g -Xms1g -XX:+UseG1GC"
    
    echo -e "${GREEN}✅ Batch inference service deployed${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up monitoring and alerts...${NC}"
    
    # Create Application Insights
    APP_INSIGHTS_NAME="${CONTAINER_APP_NAME}-insights"
    az monitor app-insights component create \
        --app ${APP_INSIGHTS_NAME} \
        --location ${LOCATION} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --application-type web
    
    # Get instrumentation key
    INSTRUMENTATION_KEY=$(az monitor app-insights component show --app ${APP_INSIGHTS_NAME} --resource-group ${RESOURCE_GROUP_NAME} --query instrumentationKey --output tsv)
    
    # Update container app with Application Insights
    az containerapp update \
        --name ${CONTAINER_APP_NAME} \
        --resource-group ${RESOURCE_GROUP_NAME} \
        --set-env-vars APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=${INSTRUMENTATION_KEY}
    
    echo -e "${GREEN}✅ Monitoring setup complete${NC}"
}

# Function to display deployment summary
display_summary() {
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Deployment Summary:${NC}"
    echo "================================="
    echo "Resource Group: ${RESOURCE_GROUP_NAME}"
    echo "Container App: ${CONTAINER_APP_NAME}"
    echo "Container Registry: ${CONTAINER_REGISTRY_NAME}"
    echo "Storage Account: ${STORAGE_ACCOUNT_NAME}"
    echo "Databricks Workspace: ${DATABRICKS_WORKSPACE}"
    echo "Event Hubs Namespace: ${KAFKA_NAMESPACE}"
    echo "Key Vault: ${KEY_VAULT_NAME}"
    echo ""
    
    # Get app URL
    APP_URL=$(az containerapp show --name ${CONTAINER_APP_NAME} --resource-group ${RESOURCE_GROUP_NAME} --query properties.configuration.ingress.fqdn --output tsv)
    echo -e "${GREEN}🌐 Application URL: https://${APP_URL}${NC}"
    echo -e "${GREEN}🔍 Health Check: https://${APP_URL}/batch-inference/api/v1/batch-inference/health${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure Databricks cluster and connect to the service"
    echo "2. Upload ML models to the model registry"
    echo "3. Set up data pipelines for batch processing"
    echo "4. Configure monitoring alerts and dashboards"
    echo ""
}

# Main deployment flow
main() {
    echo -e "${GREEN}Starting Azure Batch Inference Service Deployment...${NC}"
    
    check_azure_cli
    azure_login
    create_resource_group
    create_container_registry
    build_and_push_image
    create_storage_account
    create_databricks_workspace
    create_event_hubs
    create_key_vault
    create_container_apps_environment
    deploy_container_app
    setup_monitoring
    display_summary
    
    echo -e "${GREEN}✅ All deployment steps completed successfully!${NC}"
}

# Run main function
main "$@"