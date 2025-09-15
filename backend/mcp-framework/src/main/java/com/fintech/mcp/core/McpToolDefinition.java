package com.fintech.mcp.core;

import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

import java.lang.annotation.*;

/**
 * Annotation to mark a method as an MCP Tool (Business Capability)
 * 
 * This annotation automatically registers the method as an agent-accessible tool
 * following the Model Context Protocol specification.
 * 
 * Usage:
 * @McpToolDefinition(
 *     name = "submit_loan_application",
 *     description = "Submits a new loan application with applicant details",
 *     domain = "lending"
 * )
 * public LoanApplicationResult submitLoanApplication(LoanApplicationRequest request) {
 *     // Business logic here
 * }
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface McpToolDefinition {
    
    /**
     * The name of the tool as it will be exposed to AI agents
     * Should follow snake_case convention for consistency
     */
    @AliasFor("value")
    String name() default "";
    
    /**
     * Alias for name()
     */
    @AliasFor("name")
    String value() default "";
    
    /**
     * Human-readable description of what this tool does
     * This description helps the AI agent understand when and how to use the tool
     */
    String description();
    
    /**
     * The business domain this tool belongs to
     * Examples: "user-management", "lending", "payments", "risk-assessment"
     */
    String domain();
    
    /**
     * Version of this tool (for backwards compatibility)
     */
    String version() default "1.0.0";
    
    /**
     * Tags for categorizing and discovering tools
     */
    String[] tags() default {};
    
    /**
     * Whether this tool requires special permissions
     */
    boolean requiresAuth() default true;
    
    /**
     * Whether this tool can modify data (affects audit logging)
     */
    boolean isReadOnly() default false;
    
    /**
     * Maximum execution time in milliseconds
     */
    long timeoutMs() default 30000;
}

/**
 * Annotation for marking method parameters with MCP schema information
 */
@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface McpParameter {
    
    /**
     * Parameter name (defaults to method parameter name)
     */
    String name() default "";
    
    /**
     * Parameter description for AI agent
     */
    String description();
    
    /**
     * Whether this parameter is required
     */
    boolean required() default true;
    
    /**
     * Example value for documentation
     */
    String example() default "";
}

/**
 * Annotation to mark a class as an MCP Server
 * Contains multiple related business capabilities
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface McpServer {
    
    /**
     * Server name (defaults to class name)
     */
    String name() default "";
    
    /**
     * Server description
     */
    String description();
    
    /**
     * Business domain this server handles
     */
    String domain();
    
    /**
     * Server version
     */
    String version() default "1.0.0";
    
    /**
     * Base URL for HTTP transport (if applicable)
     */
    String baseUrl() default "";
    
    /**
     * Supported transport protocols
     */
    String[] transports() default {"STDIO", "HTTP"};
}