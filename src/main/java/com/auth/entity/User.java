package com.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false)
    private String name;


    @Column(nullable = false, unique = true)
    private String email;


    /*
     * Your existing table requires password NOT NULL.
     *
     * Google-created accounts will receive a random,
     * impossible-to-know password hash.
     *
     * They authenticate using Google instead.
     */
    @Column(nullable = false)
    private String password;


    private String phone;

    private String occupation;

    private String company;


    /*
     * Google's stable account identifier.
     *
     * Google recommends using "sub" rather than
     * email as the permanent Google identity.
     */
    @Column(unique = true)
    private String googleSubject;


    /*
     * Examples:
     *
     * LOCAL
     * GOOGLE
     * LOCAL+GOOGLE
     */
    private String authProvider;


    public Long getId() {
        return id;
    }


    public String getName() {
        return name;
    }


    public void setName(String name) {
        this.name = name;
    }


    public String getEmail() {
        return email;
    }


    public void setEmail(String email) {
        this.email = email;
    }


    public String getPassword() {
        return password;
    }


    public void setPassword(String password) {
        this.password = password;
    }


    public String getPhone() {
        return phone;
    }


    public void setPhone(String phone) {
        this.phone = phone;
    }


    public String getOccupation() {
        return occupation;
    }


    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }


    public String getCompany() {
        return company;
    }


    public void setCompany(String company) {
        this.company = company;
    }


    public String getGoogleSubject() {
        return googleSubject;
    }


    public void setGoogleSubject(
        String googleSubject
    ) {
        this.googleSubject = googleSubject;
    }


    public String getAuthProvider() {
        return authProvider;
    }


    public void setAuthProvider(
        String authProvider
    ) {
        this.authProvider = authProvider;
    }
}