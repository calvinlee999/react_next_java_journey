#!/bin/bash

# Multi-Cloud Deployment Script for Next.js Application
# Supports AWS S3/CloudFront (static) and ECS (SSR), Azure Blob/CDN (static) and Container Apps (SSR)

set -e

# Configuration
PROJECT_NAME="react-next-java-journey"
ENVIRONMENT="${ENVIRONMENT:-production}"
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-hybrid}"  # static, ssr, hybrid
CLOUD_PROVIDER="${CLOUD_PROVIDER:-aws}"        # aws, azure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check cloud provider tools
    if [ "$CLOUD_PROVIDER" = "aws" ]; then
        if ! command -v aws &> /dev/null; then
            log_error "AWS CLI is not installed"
            exit 1
        fi
        
        if [ "$DEPLOYMENT_TYPE" = "ssr" ] || [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
            if ! command -v ecs-cli &> /dev/null; then
                log_warning "ECS CLI is not installed (optional)"
            fi
        fi
    elif [ "$CLOUD_PROVIDER" = "azure" ]; then
        if ! command -v az &> /dev/null; then
            log_error "Azure CLI is not installed"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check completed"
}

# Build the application
build_application() {
    log_info "Building Next.js application..."
    
    cd frontend
    
    # Set environment variables for build
    export DEPLOYMENT_TARGET="$DEPLOYMENT_TYPE"
    export CLOUD_PROVIDER="$CLOUD_PROVIDER"
    
    # Install dependencies
    npm ci
    
    # Build for static or SSR
    if [ "$DEPLOYMENT_TYPE" = "static" ]; then
        npm run build
        npm run export
    else
        npm run build
    fi
    
    cd ..
    log_success "Application build completed"
}

# Deploy to AWS
deploy_aws() {
    log_info "Deploying to AWS..."
    
    # Deploy infrastructure
    aws cloudformation deploy \
        --template-file infra/aws/cloudformation-template.yml \
        --stack-name "${PROJECT_NAME}-${ENVIRONMENT}" \
        --parameter-overrides \
            ProjectName="$PROJECT_NAME" \
            Environment="$ENVIRONMENT" \
            DeploymentType="$DEPLOYMENT_TYPE" \
        --capabilities CAPABILITY_IAM \
        --region us-east-1
    
    # Get stack outputs
    STACK_OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "${PROJECT_NAME}-${ENVIRONMENT}" \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    CDN_DOMAIN=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDomain") | .OutputValue')
    S3_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="S3BucketName") | .OutputValue')
    
    # Deploy static assets
    if [ "$DEPLOYMENT_TYPE" = "static" ] || [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
        log_info "Deploying static assets to S3..."
        aws s3 sync frontend/out/ "s3://$S3_BUCKET/" --delete
        
        # Invalidate CloudFront cache
        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?contains(Aliases.Items, '$CDN_DOMAIN')].Id" \
            --output text)
        
        if [ -n "$DISTRIBUTION_ID" ]; then
            aws cloudfront create-invalidation \
                --distribution-id "$DISTRIBUTION_ID" \
                --paths "/*"
        fi
    fi
    
    # Deploy container for SSR
    if [ "$DEPLOYMENT_TYPE" = "ssr" ] || [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
        log_info "Deploying container to ECS..."
        
        ECR_URI=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ECRRepository") | .OutputValue')
        
        # Build and push Docker image
        docker build -t nextjs-app frontend/
        docker tag nextjs-app:latest "$ECR_URI:latest"
        
        # Login to ECR
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ECR_URI"
        
        # Push image
        docker push "$ECR_URI:latest"
        
        # Update ECS service
        aws ecs update-service \
            --cluster "${PROJECT_NAME}-${ENVIRONMENT}-cluster" \
            --service "${PROJECT_NAME}-${ENVIRONMENT}-service" \
            --force-new-deployment
    fi
    
    log_success "AWS deployment completed"
    log_info "CloudFront Domain: https://$CDN_DOMAIN"
}

