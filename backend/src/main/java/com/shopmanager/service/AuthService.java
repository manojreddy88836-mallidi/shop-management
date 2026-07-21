package com.shopmanager.service;

import com.shopmanager.dto.LoginRequest;
import com.shopmanager.dto.LoginResponse;
import com.shopmanager.entity.User;
import com.shopmanager.repository.UserRepository;
import com.shopmanager.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername();
        log.debug("──── LOGIN ATTEMPT ────────────────────────────────────────");
        log.debug("→ Username: '{}'", username);

        // 1. Check user exists
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            log.warn("✗ User not found in DB: '{}'", username);
            throw new BadCredentialsException("User not found: " + username);
        }
        log.debug("✓ User found in DB: id={}, role={}", user.getId(), user.getRole());

        // 2. Log password hash format (first 10 chars only for safety)
        String storedHash = user.getPassword();
        log.debug("→ Stored hash starts with: '{}'", storedHash.substring(0, Math.min(10, storedHash.length())));
        log.debug("→ Is BCrypt: {}", storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$"));

        // 3. Attempt authentication via Spring Security (uses DaoAuthenticationProvider + BCrypt)
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );
            log.debug("✓ Authentication successful for '{}'", username);
        } catch (AuthenticationException e) {
            log.warn("✗ Authentication failed for '{}': {}", username, e.getMessage());
            // Re-throw with descriptive message
            throw new BadCredentialsException(
                    "Password mismatch for user '" + username + "'. " + e.getMessage());
        }

        // 4. Generate JWT
        String token = jwtUtil.generateToken(username);
        log.debug("✓ JWT generated for '{}' (expires in {}ms)", username, jwtUtil.getExpiration());
        log.debug("──── LOGIN SUCCESS ────────────────────────────────────────");

        return new LoginResponse(token, user.getUsername(), user.getRole(), jwtUtil.getExpiration());
    }

    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("✅ Password changed for user '{}'", username);
    }
}
