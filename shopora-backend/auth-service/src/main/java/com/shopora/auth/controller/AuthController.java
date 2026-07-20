package com.shopora.auth.controller;

import com.shopora.auth.dto.AuthResponse;
import com.shopora.auth.dto.LoginRequest;
import com.shopora.auth.dto.RegisterRequest;
import com.shopora.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Expose les endpoints REST publics d'authentification.
 * Ce sont les 2 SEULES routes de auth-service accessibles sans token JWT
 * (voir SecurityConfig : .permitAll() sur exactement ces 2 chemins).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Body attendu (JSON) : { fullName, email, password, role }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        // 201 CREATED : sémantiquement plus correct que 200 pour une création de ressource
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Body attendu (JSON) : { email, password }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}