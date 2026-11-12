package com.campusfind.dto.response;

import com.campusfind.enums.ItemCategory;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemReportResponse {
    private Long id;
    private String title;
    private String description;
    private ReportType reportType;
    private ItemCategory category;
    private String color;
    private String brand;
    private String location;
    private OffsetDateTime eventDate;
    private ReportStatus status;
    private String reporterName;
    private Long reporterId;
    private String identifyingDetails;
    private String additionalNotes;
    private OffsetDateTime recoveredAt;
    private Long recoveredByClaimId;
    private List<ItemImageResponse> images;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private boolean canClaim;
    private boolean hasClaimed;
    private long claimsCount;
}
