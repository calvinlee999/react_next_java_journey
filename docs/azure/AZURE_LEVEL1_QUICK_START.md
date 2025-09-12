# 🚀 Azure Level 1 Quick Start Guide

## Prerequisites Checklist
- [ ] Azure subscription with appropriate permissions
- [ ] Azure CLI installed and authenticated
- [ ] Node.js 16+ (for upload tool)
- [ ] Git repository with static content

## 🏃‍♂️ 5-Minute Deployment

### Step 1: Clone and Setup
```bash
cd /Users/calvinlee/ai_workspace_local/react_next_java_journey
chmod +x infrastructure/scripts/*.sh
```

### Step 2: Deploy Infrastructure
```bash
# Development environment
./infrastructure/scripts/deploy-static-content-delivery.sh \
  -s "your-subscription-id" \
  -g "rg-static-content-dev" \
  -n "staticcontentdev" \
  -l "eastus" \
  -e "dev"

# Production environment  
./infrastructure/scripts/deploy-static-content-delivery.sh \
  -s "your-subscription-id" \
  -g "rg-static-content-prod" \
  -n "staticcontentprod" \
  -l "eastus" \
  -e "prod"
```

### Step 3: Upload Content
```bash
# Install dependencies
cd infrastructure/tools
npm install

# Upload files
node azure-static-upload.js \
  --storage-account "your-storage-account" \
  --source-dir "../../frontend/public" \
  --container "\$web" \
  --purge-cdn
```

### Step 4: Access Your Site
- **Direct Blob URL**: `https://{storageaccount}.z13.web.core.windows.net`
- **CDN URL**: `https://{cdnendpoint}.azureedge.net`
- **Front Door URL**: `https://{frontdoor}.azurefd.net`

## 🛠️ Management Commands

### Cache Management
```bash
# Purge CDN cache
az cdn endpoint purge \
  --profile-name "your-cdn-profile" \
  --name "your-endpoint" \
  --content-paths "/*"

# Purge Front Door cache  
az afd endpoint purge \
  --profile-name "your-frontdoor" \
  --endpoint-name "your-endpoint" \
  --content-paths "/*"
```

### Monitoring
```bash
# Check Front Door health
az afd endpoint show \
  --profile-name "your-frontdoor" \
  --endpoint-name "your-endpoint"

# View storage metrics
az storage account show-usage \
  --account-name "your-storage-account"
```

## 📊 Validation Checklist

### ✅ Infrastructure Validation
- [ ] Storage account created with static website enabled
- [ ] CDN profile and endpoints configured
- [ ] Front Door with WAF policy active
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates installed

### ✅ Performance Validation
- [ ] Page load time < 2 seconds globally
- [ ] Cache hit ratio > 85%
- [ ] CDN endpoints responding correctly
- [ ] Front Door routing working

### ✅ Security Validation
- [ ] HTTPS-only access enforced
- [ ] WAF rules active and blocking threats
- [ ] No direct blob storage access
- [ ] Security headers configured

## 🚨 Troubleshooting

### Common Issues
```yaml
Issue: "Blob storage not accessible"
Solution: 
  - Verify static website hosting is enabled
  - Check container permissions
  - Confirm index.html exists in $web container

Issue: "CDN not caching properly"
Solution:
  - Check cache-control headers
  - Verify CDN endpoint configuration
  - Purge cache and test again

Issue: "Front Door 502 errors"
Solution:
  - Verify origin health probes
  - Check origin response time
  - Review WAF rule blocks
```

### Support Resources
- **Azure Documentation**: https://docs.microsoft.com/azure/
- **CDN Troubleshooting**: https://docs.microsoft.com/azure/cdn/cdn-troubleshoot-endpoint
- **Front Door Diagnostics**: https://docs.microsoft.com/azure/frontdoor/front-door-diagnostics

## 💡 Pro Tips

### Performance Optimization
1. **Enable Compression**: Reduce bandwidth by 60-80%
2. **Optimize Images**: Use WebP format when possible
3. **Minimize Files**: Bundle and minify CSS/JS
4. **Smart Caching**: Use appropriate cache headers
5. **Monitor Metrics**: Set up Azure Monitor alerts

### Cost Optimization
1. **Use Cool Storage**: For infrequently accessed files
2. **Lifecycle Policies**: Automatic tier movement
3. **Reserved Capacity**: 1-3 year commitments save 30%
4. **Monitor Usage**: Track bandwidth and storage costs
5. **Optimize CDN**: Choose appropriate pricing tier

### Security Best Practices
1. **Enable WAF**: Protect against common attacks
2. **Use HTTPS**: Encrypt all traffic
3. **Restrict Origins**: Limit access to known sources
4. **Monitor Logs**: Review security events regularly
5. **Update Rules**: Keep WAF rules current

---

**🎉 Congratulations!** Your Azure Level 1 static content delivery is now live with global CDN and enterprise security!

**Next Steps**: Consider upgrading to Level 2 with multi-region deployment, API Management, and advanced monitoring.