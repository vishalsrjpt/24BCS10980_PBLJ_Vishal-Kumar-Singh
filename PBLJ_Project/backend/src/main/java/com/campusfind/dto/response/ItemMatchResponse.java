package com.campusfind.dto.response;

import com.campusfind.enums.ItemCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMatchResponse {
    private Long id;

    private Long lostReportId;
    private String lostTitle;
    private ItemCategory lostCategory;
    private String lostLocation;
    private String lostImageUrl;
    private Long lostReporterId;

    private Long foundReportId;
    private String foundTitle;
    private ItemCategory foundCategory;
    private String foundLocation;
    private String foundImageUrl;
    private Long foundReporterId;

    private Double similarityScore;
    private String matchReason;
    private String matchLevel; // "High Match" or "Possible Match"
    private OffsetDateTime createdAt;
}
