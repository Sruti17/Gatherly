package com.auth.repository;

import com.auth.entity.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository
    extends JpaRepository<User, Long> {

    boolean existsByEmailIgnoreCase(
        String email
    );

    Optional<User> findByEmailIgnoreCase(
        String email
    );

    /*
     * Find returning Google users using
     * Google's permanent "sub" identifier.
     */
    Optional<User> findByGoogleSubject(
        String googleSubject
    );
}