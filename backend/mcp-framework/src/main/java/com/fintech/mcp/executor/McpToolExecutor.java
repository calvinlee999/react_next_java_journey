package com.fintech.mcp.executor;

import com.fintech.mcp.server.McpServerRegistry;
import com.fintech.mcp.server.McpServerRegistry.McpToolMetadata;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * MCP Tool Executor
 * 
 * Executes MCP tools with proper error handling, logging, and event publishing.
 * Supports both synchronous and asynchronous execution patterns.
 */
@Service
public class McpToolExecutor {
    
    private static final Logger logger = LoggerFactory.getLogger(McpToolExecutor.class);
    
    @Autowired
    private McpServerRegistry serverRegistry;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * Execute an MCP tool with the given parameters
     * 
     * @param toolName The name of the tool to execute
     * @param parameters The parameters to pass to the tool
     * @param executionContext Additional context for execution (user ID, trace ID, etc.)
     * @return The result of tool execution
     */
    public CompletableFuture<McpExecutionResult> executeToolAsync(
            String toolName, 
            Map<String, Object> parameters,
            McpExecutionContext executionContext) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                return executeTool(toolName, parameters, executionContext);
            } catch (Exception e) {
                logger.error("Error executing tool: {}", toolName, e);
                return McpExecutionResult.error(
                    "EXECUTION_ERROR", 
                    "Failed to execute tool: " + e.getMessage(), 
                    executionContext.traceId()
                );
            }
        });
    }
    
    /**
     * Synchronous tool execution
     */
    public McpExecutionResult executeTool(
            String toolName, 
            Map<String, Object> parameters,
            McpExecutionContext executionContext) {
        
        long startTime = System.currentTimeMillis();
        
        logger.info("Executing MCP tool: {} with trace ID: {}", toolName, executionContext.traceId());
        
        // Find tool metadata
        Optional<McpToolMetadata> toolMetadata = serverRegistry.getToolMetadata(toolName);
        if (toolMetadata.isEmpty()) {
            return McpExecutionResult.error(
                "TOOL_NOT_FOUND", 
                "Tool not found: " + toolName, 
                executionContext.traceId()
            );
        }
        
        McpToolMetadata metadata = toolMetadata.get();
        
        try {
            // Validate timeout
            long timeoutMs = (Long) metadata.tool().metadata().getOrDefault("timeoutMs", 30000L);
            
            // Convert parameters to method arguments
            Object[] args = convertParametersToArguments(metadata.method(), parameters);
            
            // Execute the method
            Object result = metadata.method().invoke(metadata.bean(), args);
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Publish execution event
            publishExecutionEvent(toolName, executionContext, executionTime, true, null);
            
            logger.info("Successfully executed tool: {} in {}ms", toolName, executionTime);
            
            return McpExecutionResult.success(result, executionContext.traceId(), executionTime);
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            
            logger.error("Failed to execute tool: {} in {}ms", toolName, executionTime, e);
            
            // Publish failure event
            publishExecutionEvent(toolName, executionContext, executionTime, false, e.getMessage());
            
            return McpExecutionResult.error(
                "EXECUTION_FAILED", 
                "Tool execution failed: " + e.getMessage(), 
                executionContext.traceId()
            );
        }
    }
    
    private Object[] convertParametersToArguments(Method method, Map<String, Object> parameters) 
            throws Exception {
        
        Class<?>[] parameterTypes = method.getParameterTypes();
        Object[] args = new Object[parameterTypes.length];
        
        java.lang.reflect.Parameter[] methodParams = method.getParameters();
        
        for (int i = 0; i < methodParams.length; i++) {
            String paramName = methodParams[i].getName();
            Object paramValue = parameters.get(paramName);
            
            if (paramValue != null) {
                // Convert parameter to expected type
                args[i] = convertParameter(paramValue, parameterTypes[i]);
            }
        }
        
        return args;
    }
    
    private Object convertParameter(Object value, Class<?> targetType) throws Exception {
        if (targetType.isAssignableFrom(value.getClass())) {
            return value;
        }
        
        // Use Jackson for complex object conversion
        return objectMapper.convertValue(value, targetType);
    }
    
    private void publishExecutionEvent(String toolName, McpExecutionContext context, 
                                     long executionTime, boolean success, String errorMessage) {
        try {
            McpExecutionEvent event = new McpExecutionEvent(
                toolName,
                context.traceId(),
                context.userId(),
                context.agentId(),
                executionTime,
                success,
                errorMessage,
                System.currentTimeMillis()
            );
            
            kafkaTemplate.send("mcp.tool.execution", event);
        } catch (Exception e) {
            logger.warn("Failed to publish execution event for tool: {}", toolName, e);
        }
    }
}

/**
 * Execution context for MCP tool calls
 */
record McpExecutionContext(
    String traceId,
    String userId,
    String agentId,
    String sessionId,
    Map<String, String> additionalContext
) {
    
    public static McpExecutionContext create(String userId, String agentId) {
        return new McpExecutionContext(
            java.util.UUID.randomUUID().toString(),
            userId,
            agentId,
            java.util.UUID.randomUUID().toString(),
            Map.of()
        );
    }
}

/**
 * Result of MCP tool execution
 */
record McpExecutionResult(
    boolean success,
    Object data,
    String errorCode,
    String errorMessage,
    String traceId,
    long executionTimeMs
) {
    
    public static McpExecutionResult success(Object data, String traceId, long executionTime) {
        return new McpExecutionResult(true, data, null, null, traceId, executionTime);
    }
    
    public static McpExecutionResult error(String errorCode, String errorMessage, String traceId) {
        return new McpExecutionResult(false, null, errorCode, errorMessage, traceId, 0);
    }
}

/**
 * Event published when an MCP tool is executed
 */
record McpExecutionEvent(
    String toolName,
    String traceId,
    String userId,
    String agentId,
    long executionTimeMs,
    boolean success,
    String errorMessage,
    long timestamp
) {}