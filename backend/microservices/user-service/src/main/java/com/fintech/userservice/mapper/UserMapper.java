package com.fintech.userservice.mapper;

import com.fintech.userservice.dto.CreateUserRequestDto;
import com.fintech.userservice.dto.UserResponseDto;
import com.fintech.userservice.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * User Mapper
 * Maps between User entities and DTOs using MapStruct
 */
@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    /**
     * Convert User entity to UserResponseDto
     */
    UserResponseDto toResponseDto(User user);

    /**
     * Convert CreateUserRequestDto to User entity
     */
    User toEntity(CreateUserRequestDto createUserRequest);

    /**
     * Update existing User entity with data from CreateUserRequestDto
     */
    void updateUserFromDto(CreateUserRequestDto updateRequest, @MappingTarget User user);
}