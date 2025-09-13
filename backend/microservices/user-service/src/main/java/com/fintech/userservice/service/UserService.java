package com.fintech.userservice.service;

import com.fintech.userservice.dto.CreateUserRequestDto;
import com.fintech.userservice.dto.UserResponseDto;
import com.fintech.userservice.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * User Service Interface
 * Defines the contract for user management operations
 */
public interface UserService {

    /**
     * Create a new user
     */
    UserResponseDto createUser(CreateUserRequestDto createUserRequest);

    /**
     * Get user by ID
     */
    UserResponseDto getUserById(UUID userId);

    /**
     * Get user by email
     */
    UserResponseDto getUserByEmail(String email);

    /**
     * Get user by username
     */
    UserResponseDto getUserByUsername(String username);

    /**
     * Update user information
     */
    UserResponseDto updateUser(UUID userId, CreateUserRequestDto updateUserRequest);

    /**
     * Update user status
     */
    UserResponseDto updateUserStatus(UUID userId, UserStatus status);

    /**
     * Delete user (soft delete)
     */
    void deleteUser(UUID userId);

    /**
     * Get all users with pagination
     */
    Page<UserResponseDto> getAllUsers(Pageable pageable);

    /**
     * Search users by criteria
     */
    Page<UserResponseDto> searchUsers(String email, String username, String firstName, 
                                     String lastName, UserStatus status, Pageable pageable);

    /**
     * Verify user email
     */
    UserResponseDto verifyEmail(UUID userId);

    /**
     * Verify user phone
     */
    UserResponseDto verifyPhone(UUID userId);

    /**
     * Enable two-factor authentication
     */
    UserResponseDto enableTwoFactorAuth(UUID userId);

    /**
     * Disable two-factor authentication
     */
    UserResponseDto disableTwoFactorAuth(UUID userId);

    /**
     * Record user login
     */
    void recordLogin(UUID userId);

    /**
     * Check if email exists
     */
    boolean emailExists(String email);

    /**
     * Check if username exists
     */
    boolean usernameExists(String username);
}