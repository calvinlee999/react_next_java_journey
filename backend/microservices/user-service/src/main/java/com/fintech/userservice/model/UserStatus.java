package com.fintech.userservice.model;

/**
 * User Status Enumeration
 * Defines the possible states of a user account
 */
public enum UserStatus {
    /**
     * User account is active and can perform all operations
     */
    ACTIVE,
    
    /**
     * User account is temporarily suspended
     */
    SUSPENDED,
    
    /**
     * User account is deactivated but can be reactivated
     */
    INACTIVE,
    
    /**
     * User account is permanently banned
     */
    BANNED,
    
    /**
     * User account is pending email verification
     */
    PENDING_VERIFICATION
}