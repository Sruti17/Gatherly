package com.auth.service;

import com.auth.dto.LoginRequest;
import com.auth.dto.RegisterRequest;
import com.auth.dto.UserResponse;
import com.auth.entity.User;
import com.auth.repository.UserRepository;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger logger =
        LoggerFactory.getLogger(AuthService.class);

    private static final SecureRandom SECURE_RANDOM =
        new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String googleClientId;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,

        @Value("${google.oauth.client-id:}")
        String googleClientId
    ) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;

        this.googleClientId =
            googleClientId == null
                ? ""
                : googleClientId.trim();

        if (this.googleClientId.isBlank()) {

            logger.error(
                "GOOGLE AUTH CONFIGURATION ERROR: "
                    + "google.oauth.client-id is EMPTY"
            );

        } else {

            logger.info(
                "Google OAuth configured successfully."
            );
        }

        this.googleIdTokenVerifier =
            new GoogleIdTokenVerifier
                .Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
                )
                .setAudience(
                    Collections.singletonList(
                        this.googleClientId
                    )
                )
                .build();
    }


    /* =========================================================
       LOCAL REGISTRATION
       ========================================================= */

    public UserResponse registerNewUser(
        RegisterRequest request
    ) {

        String email =
            normalizeEmail(
                request.getEmail()
            );

        if (email.isBlank()) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email is required"
            );
        }

        if (
            request.getPassword() == null
                ||
            request.getPassword().isBlank()
        ) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Password is required"
            );
        }

        /*
         * BCrypt maximum password size.
         */
        if (
            request
                .getPassword()
                .getBytes(
                    java.nio.charset.StandardCharsets.UTF_8
                )
                .length
                > 72
        ) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Password must not exceed 72 bytes"
            );
        }

        if (
            userRepository
                .existsByEmailIgnoreCase(
                    email
                )
        ) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists"
            );
        }

        User user =
            new User();

        user.setName(
            safe(
                request.getName()
            )
        );

        user.setEmail(
            email
        );

        user.setPassword(
            passwordEncoder.encode(
                request.getPassword()
            )
        );

        user.setPhone(
            safe(
                request.getPhone()
            )
        );

        user.setOccupation(
            safe(
                request.getOccupation()
            )
        );

        user.setCompany(
            safe(
                request.getCompany()
            )
        );

        user.setAuthProvider(
            "LOCAL"
        );

        User savedUser =
            userRepository.save(
                user
            );

        logger.info(
            "Local Gatherly account created: {}",
            savedUser.getEmail()
        );

        return UserResponse.from(
            savedUser
        );
    }


    /* =========================================================
       LOCAL LOGIN
       ========================================================= */

    public UserResponse login(
        LoginRequest request
    ) {

        String email =
            normalizeEmail(
                request.getEmail()
            );

        User user =
            userRepository
                .findByEmailIgnoreCase(
                    email
                )
                .orElseThrow(
                    () ->
                        new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email or password"
                        )
                );

        if (
            request.getPassword() == null
                ||
            request
                .getPassword()
                .getBytes(
                    java.nio.charset.StandardCharsets.UTF_8
                )
                .length
                > 72
        ) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        if (
            !passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
            )
        ) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        logger.info(
            "Local login successful: {}",
            user.getEmail()
        );

        return UserResponse.from(
            user
        );
    }


    /* =========================================================
       GOOGLE REGISTRATION / CONTINUE WITH GOOGLE
       =========================================================
       
       Used by JoinGangModal.
       
       If the user does not exist:
           CREATE account.
           
       If the user already exists:
           return/login existing user.
       ========================================================= */

    public UserResponse googleSignIn(
        String credential
    ) {

        GoogleProfile profile =
            verifyGoogleCredential(
                credential
            );

        /*
         * First try Google's stable account ID.
         */
        Optional<User> googleUser =
            userRepository
                .findByGoogleSubject(
                    profile.googleSubject()
                );

        if (googleUser.isPresent()) {

            logger.info(
                "Existing Google user authenticated: {}",
                googleUser.get().getEmail()
            );

            return UserResponse.from(
                googleUser.get()
            );
        }

        /*
         * Check whether Gatherly already contains
         * an account with the Google email.
         */
        Optional<User> emailUser =
            userRepository
                .findByEmailIgnoreCase(
                    profile.email()
                );

        if (emailUser.isPresent()) {

            User user =
                emailUser.get();

            linkGoogleAccountIfAllowed(
                user,
                profile
            );

            User saved =
                userRepository.save(
                    user
                );

            return UserResponse.from(
                saved
            );
        }

        /*
         * No Gatherly account exists.
         *
         * Because this method is used by
         * "Continue with Google" registration,
         * create a new account.
         */
        User newUser =
            new User();

        newUser.setName(
            profile.name().isBlank()
                ? defaultNameFromEmail(
                    profile.email()
                )
                : profile.name()
        );

        newUser.setEmail(
            profile.email()
        );

        newUser.setGoogleSubject(
            profile.googleSubject()
        );

        newUser.setAuthProvider(
            "GOOGLE"
        );

        /*
         * Your USERS table currently expects a password.
         *
         * Google users never use this password.
         */
        String generatedPassword =
            generateInternalPassword();

        newUser.setPassword(
            passwordEncoder.encode(
                generatedPassword
            )
        );

        newUser.setPhone("");
        newUser.setOccupation("");
        newUser.setCompany("");

        User savedUser =
            userRepository.save(
                newUser
            );

        logger.info(
            "New Google Gatherly account created: {}",
            savedUser.getEmail()
        );

        return UserResponse.from(
            savedUser
        );
    }


    /* =========================================================
       GOOGLE LOGIN ONLY
       =========================================================
       
       Used ONLY from LoginModal.
       
       IMPORTANT:
       
       This method NEVER creates a user.
       
       Existing user:
           login.
           
       Missing user:
           tell them to create an account.
       ========================================================= */

    public UserResponse googleLogin(
        String credential
    ) {

        GoogleProfile profile =
            verifyGoogleCredential(
                credential
            );

        /*
         * -----------------------------------------------------
         * 1. Existing account already linked with Google
         * -----------------------------------------------------
         */
        Optional<User> googleUser =
            userRepository
                .findByGoogleSubject(
                    profile.googleSubject()
                );

        if (googleUser.isPresent()) {

            User user =
                googleUser.get();

            logger.info(
                "Google login successful: {}",
                user.getEmail()
            );

            return UserResponse.from(
                user
            );
        }


        /*
         * -----------------------------------------------------
         * 2. Registered Gatherly account exists by email
         * -----------------------------------------------------
         *
         * Example:
         *
         * User previously registered:
         *
         *     user@gmail.com + password
         *
         * Then chooses:
         *
         *     Log in with Google
         *
         * We can link the verified Google identity
         * to that existing Gatherly account.
         */
        Optional<User> existingEmailUser =
            userRepository
                .findByEmailIgnoreCase(
                    profile.email()
                );

        if (existingEmailUser.isPresent()) {

            User user =
                existingEmailUser.get();

            linkGoogleAccountIfAllowed(
                user,
                profile
            );

            User saved =
                userRepository.save(
                    user
                );

            logger.info(
                "Existing Gatherly account linked and "
                    + "logged in through Google: {}",
                saved.getEmail()
            );

            return UserResponse.from(
                saved
            );
        }


        /*
         * -----------------------------------------------------
         * 3. USER IS NOT REGISTERED
         * -----------------------------------------------------
         *
         * DO NOT CREATE USER HERE.
         */
        logger.info(
            "Google login rejected because no Gatherly "
                + "account exists for: {}",
            profile.email()
        );

        throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "No Gatherly account exists for this Google account. "
                + "Please create an account first, then log in."
        );
    }


    /* =========================================================
       VERIFY GOOGLE TOKEN
       ========================================================= */

    private GoogleProfile verifyGoogleCredential(
        String credential
    ) {

        if (googleClientId.isBlank()) {

            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Google sign-in is not configured on the server"
            );
        }

        if (
            credential == null
                ||
            credential.isBlank()
        ) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Google credential is required"
            );
        }

        final GoogleIdToken idToken;

        try {

            idToken =
                googleIdTokenVerifier.verify(
                    credential
                );

        } catch (
            GeneralSecurityException
                |
            IOException exception
        ) {

            logger.error(
                "Google ID token verification failed",
                exception
            );

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Google sign-in token could not be verified"
            );
        }

        if (idToken == null) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid Google sign-in token"
            );
        }

        GoogleIdToken.Payload payload =
            idToken.getPayload();

        String googleSubject =
            safe(
                payload.getSubject()
            );

        String email =
            normalizeEmail(
                payload.getEmail()
            );

        boolean emailVerified =
            Boolean.TRUE.equals(
                payload.getEmailVerified()
            );

        String name =
            objectValue(
                payload.get(
                    "name"
                )
            );

        String hostedDomain =
            objectValue(
                payload.get(
                    "hd"
                )
            );

        if (googleSubject.isBlank()) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Google account identifier is missing"
            );
        }

        if (
            email.isBlank()
                ||
            !emailVerified
        ) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Google did not return a verified email address"
            );
        }

        return new GoogleProfile(
            googleSubject,
            email,
            name,
            hostedDomain
        );
    }


    /* =========================================================
       LINK EXISTING LOCAL ACCOUNT TO GOOGLE
       ========================================================= */

    private void linkGoogleAccountIfAllowed(
        User user,
        GoogleProfile profile
    ) {

        /*
         * Already linked with another Google identity.
         */
        if (
            user.getGoogleSubject() != null
                &&
            !user.getGoogleSubject().isBlank()
                &&
            !user
                .getGoogleSubject()
                .equals(
                    profile.googleSubject()
                )
        ) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This Gatherly account is already linked "
                    + "to another Google account"
            );
        }

        /*
         * Google is authoritative for Gmail and
         * Google Workspace accounts.
         */
        if (
            !isGoogleAuthoritativeForEmail(
                profile.email(),
                profile.hostedDomain()
            )
        ) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This email already has a Gatherly account. "
                    + "Please log in with your password first."
            );
        }

        user.setGoogleSubject(
            profile.googleSubject()
        );

        /*
         * Preserve whether this started as a local account.
         */
        if (
            "LOCAL".equalsIgnoreCase(
                safe(
                    user.getAuthProvider()
                )
            )
        ) {

            user.setAuthProvider(
                "LOCAL+GOOGLE"
            );

        } else {

            user.setAuthProvider(
                "GOOGLE"
            );
        }

        if (
            (
                user.getName() == null
                    ||
                user.getName().isBlank()
            )
                &&
            !profile.name().isBlank()
        ) {

            user.setName(
                profile.name()
            );
        }
    }


    /* =========================================================
       RANDOM INTERNAL PASSWORD FOR GOOGLE ACCOUNTS
       ========================================================= */

    private String generateInternalPassword() {

        byte[] randomBytes =
            new byte[32];

        SECURE_RANDOM.nextBytes(
            randomBytes
        );

        return Base64
            .getUrlEncoder()
            .withoutPadding()
            .encodeToString(
                randomBytes
            );
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    private boolean isGoogleAuthoritativeForEmail(
        String email,
        String hostedDomain
    ) {

        return email.endsWith(
            "@gmail.com"
        )
            ||
            !safe(
                hostedDomain
            ).isBlank();
    }

    private String normalizeEmail(
        String email
    ) {

        return safe(
            email
        ).toLowerCase();
    }

    private String defaultNameFromEmail(
        String email
    ) {

        if (
            email == null
                ||
            email.isBlank()
        ) {

            return "Gatherly member";
        }

        int atPosition =
            email.indexOf(
                '@'
            );

        if (atPosition <= 0) {

            return email;
        }

        String name =
            email.substring(
                0,
                atPosition
            );

        return name.isBlank()
            ? "Gatherly member"
            : name;
    }

    private String objectValue(
        Object value
    ) {

        return value == null
            ? ""
            : String.valueOf(
                value
            ).trim();
    }

    private String safe(
        String value
    ) {

        return value == null
            ? ""
            : value.trim();
    }


    /*
     * Internal verified Google profile.
     */
    private record GoogleProfile(
        String googleSubject,
        String email,
        String name,
        String hostedDomain
    ) {}
}