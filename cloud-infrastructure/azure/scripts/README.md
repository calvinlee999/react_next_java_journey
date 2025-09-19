# Azure Infrastructure Deployment Scripts

This directory contains deployment scripts for the Azure cross-border payment infrastructure.

## 📁 Script Structure

```
scripts/
├── deploy.sh              # Bash deployment script (Linux/macOS)
├── deploy.ps1             # PowerShell deployment script (Windows/Cross-platform)
├── validate.sh            # Infrastructure validation script
├── cleanup.sh             # Resource cleanup script
└── utils/
    ├── common.sh          # Common utility functions
    └── logging.sh         # Logging utilities
```

## 🚀 Quick Start

### Prerequisites

- Azure CLI 2.50.0 or later
- Bicep CLI 0.18.4 or later
- PowerShell 7.0+ (for PowerShell scripts)
- Bash 4.0+ (for Bash scripts)
- Azure subscription with appropriate permissions

### Environment Setup

1. **Login to Azure:**
```bash
az login
az account set --subscription "your-subscription-id"
```

2. **Set environment variables:**
```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_LOCATION="eastus2"
export ENVIRONMENT="dev"  # dev, staging, or prod
```

### Deployment

#### Using Bash (Linux/macOS)

```bash
# Make script executable
chmod +x deploy.sh

# Deploy with default parameters
./deploy.sh

# Deploy with specific environment
./deploy.sh --environment prod --location westeurope

# Deploy with custom resource group
./deploy.sh --resource-group "rg-payments-custom" --environment staging
```

#### Using PowerShell (Windows/Cross-platform)

```powershell
# Deploy with default parameters
./deploy.ps1

# Deploy with specific environment
./deploy.ps1 -Environment "prod" -Location "westeurope"

# Deploy with custom resource group
./deploy.ps1 -ResourceGroup "rg-payments-custom" -Environment "staging"
```

## 📋 Script Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `environment` | Deployment environment (dev, staging, prod) | `dev` | No |
| `location` | Azure region | `eastus2` | No |
| `resource-group` | Resource group name | `rg-payments-{environment}` | No |
| `subscription-id` | Azure subscription ID | Current subscription | No |
| `skip-validation` | Skip pre-deployment validation | `false` | No |
| `what-if` | Show what would be deployed without deploying | `false` | No |

## 🔍 Validation

Before deploying, you can validate the infrastructure:

```bash
# Validate using Bash
./validate.sh --environment prod

# Validate using PowerShell
./validate.ps1 -Environment "prod"
```

The validation script checks:
- Azure CLI authentication
- Subscription permissions
- Resource name availability
- Template syntax
- Parameter validation
- Cost estimation

## 🧹 Cleanup

To remove deployed resources:

```bash
# Cleanup using Bash
./cleanup.sh --environment dev --confirm

# Cleanup using PowerShell
./cleanup.ps1 -Environment "dev" -Confirm
```

**⚠️ Warning:** Cleanup will permanently delete all resources in the specified environment.

## 📊 Cost Estimation

The deployment scripts include cost estimation:

```bash
# Get cost estimate before deployment
./deploy.sh --environment prod --what-if --estimate-cost
```

Expected monthly costs by environment:
- **Development**: ~$8,000/month
- **Staging**: ~$25,000/month
- **Production**: ~$58,000/month

## 🔧 Customization

### Custom Parameters

Create environment-specific parameter files:

```bash
# Copy template parameter file
cp templates/parameters/prod.parameters.json templates/parameters/custom.parameters.json

# Edit custom parameters
# Deploy with custom parameters
./deploy.sh --environment custom
```

### Environment Variables

Set these environment variables for customization:

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_LOCATION="eastus2"
export RESOURCE_GROUP_PREFIX="rg-payments"
export UNIQUE_SUFFIX="$(date +%s)"
export ADMIN_USERNAME="paymentsadmin"
export SSH_KEY_PATH="~/.ssh/id_rsa.pub"
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied:**
   ```bash
   az role assignment create --assignee $(az account show --query user.name -o tsv) \
     --role "Contributor" --scope "/subscriptions/$AZURE_SUBSCRIPTION_ID"
   ```

2. **Resource Name Conflicts:**
   ```bash
   # Generate new unique suffix
   export UNIQUE_SUFFIX="$(openssl rand -hex 3)"
   ./deploy.sh --unique-suffix $UNIQUE_SUFFIX
   ```

3. **Quota Limits:**
   ```bash
   # Check quota usage
   az vm list-usage --location eastus2 --output table
   
   # Request quota increase
   az support tickets create --ticket-name "quota-increase" \
     --issue-type "quota" --severity "minimal"
   ```

### Deployment Logs

Logs are stored in:
- Bash: `./logs/deploy-$(date +%Y%m%d-%H%M%S).log`
- PowerShell: `./logs/deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log`

### Rollback

If deployment fails, use the cleanup script and redeploy:

```bash
# Rollback failed deployment
./cleanup.sh --environment staging --partial
./deploy.sh --environment staging
```

## 📈 Monitoring

After deployment, monitor the infrastructure:

```bash
# Check deployment status
az deployment group show --resource-group rg-payments-prod \
  --name "main-deployment" --query "properties.provisioningState"

# Monitor resource health
az resource list --resource-group rg-payments-prod \
  --query "[].{Name:name, Type:type, State:properties.provisioningState}" \
  --output table
```

## 🔐 Security

### Secrets Management

The scripts handle sensitive information securely:

- Admin passwords are generated automatically
- SSH keys are read from secure locations
- Database connection strings are stored in Key Vault
- All secrets are marked as secure parameters

### RBAC

Required Azure RBAC roles:
- **Contributor**: For resource deployment
- **User Access Administrator**: For role assignments
- **Key Vault Administrator**: For Key Vault operations

## 📞 Support

For issues with deployment scripts:

1. Check the troubleshooting section above
2. Review deployment logs
3. Validate Azure permissions
4. Contact the platform team with log files

---

**Note:** Always test deployments in development environment before promoting to staging or production.