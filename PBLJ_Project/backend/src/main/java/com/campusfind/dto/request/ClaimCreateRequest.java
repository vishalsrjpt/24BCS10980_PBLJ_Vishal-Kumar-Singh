package com.campusfind.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClaimCreateRequest {

    @NotNull(message = "Item report ID is required")
    private Long itemReportId;

    @NotBlank(message = "Explanation is required")
    @Size(min = 10, max = 2000, message = "Explanation must be between 10 and 2000 characters")
    private String explanation;

    @NotBlank(message = "Unique identifying details are required")
    @Size(min = 5, max = 2000, message = "Identifying details must be provided")
    private String identifyingDetails;

    private String purchaseDetails;
}
