package com.campusfind.service;

import com.campusfind.dto.request.ChangePasswordRequest;
import com.campusfind.dto.request.LoginRequest;
import com.campusfind.dto.request.RegisterRequest;
import com.campusfind.dto.request.UpdateProfileRequest;
import com.campusfind.dto.response.AuthResponse;
import com.campusfind.dto.response.UserResponse;
import com.campusfind.entity.User;
import com.campusfind.enums.Role;
import com.campusfind.exception.BadRequestException;
import com.campusfind.exception.ResourceNotFoundException;
import com.campusfind.exception.UnauthorizedException;
import com.campusfind.repository.UserRepository;
import com.campusfind.security.JwtTokenProvider;
import com.campusfind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String rawEmail = request.getEmail().trim();
        String normalizedEmail = rawEmail.toLowerCase();

        if (!normalizedEmail.endsWith("@cuchd.in")) {
            throw new BadRequestException("Registration requires an official @cuchd.in email address (e.g., 24BCS10980@cuchd.in)");
        }

        int atIndex = rawEmail.indexOf('@');
        if (atIndex <= 0) {
            throw new BadRequestException("Invalid @cuchd.in email format");
        }
        String derivedUniversityId = rawEmail.substring(0, atIndex).trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .phoneNumber(request.getPhoneNumber().trim())
                .studentId(derivedUniversityId)
                .department(request.getDepartment().trim())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUser(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getFullName()
        );

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account has been deactivated. Please contact an administrator.");
        }

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password provided does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setStudentId(request.getStudentId());
        user.setDepartment(request.getDepartment());

        User updated = userRepository.save(user);
        return mapToUserResponse(updated);
    }

    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .studentId(user.getStudentId())
                .department(user.getDepartment())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
