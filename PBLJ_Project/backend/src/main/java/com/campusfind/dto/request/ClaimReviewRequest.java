package com.campusfind.dto.request;

import com.campusfind.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimReviewRequest {

    @NotNull(message = "Review status is required")
    private ClaimStatus status;

    private String adminNotes;
}
