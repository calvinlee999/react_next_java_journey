package com.fintech.mcp.registry;

import com.fintech.mcp.core.McpServer;
import com.fintech.mcp.core.McpTool;
import com.fintech.mcp.core.McpToolDefinition;
import com.fintech.mcp.server.McpServerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MCP Auto-Registration Service
 * 
 * Automatically discovers and registers all MCP servers and tools across
 * microservices for seamless AI agent integration. Implements service
 * discovery patterns for distributed MCP tool ecosystem.
 */
@Service
public class McpAutoRegistrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(McpAutoRegistrationService.class);
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @Autowired
    private McpServerRegistry mcpServerRegistry;
    
    private final Map<String, McpServerInfo> registeredServers = new HashMap<>();
    private final Map<String, List<McpTool>> serverTools = new HashMap<>();
    
    /**
     * Automatically registers all MCP servers when application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    public void autoRegisterMcpServers() {
        logger.info("Starting automatic MCP server registration...");
        
        try {
            // Discover all beans annotated with @McpServer
            Map<String, Object> mcpServerBeans = applicationContext.getBeansWithAnnotation(McpServer.class);
            
            logger.info("Found {} MCP server beans to register", mcpServerBeans.size());
            
            for (Map.Entry<String, Object> entry : mcpServerBeans.entrySet()) {
                String beanName = entry.getKey();
                Object serverBean = entry.getValue();
                
                registerMcpServer(beanName, serverBean);
            }
            
            // Log registration summary
            logRegistrationSummary();
            
            logger.info("MCP auto-registration completed successfully");
            
        } catch (Exception e) {
            logger.error("Failed to auto-register MCP servers", e);
            throw new RuntimeException("MCP auto-registration failed", e);
        }
    }
    
    /**
     * Registers a single MCP server with all its tools
     */
    private void registerMcpServer(String beanName, Object serverBean) {
        Class<?> serverClass = serverBean.getClass();
        McpServer mcpServerAnnotation = serverClass.getAnnotation(McpServer.class);
        
        if (mcpServerAnnotation == null) {
            logger.warn("Bean {} does not have @McpServer annotation", beanName);
            return;
        }
        
        String serverName = mcpServerAnnotation.name();
        logger.info("Registering MCP server: {} ({})", serverName, beanName);
        
        try {
            // Create server info
            McpServerInfo serverInfo = new McpServerInfo(
                serverName,
                mcpServerAnnotation.description(),
                mcpServerAnnotation.domain(),
                mcpServerAnnotation.version(),
                beanName,
                serverClass.getName()
            );
            
            // Discover and register tools
            List<McpTool> tools = discoverServerTools(serverBean, serverClass);
            
            // Register with central registry
            registeredServers.put(serverName, serverInfo);
            serverTools.put(serverName, tools);
            
            // Register tools with the main registry
            for (McpTool tool : tools) {
                mcpServerRegistry.registerTool(tool, serverBean);
            }
            
            logger.info("Successfully registered MCP server {} with {} tools", 
                       serverName, tools.size());
            
        } catch (Exception e) {
            logger.error("Failed to register MCP server: {}", serverName, e);
        }
    }
    
    /**
     * Discovers all MCP tools in a server class
     */
    private List<McpTool> discoverServerTools(Object serverBean, Class<?> serverClass) {
        List<McpTool> tools = new ArrayList<>();
        
        for (Method method : serverClass.getDeclaredMethods()) {
            McpToolDefinition toolAnnotation = method.getAnnotation(McpToolDefinition.class);
            
            if (toolAnnotation != null) {
                try {
                    McpTool tool = mcpServerRegistry.createToolFromMethod(method, toolAnnotation);
                    tools.add(tool);
                    
                    logger.debug("Discovered tool: {} in server: {}", 
                               tool.name(), serverClass.getSimpleName());
                    
                } catch (Exception e) {
                    logger.error("Failed to create tool from method: {} in class: {}", 
                               method.getName(), serverClass.getName(), e);
                }
            }
        }
        
        return tools;
    }
    
    /**
     * Returns all registered MCP servers
     */
    public Map<String, McpServerInfo> getRegisteredServers() {
        return Collections.unmodifiableMap(registeredServers);
    }
    
    /**
     * Returns tools for a specific server
     */
    public List<McpTool> getServerTools(String serverName) {
        return serverTools.getOrDefault(serverName, Collections.emptyList());
    }
    
    /**
     * Returns all registered tools grouped by domain
     */
    public Map<String, List<McpTool>> getToolsByDomain() {
        Map<String, List<McpTool>> toolsByDomain = new HashMap<>();
        
        for (Map.Entry<String, McpServerInfo> entry : registeredServers.entrySet()) {
            String domain = entry.getValue().domain();
            List<McpTool> tools = serverTools.get(entry.getKey());
            
            toolsByDomain.computeIfAbsent(domain, k -> new ArrayList<>()).addAll(tools);
        }
        
        return toolsByDomain;
    }
    
    /**
     * Returns registration health status
     */
    public RegistrationHealthStatus getHealthStatus() {
        int totalServers = registeredServers.size();
        int totalTools = serverTools.values().stream()
                                   .mapToInt(List::size)
                                   .sum();
        
        Map<String, Integer> toolsByDomain = getToolsByDomain().entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> entry.getValue().size()
                ));
        
        boolean healthy = totalServers > 0 && totalTools > 0;
        
        return new RegistrationHealthStatus(
            healthy,
            totalServers,
            totalTools,
            toolsByDomain,
            System.currentTimeMillis()
        );
    }
    
    /**
     * Logs registration summary for monitoring
     */
    private void logRegistrationSummary() {
        RegistrationHealthStatus status = getHealthStatus();
        
        logger.info("=== MCP Registration Summary ===");
        logger.info("Total servers registered: {}", status.totalServers());
        logger.info("Total tools registered: {}", status.totalTools());
        logger.info("Tools by domain:");
        
        status.toolsByDomain().forEach((domain, count) -> 
            logger.info("  {} domain: {} tools", domain, count));
        
        logger.info("Registration health: {}", status.healthy() ? "HEALTHY" : "UNHEALTHY");
        logger.info("================================");
    }
    
    /**
     * Forces re-registration of all servers (for dynamic updates)
     */
    public void forceReRegistration() {
        logger.info("Forcing MCP server re-registration...");
        
        registeredServers.clear();
        serverTools.clear();
        mcpServerRegistry.clearRegistry();
        
        autoRegisterMcpServers();
    }
}

/**
 * MCP Server Information
 */
record McpServerInfo(
    String name,
    String description,
    String domain,
    String version,
    String beanName,
    String className
) {}

/**
 * Registration Health Status
 */
record RegistrationHealthStatus(
    boolean healthy,
    int totalServers,
    int totalTools,
    Map<String, Integer> toolsByDomain,
    long timestamp
) {}