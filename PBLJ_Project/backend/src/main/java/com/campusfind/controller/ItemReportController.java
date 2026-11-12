package com.campusfind.controller;

import com.campusfind.dto.request.ItemReportCreateRequest;
import com.campusfind.dto.request.ItemReportUpdateRequest;
import com.campusfind.dto.response.ApiResponse;
import com.campusfind.dto.response.ItemReportResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.enums.ItemCategory;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.ItemReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Tag(name = "Item Reports", description = "Endpoints for lost & found item reports, searches, and updates")
public class ItemReportController {

    private final ItemReportService itemReportService;

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @Operation(summary = "Create a new Lost or Found item report with optional photographs")
    public ResponseEntity<ApiResponse<ItemReportResponse>> createReport(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestPart("report") ItemReportCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        ItemReportResponse response = itemReportService.createReport(currentUser.getId(), request, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item report submitted successfully", response));
    }

    @GetMapping
    @Operation(summary = "Browse public item reports with pagination and sorting")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> browseItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Long userId = currentUser != null ? currentUser.getId() : null;

        PageResponse<ItemReportResponse> response = itemReportService.searchReports(
                null, null, null, null, null, null, null, pageable, userId
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter item reports across all attributes")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> searchItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ItemCategory category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
            @RequestParam(required = false) ReportType reportType,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Long userId = currentUser != null ? currentUser.getId() : null;

        PageResponse<ItemReportResponse> response = itemReportService.searchReports(
                keyword, category, location, fromDate, toDate, reportType, status, pageable, userId
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full details of a specific item report")
    public ResponseEntity<ApiResponse<ItemReportResponse>> getItemById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        ItemReportResponse response = itemReportService.getReportById(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my-reports")
    @Operation(summary = "Get reports created by the currently authenticated student")
    public ResponseEntity<ApiResponse<PageResponse<ItemReportResponse>>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ItemReportResponse> response = itemReportService.getMyReports(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @Operation(summary = "Update an existing item report owned by the user")
    public ResponseEntity<ApiResponse<ItemReportResponse>> updateReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestPart("report") ItemReportUpdateRequest request,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages
    ) {
        ItemReportResponse response = itemReportService.updateReport(currentUser.getId(), id, request, newImages);
        return ResponseEntity.ok(ApiResponse.ok("Report updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an item report owned by the user")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        itemReportService.deleteReport(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully", null));
    }
}
