#!/bin/bash
# Clean environment setup for React/Next.js development

# Export clean paths with Node.js first
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set clean PATH with Node.js first
export PATH="$NVM_DIR/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Verify Node.js environment
echo "=== Clean Environment Setup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Node path: $(which node)"
echo "NPM path: $(which npm)"
echo "Current directory: $(pwd)"
echo "=== Environment Ready ==="