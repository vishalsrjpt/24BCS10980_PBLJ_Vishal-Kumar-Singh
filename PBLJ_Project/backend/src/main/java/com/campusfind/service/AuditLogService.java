package com.campusfind.service;

import com.campusfind.dto.response.AdminAuditLogResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.entity.AdminAuditLog;
import com.campusfind.entity.User;
import com.campusfind.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AdminAuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(User admin, String action, String targetType, Long targetId, String details, String ipAddress) {
        try {
            AdminAuditLog logEntry = AdminAuditLog.builder()
                    .admin(admin)
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.error("Failed to record audit log: {}", ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminAuditLogResponse> getAuditLogs(Pageable pageable) {
        Page<AdminAuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    public AdminAuditLogResponse mapToResponse(AdminAuditLog log) {
        return AdminAuditLogResponse.builder()
                .id(log.getId())
                .adminId(log.getAdmin().getId())
                .adminName(log.getAdmin().getFullName())
                .adminEmail(log.getAdmin().getEmail())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
