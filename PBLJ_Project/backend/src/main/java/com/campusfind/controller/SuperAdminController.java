package com.campusfind.controller;

import com.campusfind.dto.request.AdminCreateRequest;
import com.campusfind.dto.response.AdminAuditLogResponse;
import com.campusfind.dto.response.ApiResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.dto.response.UserResponse;
import com.campusfind.entity.User;
import com.campusfind.repository.UserRepository;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.AuditLogService;
import com.campusfind.service.SuperAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@PreAuthorize("hasRole('SUPERADMIN')")
@RequiredArgsConstructor
@Tag(name = "Super Admin Exclusive", description = "Endpoints restricted exclusively to the Super Administrator for managing admin accounts")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    private Long resolveUserId(UserPrincipal currentUser, Authentication auth) {
        if (currentUser != null && currentUser.getId() != null) {
            return currentUser.getId();
        }
        if (auth != null) {
            return userRepository.findByEmail(auth.getName())
                    .map(User::getId)
                    .orElse(1L);
        }
        return 1L;
    }

    @PostMapping("/admins")
    @Operation(summary = "Create a new Campus Administrator account (SUPERADMIN only)")
    public ResponseEntity<ApiResponse<UserResponse>> createAdmin(
            @Valid @RequestBody AdminCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        UserResponse response = superAdminService.createAdmin(request, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Administrator created successfully", response));
    }

    @GetMapping("/admins")
    @Operation(summary = "List all registered campus administrators")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<UserResponse> response = superAdminService.getAdmins(pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/admins/{id}/status")
    @Operation(summary = "Activate or deactivate an administrator account")
    public ResponseEntity<ApiResponse<UserResponse>> toggleAdminStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> statusBody,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long superAdminId = resolveUserId(currentUser, authentication);
        boolean active = Boolean.TRUE.equals(statusBody.get("active"));
        UserResponse response = superAdminService.toggleAdminStatus(id, active, superAdminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Administrator status updated", response));
    }

    @PutMapping("/admins/{id}/reset-password")
    @Operation(summary = "Reset an administrator's password")
    public ResponseEntity<ApiResponse<Void>> resetAdminPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordBody,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long superAdminId = resolveUserId(currentUser, authentication);
        String newPassword = passwordBody.get("password");
        superAdminService.resetAdminPassword(id, newPassword, superAdminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Administrator password reset successfully", null));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "View platform administrative audit trail")
    public ResponseEntity<ApiResponse<PageResponse<AdminAuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AdminAuditLogResponse> response = auditLogService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
