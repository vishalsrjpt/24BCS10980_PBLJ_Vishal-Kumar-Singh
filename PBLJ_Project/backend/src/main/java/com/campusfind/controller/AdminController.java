package com.campusfind.controller;

import com.campusfind.dto.request.ClaimReviewRequest;
import com.campusfind.dto.response.*;
import com.campusfind.entity.User;
import com.campusfind.enums.ClaimStatus;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import com.campusfind.repository.UserRepository;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.AdminService;
import com.campusfind.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Administration operations for reports, claim verification, disputes, and analytics")
public class AdminController {

    private final AdminService adminService;
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

    @GetMapping("/dashboard")
    @Operation(summary = "Get administrator dashboard metrics, analytics, and distributions")
    public ResponseEntity<ApiResponse<PlatformStatisticsResponse>> getDashboard() {
        PlatformStatisticsResponse stats = adminService.getPlatformStatistics();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/reports")
    @Operation(summary = "List all platform reports with admin filtering and status controls")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> getReports(
            @RequestParam(required = false) ReportType type,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        PageResponse<ItemReportResponse> response = adminService.getAllReports(type, status, pageable, adminId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/reports/{id}/status")
    @Operation(summary = "Update an item report's operational status")
    public ResponseEntity<ApiResponse<ItemReportResponse>> updateReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusBody,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ReportStatus newStatus = ReportStatus.valueOf(statusBody.get("status"));
        ItemReportResponse response = adminService.updateReportStatus(id, newStatus, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Report status updated", response));
    }

    @GetMapping("/claims")
    @Operation(summary = "List all submitted claims with verification filter")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> getClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ClaimResponse> response = adminService.getAllClaims(status, pageable, adminId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/disputes")
    @Operation(summary = "List disputed claims with competing claimants")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> getDisputedClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ClaimResponse> response = adminService.getDisputedClaims(pageable, adminId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/claims/{id}/review")
    @Operation(summary = "Review a claim (approve, reject, request additional info, or dispute)")
    public ResponseEntity<ApiResponse<ClaimResponse>> reviewClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimReviewRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ClaimResponse response = adminService.reviewClaim(id, request, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Claim reviewed successfully", response));
    }

    @PutMapping("/claims/{id}/approve")
    @Operation(summary = "Approve a verified claim and recover item")
    public ResponseEntity<ApiResponse<ClaimResponse>> approveClaim(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ClaimReviewRequest req = new ClaimReviewRequest();
        req.setStatus(ClaimStatus.APPROVED);
        req.setAdminNotes(notes != null ? notes.get("adminNotes") : "Claim verified and approved by administrator.");
        ClaimResponse response = adminService.reviewClaim(id, req, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Claim approved and item marked recovered", response));
    }

    @PutMapping("/claims/{id}/reject")
    @Operation(summary = "Reject an invalid claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> rejectClaim(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ClaimReviewRequest req = new ClaimReviewRequest();
        req.setStatus(ClaimStatus.REJECTED);
        req.setAdminNotes(notes != null ? notes.get("adminNotes") : "Claim verification failed.");
        ClaimResponse response = adminService.reviewClaim(id, req, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Claim rejected", response));
    }

    @PutMapping("/claims/{id}/request-info")
    @Operation(summary = "Request additional verification details from claimant")
    public ResponseEntity<ApiResponse<ClaimResponse>> requestAdditionalInfo(
            @PathVariable Long id,
            @RequestBody Map<String, String> notes,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ClaimReviewRequest req = new ClaimReviewRequest();
        req.setStatus(ClaimStatus.ADDITIONAL_INFO_REQUIRED);
        req.setAdminNotes(notes.get("adminNotes"));
        ClaimResponse response = adminService.reviewClaim(id, req, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Additional information requested from claimant", response));
    }

    @PutMapping("/claims/{id}/dispute")
    @Operation(summary = "Mark claim as disputed")
    public ResponseEntity<ApiResponse<ClaimResponse>> disputeClaim(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        Long adminId = resolveUserId(currentUser, authentication);
        ClaimReviewRequest req = new ClaimReviewRequest();
        req.setStatus(ClaimStatus.DISPUTED);
        req.setAdminNotes(notes != null ? notes.get("adminNotes") : "Claim marked as disputed.");
        ClaimResponse response = adminService.reviewClaim(id, req, adminId, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Claim marked as disputed", response));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get administrator actions audit trail")
    public ResponseEntity<ApiResponse<PageResponse<AdminAuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AdminAuditLogResponse> response = auditLogService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
