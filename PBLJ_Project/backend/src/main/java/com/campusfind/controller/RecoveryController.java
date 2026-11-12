package com.campusfind.controller;

import com.campusfind.dto.response.ApiResponse;
import com.campusfind.dto.response.ItemReportResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.dto.response.PlatformStatisticsResponse;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.AdminService;
import com.campusfind.service.RecoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recovery")
@RequiredArgsConstructor
@Tag(name = "Recovery History", description = "Endpoints for recovered item archives and recovery statistics")
public class RecoveryController {

    private final RecoveryService recoveryService;
    private final AdminService adminService;

    @GetMapping("/my-history")
    @Operation(summary = "Get current student's recovered items history")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> getMyRecoveryHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ItemReportResponse> response = recoveryService.getStudentRecoveryHistory(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Get platform-wide recovered items history (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> getAllRecoveryHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ItemReportResponse> response = recoveryService.getAllRecoveryHistory(pageable, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform recovery statistics and rates")
    public ResponseEntity<ApiResponse<PlatformStatisticsResponse>> getRecoveryStats() {
        PlatformStatisticsResponse stats = adminService.getPlatformStatistics();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
