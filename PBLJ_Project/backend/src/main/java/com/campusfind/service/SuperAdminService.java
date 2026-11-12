package com.campusfind.service;

import com.campusfind.dto.request.AdminCreateRequest;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.dto.response.UserResponse;
import com.campusfind.entity.User;
import com.campusfind.enums.Role;
import com.campusfind.exception.BadRequestException;
import com.campusfind.exception.ResourceNotFoundException;
import com.campusfind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    @Transactional
    public UserResponse createAdmin(AdminCreateRequest request, Long superAdminId, String ipAddress) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email is already registered: " + cleanEmail);
        }

        User superAdmin = userRepository.findById(superAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Super Admin not found"));

        User admin = User.builder()
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .phoneNumber(request.getPhoneNumber())
                .department(request.getDepartment())
                .active(true)
                .build();

        User saved = userRepository.save(admin);

        auditLogService.logAction(
                superAdmin,
                "CREATE_ADMIN",
                "User",
                saved.getId(),
                String.format("Super Admin created new Administrator account for %s (%s)", saved.getFullName(), saved.getEmail()),
                ipAddress
        );

        return authService.mapToUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAdmins(Pageable pageable) {
        Page<User> page = userRepository.findByRole(Role.ADMIN, pageable);
        return PageResponse.from(page.map(authService::mapToUserResponse));
    }

    @Transactional
    public UserResponse toggleAdminStatus(Long adminId, boolean active, Long superAdminId, String ipAddress) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));

        if (admin.getRole() == Role.SUPERADMIN) {
            throw new BadRequestException("Cannot modify status of a Super Administrator");
        }

        User superAdmin = userRepository.findById(superAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Super Admin not found"));

        admin.setActive(active);
        User updated = userRepository.save(admin);

        auditLogService.logAction(
                superAdmin,
                active ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN",
                "User",
                admin.getId(),
                String.format("Admin status toggled to active=%b for %s (%s)", active, admin.getFullName(), admin.getEmail()),
                ipAddress
        );

        return authService.mapToUserResponse(updated);
    }

    @Transactional
    public void resetAdminPassword(Long adminId, String newPassword, Long superAdminId, String ipAddress) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));

        User superAdmin = userRepository.findById(superAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Super Admin not found"));

        admin.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(admin);

        auditLogService.logAction(
                superAdmin,
                "RESET_ADMIN_PASSWORD",
                "User",
                admin.getId(),
                String.format("Password reset executed for Admin %s (%s)", admin.getFullName(), admin.getEmail()),
                ipAddress
        );
    }
}
