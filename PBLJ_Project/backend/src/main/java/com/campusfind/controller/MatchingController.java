package com.campusfind.controller;

import com.campusfind.dto.response.ApiResponse;
import com.campusfind.dto.response.ItemMatchResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.security.UserPrincipal;
import com.campusfind.service.SmartMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@Tag(name = "Smart Matching", description = "Endpoints for intelligent similarity matches between Lost & Found reports")
public class MatchingController {

    private final SmartMatchingService matchingService;

    @GetMapping("/my-matches")
    @Operation(summary = "Get paginated potential matches for reports created by the current user")
    public ResponseEntity<ApiResponse<PageResponse<ItemMatchResponse>>> getMyMatches(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<ItemMatchResponse> response = matchingService.getMatchesForUser(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/top")
    @Operation(summary = "Get top 5 highest matching items for the current user's dashboard")
    public ResponseEntity<ApiResponse<List<ItemMatchResponse>>> getTopMatches(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<ItemMatchResponse> response = matchingService.getTopMatchesForUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/item/{itemId}")
    @Operation(summary = "Get all calculated similarity matches for a specific item report")
    public ResponseEntity<ApiResponse<List<ItemMatchResponse>>> getMatchesForItem(
            @PathVariable Long itemId
    ) {
        List<ItemMatchResponse> response = matchingService.getMatchesForItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
