package com.fintech.userservice.repository;

import com.fintech.userservice.model.User;
import com.fintech.userservice.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * User Repository
 * Data access layer for User entities
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by email address
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by username
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Check if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Find users by status
     */
    List<User> findByStatus(UserStatus status);

    /**
     * Find users by status with pagination
     */
    Page<User> findByStatus(UserStatus status, Pageable pageable);

    /**
     * Find users created within a date range
     */
    @Query("SELECT u FROM User u WHERE u.createdAt BETWEEN :startDate AND :endDate")
    List<User> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);

    /**
     * Find users by name (first name or last name)
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            @Param("name") String name, Pageable pageable);

    /**
     * Find verified users
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = true AND u.phoneVerified = true")
    List<User> findVerifiedUsers();

    /**
     * Find users with two-factor authentication enabled
     */
    List<User> findByTwoFactorEnabledTrue();

    /**
     * Find users who logged in after a specific date
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginAt > :loginDate")
    List<User> findUsersLoggedInAfter(@Param("loginDate") LocalDateTime loginDate);

    /**
     * Count users by status
     */
    long countByStatus(UserStatus status);

    /**
     * Count verified users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.emailVerified = true AND u.phoneVerified = true")
    long countVerifiedUsers();

    /**
     * Search users by multiple criteria
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:username IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(:firstName IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :firstName, '%'))) AND " +
           "(:lastName IS NULL OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :lastName, '%'))) AND " +
           "(:status IS NULL OR u.status = :status)")
    Page<User> searchUsers(@Param("email") String email,
                          @Param("username") String username,
                          @Param("firstName") String firstName,
                          @Param("lastName") String lastName,
                          @Param("status") UserStatus status,
                          Pageable pageable);
}