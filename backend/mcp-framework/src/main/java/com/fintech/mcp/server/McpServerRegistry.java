package com.fintech.mcp.server;

import com.fintech.mcp.core.McpTool;
import com.fintech.mcp.core.McpToolDefinition;
import com.fintech.mcp.core.McpServer;
import com.fintech.mcp.core.McpParameter;
import com.fintech.mcp.core.McpSchema;
import com.fintech.mcp.core.McpProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MCP Server Registry
 * 
 * Automatically discovers and registers MCP tools from Spring beans
 * annotated with @McpToolDefinition. Provides tool metadata and
 * execution capabilities for AI agents.
 */
@Component
public class McpServerRegistry {
    
    private static final Logger logger = LoggerFactory.getLogger(McpServerRegistry.class);
    
    @Autowired
    private ApplicationContext applicationContext;
    
    // Registry of all discovered MCP tools
    private final Map<String, McpToolMetadata> toolRegistry = new ConcurrentHashMap<>();
    
    // Registry of servers by domain
    private final Map<String, List<McpTool>> domainRegistry = new ConcurrentHashMap<>();
    
    /**
     * Metadata wrapper for MCP tools including execution context
     */
    public record McpToolMetadata(
        McpTool tool,
        Object bean,
        Method method,
        String beanName
    ) {}
    
    @PostConstruct
    public void discoverAndRegisterTools() {
        logger.info("Starting MCP tool discovery...");
        
        // Find all beans with MCP server annotation
        Map<String, Object> mcpServers = applicationContext.getBeansWithAnnotation(McpServer.class);
        
        for (Map.Entry<String, Object> entry : mcpServers.entrySet()) {
            String beanName = entry.getKey();
            Object bean = entry.getValue();
            
            registerServerTools(beanName, bean);
        }
        
        // Also scan for individual tool methods in regular components
        String[] allBeanNames = applicationContext.getBeanDefinitionNames();
        for (String beanName : allBeanNames) {
            Object bean = applicationContext.getBean(beanName);
            scanForIndividualTools(beanName, bean);
        }
        
        logger.info("MCP tool discovery completed. Registered {} tools across {} domains", 
                   toolRegistry.size(), domainRegistry.size());
        
        // Log summary by domain
        domainRegistry.forEach((domain, tools) -> 
            logger.info("Domain '{}': {} tools", domain, tools.size()));
    }
    
    private void registerServerTools(String beanName, Object bean) {
        McpServer serverAnnotation = AnnotationUtils.findAnnotation(bean.getClass(), McpServer.class);
        if (serverAnnotation == null) return;
        
        logger.info("Registering MCP server: {} (domain: {})", 
                   serverAnnotation.name().isEmpty() ? beanName : serverAnnotation.name(),
                   serverAnnotation.domain());
        
        // Scan all methods for tool definitions
        Method[] methods = bean.getClass().getDeclaredMethods();
        for (Method method : methods) {
            McpToolDefinition toolAnnotation = AnnotationUtils.findAnnotation(method, McpToolDefinition.class);
            if (toolAnnotation != null) {
                registerTool(beanName, bean, method, toolAnnotation);
            }
        }
    }
    
    private void scanForIndividualTools(String beanName, Object bean) {
        Method[] methods = bean.getClass().getDeclaredMethods();
        for (Method method : methods) {
            McpToolDefinition toolAnnotation = AnnotationUtils.findAnnotation(method, McpToolDefinition.class);
            if (toolAnnotation != null) {
                registerTool(beanName, bean, method, toolAnnotation);
            }
        }
    }
    
