package com.fintech.mcp.config;

import com.fintech.mcp.registry.McpAutoRegistrationService;
import com.fintech.mcp.server.McpServerRegistry;
import com.fintech.mcp.core.McpToolExecutor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;

/**
 * MCP Framework Configuration
 * 
 * Central configuration for ModelContextProtocol integration across
 * the FinTech platform. Enables automatic discovery and registration
 * of domain-based business capabilities as MCP tools for AI agents.
 */
@Configuration
@ComponentScan(basePackages = {
    "com.fintech.mcp",
    "com.fintech.*.mcp"  // Scan all microservice MCP packages
})
@ConditionalOnProperty(
    name = "mcp.enabled", 
    havingValue = "true", 
    matchIfMissing = true
)
public class McpConfiguration {
    
    /**
     * Central registry for MCP tools and servers
     */
    @Bean
    public McpServerRegistry mcpServerRegistry() {
        return new McpServerRegistry();
    }
    
    /**
     * Tool executor for MCP operations
     */
    @Bean
    public McpToolExecutor mcpToolExecutor(McpServerRegistry registry) {
        return new McpToolExecutor(registry);
    }
    
    /**
     * Auto-registration service for MCP servers
     */
    @Bean
    public McpAutoRegistrationService mcpAutoRegistrationService() {
        return new McpAutoRegistrationService();
    }
}

/**
 * MCP Properties Configuration
 */
@org.springframework.boot.context.properties.ConfigurationProperties(prefix = "mcp")
public class McpProperties {
    
    private boolean enabled = true;
    private Server server = new Server();
    private Client client = new Client();
    private Registry registry = new Registry();
    
    // Getters and setters
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    
    public Server getServer() { return server; }
    public void setServer(Server server) { this.server = server; }
    
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    
    public Registry getRegistry() { return registry; }
    public void setRegistry(Registry registry) { this.registry = registry; }
    
    public static class Server {
        private String name = "fintech-mcp-server";
        private String version = "1.0.0";
        private int port = 8080;
        private String[] allowedOrigins = {"*"};
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        
        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }
        
        public String[] getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String[] allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }
    
    public static class Client {
        private int timeoutSeconds = 30;
        private int maxRetries = 3;
        private boolean enableMetrics = true;
        
        // Getters and setters
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
        
        public int getMaxRetries() { return maxRetries; }
        public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
        
        public boolean isEnableMetrics() { return enableMetrics; }
        public void setEnableMetrics(boolean enableMetrics) { this.enableMetrics = enableMetrics; }
    }
    
    public static class Registry {
        private boolean autoDiscovery = true;
        private String[] scanPackages = {"com.fintech"};
        private boolean enableHealthChecks = true;
        
        // Getters and setters
        public boolean isAutoDiscovery() { return autoDiscovery; }
        public void setAutoDiscovery(boolean autoDiscovery) { this.autoDiscovery = autoDiscovery; }
        
        public String[] getScanPackages() { return scanPackages; }
        public void setScanPackages(String[] scanPackages) { this.scanPackages = scanPackages; }
        
        public boolean isEnableHealthChecks() { return enableHealthChecks; }
        public void setEnableHealthChecks(boolean enableHealthChecks) { this.enableHealthChecks = enableHealthChecks; }
    }
}