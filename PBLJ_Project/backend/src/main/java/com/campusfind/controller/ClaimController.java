package com.campusfind.controller;

import com.campusfind.dto.request.ClaimCreateRequest;
import com.campusfind.dto.response.ApiResponse;
import com.campusfind.dto.response.ClaimResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Endpoints for submitting and viewing item ownership claims")
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @Operation(summary = "Submit an ownership claim for a found item with proof images")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitClaim(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestPart("claim") ClaimCreateRequest request,
            @RequestPart(value = "proofImages", required = false) List<MultipartFile> proofImages
    ) {
        ClaimResponse response = claimService.submitClaim(currentUser.getId(), request, proofImages);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Ownership claim submitted for review", response));
    }

    @GetMapping("/my-claims")
    @Operation(summary = "Get all claims submitted by the current authenticated student")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> getMyClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"));
        PageResponse<ClaimResponse> response = claimService.getMyClaims(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get details of a specific claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaimById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ClaimResponse response = claimService.getClaimById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
