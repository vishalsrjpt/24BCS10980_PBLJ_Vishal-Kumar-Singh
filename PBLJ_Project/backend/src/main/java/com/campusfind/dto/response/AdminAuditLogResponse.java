package com.campusfind.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogResponse {
    private Long id;
    private Long adminId;
    private String adminName;
    private String adminEmail;
    private String action;
    private String targetType;
    private Long targetId;
    private String details;
    private String ipAddress;
    private OffsetDateTime createdAt;
}
