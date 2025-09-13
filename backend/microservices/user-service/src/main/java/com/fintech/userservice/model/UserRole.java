package com.fintech.userservice.model;

/**
 * User Role Enumeration
 * Defines the different roles a user can have in the system
 */
public enum UserRole {
    /**
     * Regular user with basic permissions
     */
    USER,
    
    /**
     * Premium user with enhanced features
     */
    PREMIUM_USER,
    
    /**
     * Administrator with system management capabilities
     */
    ADMIN,
    
    /**
     * Super administrator with full system access
     */
    SUPER_ADMIN,
    
    /**
     * Customer support representative
     */
    SUPPORT,
    
    /**
     * Auditor with read-only access to system data
     */
    AUDITOR
}