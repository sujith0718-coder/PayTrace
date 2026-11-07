package com.paytrace.dto;

public record AuthResponse(
    String token,
    UserDTO user
) {
    public record UserDTO(
        Long id,
        String email,
        String fullName,
        String role
    ) {}
}

