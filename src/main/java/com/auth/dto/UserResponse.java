package com.auth.dto;

import com.auth.entity.User;

public record UserResponse(Long id, String name, String email, String phone, String occupation, String company) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getOccupation(), user.getCompany());
    }
}
