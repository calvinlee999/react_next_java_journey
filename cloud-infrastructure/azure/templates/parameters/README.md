# Azure Cross-Border Payment Infrastructure - Parameter Files

This directory contains environment-specific parameter files for Azure Bicep template deployments.

## File Structure

```
parameters/
├── dev.parameters.json           # Development environment parameters
├── staging.parameters.json       # Staging environment parameters
├── prod.parameters.json          # Production environment parameters
└── shared.parameters.json        # Shared parameters across environments
```

## Parameter Files Overview

### Development Environment (dev.parameters.json)
- **Purpose**: Cost-optimized configuration for development and testing
- **Characteristics**: Smaller instance sizes, basic tiers, single-region deployment
- **Estimated Cost**: ~$8,000/month

### Staging Environment (staging.parameters.json)
- **Purpose**: Pre-production environment for integration testing
- **Characteristics**: Production-like configuration with scaled-down resources
- **Estimated Cost**: ~$25,000/month

### Production Environment (prod.parameters.json)
- **Purpose**: Full-scale production deployment with high availability
- **Characteristics**: Premium tiers, multi-region, auto-scaling, disaster recovery
- **Estimated Cost**: ~$58,000/month

### Shared Parameters (shared.parameters.json)
- **Purpose**: Common configuration values used across all environments
- **Contents**: Naming conventions, common tags, compliance settings

## Usage

### With Azure CLI
```bash
# Deploy to development
az deployment group create \
  --resource-group rg-payments-dev \
  --template-file ../main.bicep \
  --parameters @dev.parameters.json

# Deploy to staging
az deployment group create \
  --resource-group rg-payments-staging \
  --template-file ../main.bicep \
  --parameters @staging.parameters.json

# Deploy to production
az deployment group create \
  --resource-group rg-payments-prod \
  --template-file ../main.bicep \
  --parameters @prod.parameters.json
```

### With PowerShell
```powershell
# Deploy to development
New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-payments-dev" `
  -TemplateFile "../main.bicep" `
  -TemplateParameterFile "dev.parameters.json"

# Deploy to staging
New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-payments-staging" `
  -TemplateFile "../main.bicep" `
  -TemplateParameterFile "staging.parameters.json"

# Deploy to production
New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-payments-prod" `
  -TemplateFile "../main.bicep" `
  -TemplateParameterFile "prod.parameters.json"
```

### With Deployment Scripts
```bash
# Use the provided deployment scripts
../scripts/deploy.sh -e dev
../scripts/deploy.sh -e staging
../scripts/deploy.sh -e prod
```

## Parameter Categories

### Environment Configuration
- `environment`: Environment name (dev, staging, prod)
- `location`: Primary Azure region
- `uniqueSuffix`: Unique suffix for resource naming

### Networking Parameters
- `vnetAddressPrefix`: Virtual network address space
- `subnetPrefixes`: Subnet address ranges
- `enablePrivateEndpoints`: Private endpoint configuration

### Compute Parameters
- `aksNodeCount`: Initial node count for AKS cluster
- `aksNodeSize`: VM size for AKS nodes
- `aksMaxNodes`: Maximum nodes for auto-scaling

### Database Parameters
- `sqlDbTier`: SQL Database service tier
- `sqlDbSize`: Database size configuration
- `enableSqlAudit`: SQL auditing configuration

### Security Parameters
- `adminUsername`: Administrator username
- `sshPublicKey`: SSH public key for VM access
- `enableEntraId`: Azure AD integration

### Monitoring Parameters
- `logRetentionDays`: Log retention period
- `enableApplicationInsights`: Application Insights configuration
- `alertingEnabled`: Monitoring alerts configuration

## Security Considerations

### Secret Management
- **Passwords**: Never store passwords in parameter files
- **Keys**: Use Key Vault references for sensitive values
- **Certificates**: Store certificates in Key Vault

### Example Key Vault Reference
```json
{
  "adminPassword": {
    "reference": {
      "keyVault": {
        "id": "/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault-name}"
      },
      "secretName": "admin-password"
    }
  }
}
```

## Compliance and Governance

### Required Tags
All environments must include the following tags:
- `Environment`: Environment name
- `Application`: "cross-border-payments"
- `CostCenter`: "fintech-operations"
- `Owner`: Team responsible for the resources
- `Compliance`: Compliance requirements (e.g., "pci-dss-level1")

### Naming Conventions
Resources follow the naming pattern: `{resource-type}-{application}-{environment}-{unique-suffix}`

Examples:
- AKS Cluster: `aks-payments-prod-a1b2c3`
- SQL Server: `sql-payments-prod-a1b2c3`
- Key Vault: `kv-payments-prod-a1b2c3`

## Cost Optimization

### Development Environment
- Use Basic/Standard tiers where possible
- Single-region deployment
- Smaller instance sizes
- Limited backup retention

### Staging Environment
- Production-like configuration
- Scaled-down resources
- Standard backup policies
- Limited geographic distribution

### Production Environment
- Premium tiers for critical services
- Multi-region deployment
- Full backup and disaster recovery
- Reserved instances for cost savings

## Validation

Before deployment, validate parameter files:

```bash
# Validate syntax
cat dev.parameters.json | jq '.'

# Validate against schema
az deployment group validate \
  --resource-group rg-payments-dev \
  --template-file ../main.bicep \
  --parameters @dev.parameters.json
```

## Troubleshooting

### Common Issues

1. **Invalid JSON Format**
   - Use a JSON validator or `jq` to check syntax
   - Ensure proper escaping of special characters

2. **Missing Required Parameters**
   - Check template for required parameters
   - Ensure all required values are provided

3. **Invalid Parameter Values**
   - Verify allowed values in template
   - Check Azure resource constraints (naming, sizes, etc.)

4. **Key Vault Access Issues**
   - Ensure proper permissions for Key Vault access
   - Verify Key Vault resource exists

### Getting Help
- Check Azure Activity Log for deployment errors
- Use Azure Resource Health for resource status
- Review template validation messages
- Consult Azure documentation for specific services

## Best Practices

1. **Version Control**: Store parameter files in version control
2. **Environment Separation**: Use separate parameter files for each environment
3. **Secret Management**: Never commit secrets to version control
4. **Validation**: Always validate before deployment
5. **Documentation**: Keep parameter documentation up to date
6. **Testing**: Test parameter changes in development first