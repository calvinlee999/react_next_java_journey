package com.fintech.mcp.core;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

/**
 * Core MCP Tool Definition
 * 
 * Represents a business capability that can be executed by AI agents.
 * Follows the Model Context Protocol specification for tool definitions.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record McpTool(
    @JsonProperty("name")
    @NotBlank(message = "Tool name cannot be blank")
    String name,
    
    @JsonProperty("description")
    @NotBlank(message = "Tool description cannot be blank")
    String description,
    
    @JsonProperty("inputSchema")
    @NotNull(message = "Input schema cannot be null")
    McpSchema inputSchema,
    
    @JsonProperty("outputSchema")
    McpSchema outputSchema,
    
    @JsonProperty("domain")
    @NotBlank(message = "Domain cannot be blank")
    String domain,
    
    @JsonProperty("version")
    String version,
    
    @JsonProperty("tags")
    List<String> tags,
    
    @JsonProperty("metadata")
    Map<String, Object> metadata
) {
    
    /**
     * Default constructor with required fields
     */
    public McpTool(String name, String description, McpSchema inputSchema, String domain) {
        this(name, description, inputSchema, null, domain, "1.0.0", List.of(), Map.of());
    }
    
    /**
     * Business capability builder
     */
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String name;
        private String description;
        private McpSchema inputSchema;
        private McpSchema outputSchema;
        private String domain;
        private String version = "1.0.0";
        private List<String> tags = List.of();
        private Map<String, Object> metadata = Map.of();
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        
        public Builder inputSchema(McpSchema inputSchema) {
            this.inputSchema = inputSchema;
            return this;
        }
        
        public Builder outputSchema(McpSchema outputSchema) {
            this.outputSchema = outputSchema;
            return this;
        }
        
        public Builder domain(String domain) {
            this.domain = domain;
            return this;
        }
        
        public Builder version(String version) {
            this.version = version;
            return this;
        }
        
        public Builder tags(List<String> tags) {
            this.tags = tags;
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public McpTool build() {
            return new McpTool(name, description, inputSchema, outputSchema, domain, version, tags, metadata);
        }
    }
}

/**
 * JSON Schema definition for MCP tool parameters
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
record McpSchema(
    @JsonProperty("type")
    String type,
    
    @JsonProperty("properties")
    Map<String, McpProperty> properties,
    
    @JsonProperty("required")
    List<String> required,
    
    @JsonProperty("additionalProperties")
    Boolean additionalProperties
) {
    
    public static McpSchema object(Map<String, McpProperty> properties, List<String> required) {
        return new McpSchema("object", properties, required, false);
    }
}

/**
 * Property definition for MCP schema
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
record McpProperty(
    @JsonProperty("type")
    String type,
    
    @JsonProperty("description")
    String description,
    
    @JsonProperty("enum")
    List<String> enumValues,
    
    @JsonProperty("format")
    String format,
    
    @JsonProperty("minimum")
    Number minimum,
    
    @JsonProperty("maximum")
    Number maximum
) {
    
    public static McpProperty string(String description) {
        return new McpProperty("string", description, null, null, null, null);
    }
    
    public static McpProperty number(String description) {
        return new McpProperty("number", description, null, null, null, null);
    }
    
    public static McpProperty bool(String description) {
        return new McpProperty("boolean", description, null, null, null, null);
    }
    
    public static McpProperty enumeration(String description, List<String> values) {
        return new McpProperty("string", description, values, null, null, null);
    }
}