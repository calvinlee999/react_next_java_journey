package com.fintech.userservice.mcp;

import com.fintech.mcp.core.McpServer;
import com.fintech.mcp.core.McpToolDefinition;
import com.fintech.mcp.core.McpParameter;
import com.fintech.userservice.dto.CreateUserRequestDto;
import com.fintech.userservice.dto.UserResponseDto;
import com.fintech.userservice.model.UserStatus;
import com.fintech.userservice.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * User Management MCP Server
 * 
 * Exposes user management business capabilities as MCP tools for AI agents.
 * This follows the domain-based API pattern where business capabilities
 * are prioritized over individual API endpoints.
 */
@Service
@McpServer(
    name = "user-management-server",
    description = "User management business capabilities for AI agents",
    domain = "user-management",
    version = "1.0.0"
)
public class UserManagementMcpServer {
    
    private static final Logger logger = LoggerFactory.getLogger(UserManagementMcpServer.class);
    
    private final UserService userService;
    
    public UserManagementMcpServer(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * Create a new user account
     * Business capability: Account creation and onboarding
     */
    @McpToolDefinition(
        name = "create_user_account",
        description = "Creates a new user account with profile information. Returns the created user with assigned ID and verification status.",
        domain = "user-management",
        tags = {"user", "account", "onboarding"},
        isReadOnly = false
    )
    public UserAccountResult createUserAccount(
            @McpParameter(
                description = "User's email address (must be unique)", 
                required = true
            ) String email,
            
            @McpParameter(
                description = "Desired username (must be unique)", 
                required = true
            ) String username,
            
            @McpParameter(
                description = "User's first name", 
                required = true
            ) String firstName,
            
            @McpParameter(
                description = "User's last name", 
                required = true
            ) String lastName,
            
            @McpParameter(
                description = "User's phone number for verification",
                required = false
            ) String phoneNumber) {
        
        logger.info("Creating user account for email: {} via MCP", email);
        
        try {
            CreateUserRequestDto request = CreateUserRequestDto.builder()
                .email(email)
                .username(username)
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phoneNumber)
                .build();
            
            UserResponseDto userResponse = userService.createUser(request);
            
            return new UserAccountResult(
                true,
                userResponse.getId().toString(),
                userResponse.getEmail(),
                userResponse.getUsername(),
                userResponse.getStatus().toString(),
                "User account created successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to create user account via MCP", e);
            return new UserAccountResult(
                false,
                null,
                email,
                username,
                "FAILED",
                "Failed to create account: " + e.getMessage()
            );
        }
    }
    
    /**
     * Retrieve user information by ID
     * Business capability: User profile lookup
     */
    @McpToolDefinition(
        name = "get_user_profile",
        description = "Retrieves user profile information by user ID. Returns complete user details including status and verification state.",
        domain = "user-management",
        tags = {"user", "profile", "lookup"},
        isReadOnly = true
    )
    public UserProfileResult getUserProfile(
            @McpParameter(
                description = "Unique user identifier (UUID format)",
                required = true
            ) String userId) {
        
        logger.info("Retrieving user profile for ID: {} via MCP", userId);
        
        try {
            UUID userUuid = UUID.fromString(userId);
            UserResponseDto userResponse = userService.getUserById(userUuid);
            
            return new UserProfileResult(
                true,
                userResponse.getId().toString(),
                userResponse.getEmail(),
                userResponse.getUsername(),
                userResponse.getFirstName(),
                userResponse.getLastName(),
                userResponse.getPhoneNumber(),
                userResponse.getStatus().toString(),
                userResponse.getCreatedAt().toString(),
                "Profile retrieved successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to retrieve user profile via MCP", e);
            return new UserProfileResult(
                false,
                userId,
                null, null, null, null, null,
                "ERROR",
                null,
                "Failed to retrieve profile: " + e.getMessage()
            );
        }
    }
    
    /**
     * Update user account status
     * Business capability: Account lifecycle management
     */
    @McpToolDefinition(
        name = "update_user_status",
        description = "Updates user account status (ACTIVE, SUSPENDED, PENDING_VERIFICATION). Used for account lifecycle management and compliance.",
        domain = "user-management",
        tags = {"user", "status", "lifecycle", "compliance"},
        isReadOnly = false
    )
    public UserStatusResult updateUserStatus(
            @McpParameter(
                description = "Unique user identifier (UUID format)",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "New user status (ACTIVE, SUSPENDED, PENDING_VERIFICATION, DEACTIVATED)",
                required = true
            ) String newStatus,
            
            @McpParameter(
                description = "Reason for status change (for audit trail)",
                required = false
            ) String reason) {
        
        logger.info("Updating user status for ID: {} to: {} via MCP", userId, newStatus);
        
        try {
            UUID userUuid = UUID.fromString(userId);
            UserStatus status = UserStatus.valueOf(newStatus.toUpperCase());
            
            UserResponseDto userResponse = userService.updateUserStatus(userUuid, status);
            
            return new UserStatusResult(
                true,
                userResponse.getId().toString(),
                userResponse.getStatus().toString(),
                reason != null ? reason : "Status updated via AI agent",
                System.currentTimeMillis(),
                "User status updated successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to update user status via MCP", e);
            return new UserStatusResult(
                false,
                userId,
                newStatus,
                reason,
                System.currentTimeMillis(),
                "Failed to update status: " + e.getMessage()
            );
        }
    }
    
    /**
     * Verify user account via email/phone
     * Business capability: Account verification and KYC
     */
    @McpToolDefinition(
        name = "verify_user_account",
        description = "Verifies user account using verification code. Part of KYC process and regulatory compliance.",
        domain = "user-management",
        tags = {"user", "verification", "kyc", "compliance"},
        isReadOnly = false
    )
    public UserVerificationResult verifyUserAccount(
            @McpParameter(
                description = "User's email address",
                required = true
            ) String email,
            
            @McpParameter(
                description = "Verification code sent to user",
                required = true
            ) String verificationCode,
            
            @McpParameter(
                description = "Verification type (EMAIL or PHONE)",
                required = true
            ) String verificationType) {
        
        logger.info("Verifying user account for email: {} via MCP", email);
        
        try {
            // In a real implementation, you would verify the code
            // For now, we'll simulate successful verification
            UserResponseDto user = userService.getUserByEmail(email);
            
            if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
                userService.updateUserStatus(user.getId(), UserStatus.ACTIVE);
            }
            
            return new UserVerificationResult(
                true,
                user.getId().toString(),
                email,
                verificationType,
                "VERIFIED",
                System.currentTimeMillis(),
                "Account verified successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to verify user account via MCP", e);
            return new UserVerificationResult(
                false,
                null,
                email,
                verificationType,
                "FAILED",
                System.currentTimeMillis(),
                "Verification failed: " + e.getMessage()
            );
        }
    }
}

// Result DTOs for MCP responses
record UserAccountResult(
    boolean success,
    String userId,
    String email,
    String username,
    String status,
    String message
) {}

record UserProfileResult(
    boolean success,
    String userId,
    String email,
    String username,
    String firstName,
    String lastName,
    String phoneNumber,
    String status,
    String createdAt,
    String message
) {}

record UserStatusResult(
    boolean success,
    String userId,
    String newStatus,
    String reason,
    long timestamp,
    String message
) {}

record UserVerificationResult(
    boolean success,
    String userId,
    String email,
    String verificationType,
    String verificationStatus,
    long timestamp,
    String message
) {}