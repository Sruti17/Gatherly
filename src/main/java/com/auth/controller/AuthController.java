package com.auth.controller;

import com.auth.dto.GoogleAuthRequest;
import com.auth.dto.LoginRequest;
import com.auth.dto.RegisterRequest;
import com.auth.dto.UserResponse;
import com.auth.service.AuthService;

import common.response.ApiResponse;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")



public class AuthController {

    private final AuthService authService;

    public AuthController(
        AuthService authService
    ) {

        this.authService =
            authService;
    }


    /* =========================================================
       LOCAL REGISTRATION
       ========================================================= */

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(

        @Valid
        @RequestBody
        RegisterRequest request
    ) {

        UserResponse user =
            authService.registerNewUser(
                request
            );

        return new ResponseEntity<>(
            new ApiResponse(
                "User registered successfully.",
                true,
                user
            ),
            HttpStatus.CREATED
        );
    }


    /* =========================================================
       LOCAL LOGIN
       ========================================================= */

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(

        @Valid
        @RequestBody
        LoginRequest request
    ) {

        UserResponse user =
            authService.login(
                request
            );

        return ResponseEntity.ok(
            new ApiResponse(
                "Login successful.",
                true,
                user
            )
        );
    }


    /* =========================================================
       GOOGLE REGISTRATION / CONTINUE WITH GOOGLE
       =========================================================
       
       Used by JoinGangModal.
       
       A missing user may be created.
       ========================================================= */

    @PostMapping("/google")
    public ResponseEntity<ApiResponse> googleSignIn(

        @Valid
        @RequestBody
        GoogleAuthRequest request
    ) {

        UserResponse user =
            authService.googleSignIn(
                request.credential()
            );

        return ResponseEntity.ok(
            new ApiResponse(
                "Google sign-in successful.",
                true,
                user
            )
        );
    }


    /* =========================================================
       GOOGLE LOGIN ONLY
       =========================================================
       
       Used by LoginModal.
       
       This endpoint NEVER creates a user.
       ========================================================= */

    @PostMapping("/google/login")
    public ResponseEntity<ApiResponse> googleLogin(

        @Valid
        @RequestBody
        GoogleAuthRequest request
    ) {

        UserResponse user =
            authService.googleLogin(
                request.credential()
            );

        return ResponseEntity.ok(
            new ApiResponse(
                "Google login successful.",
                true,
                user
            )
        );
    }
}