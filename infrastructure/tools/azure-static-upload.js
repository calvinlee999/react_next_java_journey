#!/usr/bin/env node

/**
 * Azure Static Content Upload Tool
 * Node.js utility for uploading static files to Azure Blob Storage
 * with CDN and Front Door cache purging
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const glob = require('glob');
const mime = require('mime-types');

// Azure SDK imports (would need to install these packages)
// const { BlobServiceClient } = require('@azure/storage-blob');
// const { DefaultAzureCredential } = require('@azure/identity');

// Mock Azure clients for demonstration
class MockBlobServiceClient {
  constructor(accountUrl, credential) {
    this.accountUrl = accountUrl;
    this.credential = credential;
  }

  getContainerClient(containerName) {
    return new MockContainerClient(containerName);
  }
}

class MockContainerClient {
  constructor(containerName) {
    this.containerName = containerName;
  }

  async uploadFile(filePath, fileName, options = {}) {
    console.log(`[MOCK] Uploading ${fileName} to ${this.containerName}`);
    return {
      requestId: `mock-${Date.now()}`,
      etag: `"${Math.random().toString(36).substr(2, 9)}"`,
      lastModified: new Date(),
    };
  }

  async exists() {
    return true;
  }

  async createIfNotExists() {
    return { succeeded: true };
  }
}

class AzureStaticContentUploader {
  constructor(config) {
    this.config = config;
    this.blobServiceClient = new MockBlobServiceClient(
      `https://${config.storageAccountName}.blob.core.windows.net`,
      config.credential
    );
  }

  /**
   * Upload files to Azure Blob Storage
   */
  async uploadFiles(files, options = {}) {
    const results = [];
    const errors = [];

    const containerClient = this.blobServiceClient.getContainerClient(
      options.containerName || '$web'
    );

    // Ensure container exists
    await containerClient.createIfNotExists();

    for (const file of files) {
      try {
        const startTime = Date.now();
        
        // Determine content type
        const contentType = mime.lookup(file.name) || 'application/octet-stream';
        
        // Set cache control based on file type
        const cacheControl = this.getCacheControl(file.name);
        
        // Upload options
        const uploadOptions = {
          blobHTTPHeaders: {
            blobContentType: contentType,
            blobCacheControl: cacheControl,
          },
          metadata: {
            uploadedAt: new Date().toISOString(),
            environment: this.config.environment || 'dev',
          },
        };

        // Add compression for text files
        if (this.shouldCompress(contentType)) {
          uploadOptions.blobHTTPHeaders.blobContentEncoding = 'gzip';
        }

        const result = await containerClient.uploadFile(
          file.path,
          file.name,
          uploadOptions
        );

        const uploadTime = Date.now() - startTime;
        
        results.push({
          name: file.name,
          path: file.path,
          size: file.size,
          contentType,
          cacheControl,
          uploadTime,
          etag: result.etag,
          lastModified: result.lastModified,
        });

        console.log(`✓ Uploaded ${file.name} (${this.formatBytes(file.size)}) in ${uploadTime}ms`);
        
      } catch (error) {
        const errorMsg = `Failed to upload ${file.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    return { results, errors };
  }

  /**
   * Purge CDN cache (mock implementation)
   */
  async purgeCDNCache(paths) {
    console.log('[MOCK] Purging CDN cache for paths:', paths);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }

  /**
   * Purge Front Door cache (mock implementation)
   */
  async purgeFrontDoorCache(paths) {
    console.log('[MOCK] Purging Front Door cache for paths:', paths);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  /**
   * Get appropriate cache control header for file type
   */
  getCacheControl(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    
    // Static assets with versioning can be cached for a long time
    if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(extension)) {
      return 'public, max-age=31536000, immutable'; // 1 year
    }
    
    // HTML files should have shorter cache times
    if (['.html', '.htm'].includes(extension)) {
      return 'public, max-age=3600, must-revalidate'; // 1 hour
    }
    
    // JSON files for APIs
    if (['.json', '.xml'].includes(extension)) {
      return 'public, max-age=300'; // 5 minutes
    }
    
    return 'public, max-age=86400'; // 1 day default
  }

  /**
   * Check if file should be compressed
   */
  shouldCompress(contentType) {
    const compressibleTypes = [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'text/xml',
      'image/svg+xml',
    ];
    
    return compressibleTypes.some(type => contentType.includes(type));
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Scan directory for files to upload
 */
async function scanFiles(directory, patterns = ['**/*'], excludePatterns = []) {
  const files = [];
  
  for (const pattern of patterns) {
    const fullPattern = path.join(directory, pattern);
    const matches = glob.sync(fullPattern, {
      ignore: excludePatterns.map(p => path.join(directory, p)),
      nodir: true,
    });
    
    for (const match of matches) {
      try {
        const stats = await fs.stat(match);
        if (stats.isFile()) {
          const relativePath = path.relative(directory, match);
          files.push({
            name: relativePath.replace(/\\/g, '/'), // Normalize path separators
            path: match,
            size: stats.size,
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not access ${match}: ${error.message}`);
      }
    }
  }
  
  return files;
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name('azure-static-upload')
    .description('Upload static files to Azure Blob Storage with CDN/Front Door cache purging')
    .version('1.0.0');

  program
    .command('upload')
    .description('Upload files to Azure Blob Storage')
    .requiredOption('-s, --storage-account <name>', 'Azure Storage Account name')
    .requiredOption('-d, --directory <path>', 'Directory containing files to upload')
    .option('-c, --container <name>', 'Blob container name', '$web')
    .option('-e, --environment <env>', 'Environment (dev/staging/prod)', 'dev')
    .option('--include <patterns...>', 'File patterns to include', ['**/*'])
    .option('--exclude <patterns...>', 'File patterns to exclude', ['node_modules/**', '.git/**', '*.tmp'])
    .option('--purge-cdn', 'Purge CDN cache after upload')
    .option('--purge-front-door', 'Purge Front Door cache after upload')
    .option('--dry-run', 'Show what would be uploaded without actually uploading')
    .action(async (options) => {
      try {
        console.log('🚀 Azure Static Content Upload Tool');
        console.log('=====================================');
        console.log(`Storage Account: ${options.storageAccount}`);
        console.log(`Container: ${options.container}`);
        console.log(`Directory: ${options.directory}`);
        console.log(`Environment: ${options.environment}`);
        console.log('');

        // Check if directory exists
        const directoryStats = await fs.stat(options.directory);
        if (!directoryStats.isDirectory()) {
          throw new Error(`${options.directory} is not a directory`);
        }

        // Scan for files
        console.log('📁 Scanning for files...');
        const files = await scanFiles(options.directory, options.include, options.exclude);
        
        if (files.length === 0) {
          console.log('No files found to upload');
          return;
        }

        console.log(`Found ${files.length} files to upload:`);
        files.forEach(file => {
          console.log(`  ${file.name} (${this.formatBytes ? this.formatBytes(file.size) : file.size + ' bytes'})`);
        });
        console.log('');

        if (options.dryRun) {
          console.log('🔍 Dry run completed - no files were uploaded');
          return;
        }

        // Initialize uploader
        const uploader = new AzureStaticContentUploader({
          storageAccountName: options.storageAccount,
          environment: options.environment,
        });

        // Upload files
        console.log('⬆️  Starting upload...');
        const uploadResult = await uploader.uploadFiles(files, {
          containerName: options.container,
        });

        // Summary
        console.log('');
        console.log('📊 Upload Summary:');
        console.log(`✅ Successful: ${uploadResult.results.length}`);
        console.log(`❌ Failed: ${uploadResult.errors.length}`);
        
        if (uploadResult.errors.length > 0) {
          console.log('\nErrors:');
          uploadResult.errors.forEach(error => console.log(`  ${error}`));
        }

        const totalSize = uploadResult.results.reduce((sum, result) => sum + result.size, 0);
        const totalTime = uploadResult.results.reduce((sum, result) => sum + result.uploadTime, 0);
        
        console.log(`📦 Total size uploaded: ${uploader.formatBytes(totalSize)}`);
        console.log(`⏱️  Total time: ${totalTime}ms`);

        // Purge caches if requested
        if (options.purgeCdn && uploadResult.results.length > 0) {
          console.log('\n🔄 Purging CDN cache...');
          const paths = uploadResult.results.map(r => `/${r.name}`);
          await uploader.purgeCDNCache(paths);
          console.log('✅ CDN cache purged');
        }

        if (options.purgeFrontDoor && uploadResult.results.length > 0) {
          console.log('\n🔄 Purging Front Door cache...');
          const paths = uploadResult.results.map(r => `/${r.name}`);
          await uploader.purgeFrontDoorCache(paths);
          console.log('✅ Front Door cache purged');
        }

        console.log('\n🎉 Upload completed successfully!');
        
      } catch (error) {
        console.error('💥 Upload failed:', error.message);
        process.exit(1);
      }
    });

  program
    .command('info')
    .description('Show information about the storage account')
    .requiredOption('-s, --storage-account <name>', 'Azure Storage Account name')
    .option('-c, --container <name>', 'Blob container name', '$web')
    .action(async (options) => {
      try {
        console.log('ℹ️  Storage Account Information');
        console.log('===============================');
        console.log(`Account: ${options.storageAccount}`);
        console.log(`Container: ${options.container}`);
        console.log(`Static Website URL: https://${options.storageAccount}.z13.web.core.windows.net/`);
        console.log(`Blob Endpoint: https://${options.storageAccount}.blob.core.windows.net/`);
        console.log('');
        console.log('Note: This is a mock implementation. In a real scenario, this would');
        console.log('query Azure APIs to get actual account information and metrics.');
        
      } catch (error) {
        console.error('Error getting storage account info:', error.message);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Package.json template for the upload tool
const packageJsonTemplate = {
  "name": "azure-static-upload-tool",
  "version": "1.0.0",
  "description": "Azure Static Content Upload Tool for Blob Storage, CDN, and Front Door",
  "main": "azure-static-upload.js",
  "bin": {
    "azure-static-upload": "./azure-static-upload.js"
  },
  "scripts": {
    "start": "node azure-static-upload.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "commander": "^9.0.0",
    "glob": "^8.0.0",
    "mime-types": "^2.1.35",
    "@azure/storage-blob": "^12.12.0",
    "@azure/identity": "^3.1.0"
  },
  "keywords": [
    "azure",
    "blob-storage",
    "cdn",
    "front-door",
    "static-website",
    "deployment"
  ],
  "author": "React Java Journey Team",
  "license": "MIT"
};

// Export for use in other modules
module.exports = {
  AzureStaticContentUploader,
  scanFiles,
  packageJsonTemplate
};

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}