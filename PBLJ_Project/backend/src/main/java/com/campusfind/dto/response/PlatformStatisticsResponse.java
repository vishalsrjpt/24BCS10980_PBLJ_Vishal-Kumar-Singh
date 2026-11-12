package com.campusfind.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatisticsResponse {
    private long totalStudents;
    private long totalAdmins;
    private long totalLostReports;
    private long totalFoundReports;
    private long totalReports;
    private long openReports;
    private long pendingClaims;
    private long recoveredItems;
    private long disputedClaims;
    private double recoveryRate;
    private Map<String, Long> categoryDistribution;
    private Map<String, Long> monthlyReports;
    private Map<String, Long> monthlyRecoveries;
}