    private void registerTool(String beanName, Object bean, Method method, McpToolDefinition annotation) {
        String toolName = annotation.name().isEmpty() ? annotation.value() : annotation.name();
        if (toolName.isEmpty()) {
            toolName = method.getName();
        }
        
        // Generate input schema from method parameters
        McpSchema inputSchema = generateInputSchema(method);
        
        // Generate output schema from return type
        McpSchema outputSchema = generateOutputSchema(method);
        
        // Create tool definition
        McpTool tool = McpTool.builder()
            .name(toolName)
            .description(annotation.description())
            .domain(annotation.domain())
            .version(annotation.version())
            .inputSchema(inputSchema)
            .outputSchema(outputSchema)
            .tags(Arrays.asList(annotation.tags()))
            .metadata(Map.of(
                "beanName", beanName,
                "methodName", method.getName(),
                "requiresAuth", annotation.requiresAuth(),
                "isReadOnly", annotation.isReadOnly(),
                "timeoutMs", annotation.timeoutMs()
            ))
            .build();
        
        // Register tool
        McpToolMetadata metadata = new McpToolMetadata(tool, bean, method, beanName);
        toolRegistry.put(toolName, metadata);
        
        // Register by domain
        domainRegistry.computeIfAbsent(annotation.domain(), k -> new ArrayList<>()).add(tool);
        
        logger.debug("Registered MCP tool: {} (domain: {})", toolName, annotation.domain());
    }
    
    private McpSchema generateInputSchema(Method method) {
        Map<String, McpProperty> properties = new HashMap<>();
        List<String> required = new ArrayList<>();
        
        Parameter[] parameters = method.getParameters();
        for (Parameter parameter : parameters) {
            McpParameter paramAnnotation = parameter.getAnnotation(McpParameter.class);
            
            String paramName = paramAnnotation != null && !paramAnnotation.name().isEmpty() 
                ? paramAnnotation.name() 
                : parameter.getName();
            
            String description = paramAnnotation != null 
                ? paramAnnotation.description() 
                : "Parameter: " + paramName;
            
            boolean isRequired = paramAnnotation == null || paramAnnotation.required();
            
            // Map Java types to JSON schema types
            McpProperty property = mapJavaTypeToMcpProperty(parameter.getType(), description);
            properties.put(paramName, property);
            
            if (isRequired) {
                required.add(paramName);
            }
        }
        
        return McpSchema.object(properties, required);
    }
    
    private McpSchema generateOutputSchema(Method method) {
        Class<?> returnType = method.getReturnType();
        if (returnType == void.class || returnType == Void.class) {
            return McpSchema.object(Map.of(), List.of());
        }
        
        // For complex objects, we'll create a generic object schema
        // In a real implementation, you might want to use reflection or JSON schema generation
        return McpSchema.object(
            Map.of("result", mapJavaTypeToMcpProperty(returnType, "Operation result")),
            List.of("result")
        );
    }
    
    private McpProperty mapJavaTypeToMcpProperty(Class<?> javaType, String description) {
        if (String.class.isAssignableFrom(javaType)) {
            return McpProperty.string(description);
        } else if (Number.class.isAssignableFrom(javaType) || javaType.isPrimitive()) {
            return McpProperty.number(description);
        } else if (Boolean.class.isAssignableFrom(javaType) || javaType == boolean.class) {
            return McpProperty.bool(description);
        } else {
            // For complex objects, default to string for now
            return McpProperty.string(description + " (JSON object)");
        }
    }
    
    // Public API methods
    
    public Collection<McpTool> getAllTools() {
        return toolRegistry.values().stream()
            .map(McpToolMetadata::tool)
            .toList();
    }
    
    public Collection<McpTool> getToolsByDomain(String domain) {
        return domainRegistry.getOrDefault(domain, List.of());
    }
    
    public Optional<McpToolMetadata> getToolMetadata(String toolName) {
        return Optional.ofNullable(toolRegistry.get(toolName));
    }
    
    public Set<String> getAllDomains() {
        return domainRegistry.keySet();
    }
    
    public Map<String, Integer> getDomainSummary() {
        return domainRegistry.entrySet().stream()
            .collect(HashMap::new, 
                    (map, entry) -> map.put(entry.getKey(), entry.getValue().size()), 
                    HashMap::putAll);
    }
}