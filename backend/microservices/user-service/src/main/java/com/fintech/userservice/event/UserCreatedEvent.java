package com.fintech.userservice.event;

import com.fintech.userservice.model.UserRole;
import com.fintech.userservice.model.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User Created Event
 * Published when a new user is created in the system
 */
public class UserCreatedEvent {

    private UUID userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private UserStatus status;
    private UserRole role;
    private LocalDateTime createdAt;
    private String eventId;
    private LocalDateTime eventTimestamp;

    // Constructors
    public UserCreatedEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventTimestamp = LocalDateTime.now();
    }

    public UserCreatedEvent(UUID userId, String username, String email, String firstName, 
                           String lastName, String phoneNumber, UserStatus status, UserRole role) {
        this();
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    public void setEventTimestamp(LocalDateTime eventTimestamp) {
        this.eventTimestamp = eventTimestamp;
    }

    @Override
    public String toString() {
        return "UserCreatedEvent{" +
                "userId=" + userId +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", eventId='" + eventId + '\'' +
                ", eventTimestamp=" + eventTimestamp +
                '}';
    }
}