package com.campusfind.dto.response;

import com.campusfind.enums.ClaimStatus;
import com.campusfind.enums.ItemCategory;
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
public class ClaimResponse {
    private Long id;
    private Long itemReportId;
    private String itemTitle;
    private ItemCategory itemCategory;
    private String itemLocation;
    private ReportType itemReportType;
    private String itemPrimaryImageUrl;
    private Long claimantId;
    private String claimantName;
    private String claimantEmail;
    private String claimantPhone;
    private String claimantStudentId;
    private String explanation;
    private String identifyingDetails;
    private String purchaseDetails;
    private ClaimStatus status;
    private String adminNotes;
    private Long reviewerId;
    private String reviewerName;
    private List<ItemImageResponse> images;
    private OffsetDateTime submittedAt;
    private OffsetDateTime reviewedAt;
    private boolean dispute;
    private long totalClaimsOnItem;
}
