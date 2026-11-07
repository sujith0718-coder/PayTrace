package com.paytrace.controller;

import com.paytrace.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${paytrace.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "analyst@paytrace.io");
        String fullName = email.contains("@") ? email.split("@")[0] : "Analyst";
        fullName = Character.toUpperCase(fullName.charAt(0)) + fullName.substring(1);
        String role = email.toLowerCase().contains("admin") ? "ROLE_ADMIN" : "ROLE_ANALYST";

        String token = "paytrace_token_" + System.currentTimeMillis();
        AuthResponse.UserDTO user = new AuthResponse.UserDTO(1L, email, fullName, role);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "analyst@paytrace.io");
        String fullName = body.getOrDefault("fullName", "Analyst");
        String token = "paytrace_token_" + System.currentTimeMillis();
        AuthResponse.UserDTO user = new AuthResponse.UserDTO(System.currentTimeMillis(), email, fullName, "ROLE_ANALYST");
        return ResponseEntity.ok(new AuthResponse(token, user));
    }
}