# Deploy to Azure
deploy_azure() {
    log_info "Deploying to Azure..."
    
    # Create resource group
    RESOURCE_GROUP="${PROJECT_NAME}-${ENVIRONMENT}-rg"
    az group create --name "$RESOURCE_GROUP" --location eastus
    
    # Deploy infrastructure
    DEPLOYMENT_OUTPUT=$(az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file infra/azure-simple.bicep \
        --parameters environmentName="$ENVIRONMENT" \
        --query 'properties.outputs' \
        --output json)
    
    # Extract outputs
    CDN_ENDPOINT=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.AZURE_CDN_ENDPOINT.value')
    STORAGE_ACCOUNT=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.AZURE_STORAGE_ACCOUNT_NAME.value')
    CONTAINER_REGISTRY=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.AZURE_CONTAINER_REGISTRY_SERVER.value')
    
    # Deploy static assets
    if [ "$DEPLOYMENT_TYPE" = "static" ] || [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
        log_info "Deploying static assets to Azure Blob Storage..."
        
        # Enable static website
        az storage blob service-properties update \
            --account-name "$STORAGE_ACCOUNT" \
            --static-website \
            --404-document index.html \
            --index-document index.html
        
        # Upload files
        az storage blob upload-batch \
            --account-name "$STORAGE_ACCOUNT" \
            --destination '$web' \
            --source frontend/out \
            --overwrite
    fi
    
    # Deploy container for SSR
    if [ "$DEPLOYMENT_TYPE" = "ssr" ] || [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
        log_info "Deploying container to Azure Container Apps..."
        
        # Build and push Docker image
        docker build -t nextjs-app frontend/
        docker tag nextjs-app:latest "$CONTAINER_REGISTRY/nextjs-app:latest"
        
        # Login to ACR
        az acr login --name "${CONTAINER_REGISTRY%%.azurecr.io}"
        
        # Push image
        docker push "$CONTAINER_REGISTRY/nextjs-app:latest"
        
        # Update container app
        az containerapp update \
            --name "ca-nextjs-$(echo $RESOURCE_GROUP | cut -d'-' -f3)" \
            --resource-group "$RESOURCE_GROUP" \
            --image "$CONTAINER_REGISTRY/nextjs-app:latest"
    fi
    
    log_success "Azure deployment completed"
    log_info "CDN Endpoint: $CDN_ENDPOINT"
}

# Main deployment function
main() {
    log_info "Starting deployment for $PROJECT_NAME"
    log_info "Environment: $ENVIRONMENT"
    log_info "Deployment Type: $DEPLOYMENT_TYPE"
    log_info "Cloud Provider: $CLOUD_PROVIDER"
    
    check_prerequisites
    build_application
    
    case "$CLOUD_PROVIDER" in
        aws)
            deploy_aws
            ;;
        azure)
            deploy_azure
            ;;
        *)
            log_error "Unsupported cloud provider: $CLOUD_PROVIDER"
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --provider PROVIDER    Cloud provider (aws, azure) [default: aws]"
    echo "  -t, --type TYPE           Deployment type (static, ssr, hybrid) [default: hybrid]"
    echo "  -e, --environment ENV     Environment name [default: production]"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  CLOUD_PROVIDER           Cloud provider (aws, azure)"
    echo "  DEPLOYMENT_TYPE          Deployment type (static, ssr, hybrid)"
    echo "  ENVIRONMENT             Environment name"
    echo ""
    echo "Examples:"
    echo "  $0 --provider aws --type static"
    echo "  $0 --provider azure --type ssr --environment staging"
    echo "  CLOUD_PROVIDER=aws DEPLOYMENT_TYPE=hybrid $0"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--provider)
            CLOUD_PROVIDER="$2"
            shift 2
            ;;
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate parameters
if [[ ! "$CLOUD_PROVIDER" =~ ^(aws|azure)$ ]]; then
    log_error "Invalid cloud provider. Must be 'aws' or 'azure'"
    exit 1
fi

if [[ ! "$DEPLOYMENT_TYPE" =~ ^(static|ssr|hybrid)$ ]]; then
    log_error "Invalid deployment type. Must be 'static', 'ssr', or 'hybrid'"
    exit 1
fi

# Run main function
main
