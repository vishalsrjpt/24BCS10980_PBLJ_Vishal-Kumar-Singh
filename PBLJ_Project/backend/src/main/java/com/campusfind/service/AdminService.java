package com.campusfind.service;

import com.campusfind.dto.request.ClaimReviewRequest;
import com.campusfind.dto.response.ClaimResponse;
import com.campusfind.dto.response.ItemReportResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.dto.response.PlatformStatisticsResponse;
import com.campusfind.entity.Claim;
import com.campusfind.entity.ItemReport;
import com.campusfind.entity.User;
import com.campusfind.enums.*;
import com.campusfind.exception.BadRequestException;
import com.campusfind.exception.ResourceNotFoundException;
import com.campusfind.repository.ClaimRepository;
import com.campusfind.repository.ItemReportRepository;
import com.campusfind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final ItemReportRepository reportRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ClaimService claimService;
    private final ItemReportService itemReportService;

    @Transactional(readOnly = true)
    public PageResponse<ItemReportResponse> getAllReports(
            ReportType type,
            ReportStatus status,
            Pageable pageable,
            Long adminId
    ) {
        Page<ItemReport> page;
        if (type != null && status != null) {
            page = reportRepository.findAll((root, query, cb) ->
                    cb.and(cb.equal(root.get("reportType"), type), cb.equal(root.get("status"), status)), pageable);
        } else if (type != null) {
            page = reportRepository.findAll((root, query, cb) -> cb.equal(root.get("reportType"), type), pageable);
        } else if (status != null) {
            page = reportRepository.findAll((root, query, cb) -> cb.equal(root.get("status"), status), pageable);
        } else {
            page = reportRepository.findAll(pageable);
        }

        return PageResponse.from(page.map(r -> itemReportService.mapToResponse(r, adminId, true)));
    }

    @Transactional
    public ItemReportResponse updateReportStatus(Long reportId, ReportStatus newStatus, Long adminId, String ipAddress) {
        ItemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(newStatus);
        ItemReport saved = reportRepository.save(report);

        auditLogService.logAction(
                admin,
                "UPDATE_REPORT_STATUS",
                "ItemReport",
                reportId,
                String.format("Status changed from %s to %s for report '%s'", oldStatus, newStatus, report.getTitle()),
                ipAddress
        );

        return itemReportService.mapToResponse(saved, adminId, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> getAllClaims(ClaimStatus status, Pageable pageable, Long adminId) {
        Page<Claim> page;
        if (status != null) {
            page = claimRepository.findByStatusOrderBySubmittedAtDesc(status, pageable);
        } else {
            page = claimRepository.findAllByOrderBySubmittedAtDesc(pageable);
        }
        return PageResponse.from(page.map(c -> claimService.mapToResponse(c, adminId, true)));
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> getDisputedClaims(Pageable pageable, Long adminId) {
        Page<Claim> page = claimRepository.findDisputedClaims(pageable);
        return PageResponse.from(page.map(c -> claimService.mapToResponse(c, adminId, true)));
    }

    @Transactional
    public ClaimResponse reviewClaim(Long claimId, ClaimReviewRequest request, Long adminId, String ipAddress) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        ItemReport report = claim.getItemReport();
        OffsetDateTime now = OffsetDateTime.now();

        if (request.getStatus() == ClaimStatus.APPROVED) {
            // Verify no other approved claim exists
            long approvedCount = claimRepository.countApprovedClaimsForReport(report.getId());
            if (approvedCount > 0) {
                throw new BadRequestException("An approved claim already exists for this item report");
            }

            // 1. Mark claim as APPROVED
            claim.setStatus(ClaimStatus.APPROVED);
            claim.setAdminNotes(request.getAdminNotes());
            claim.setReviewedBy(admin);
            claim.setReviewedAt(now);
            claimRepository.save(claim);

            // 2. Mark item as RECOVERED
            report.setStatus(ReportStatus.RECOVERED);
            report.setRecoveredAt(now);
            report.setRecoveredByClaimId(claim.getId());
            reportRepository.save(report);

            // 3. Reject any other competing claims on this item
            List<Claim> otherClaims = claimRepository.findOtherClaimsForReport(report.getId(), claim.getId());
            for (Claim other : otherClaims) {
                if (other.getStatus() == ClaimStatus.PENDING || other.getStatus() == ClaimStatus.DISPUTED || other.getStatus() == ClaimStatus.ADDITIONAL_INFO_REQUIRED) {
                    other.setStatus(ClaimStatus.REJECTED);
                    other.setAdminNotes("Another claim with verified ownership was approved for this item.");
                    other.setReviewedBy(admin);
                    other.setReviewedAt(now);
                    claimRepository.save(other);

                    notificationService.createNotification(
                            other.getClaimant(),
                            "Claim Not Approved",
                            String.format("Your claim for '%s' was not approved as another claimant provided verified proof of ownership.", report.getTitle()),
                            NotificationType.CLAIM_REJECTED,
                            "CLAIM",
                            other.getId()
                    );
                }
            }

            // 4. Notify winning Claimant
            notificationService.createNotification(
                    claim.getClaimant(),
                    "Claim Approved! Item Recovered",
                    String.format("Congratulations! Your claim for '%s' has been APPROVED. You may now retrieve your item from Campus Security with student ID.", report.getTitle()),
                    NotificationType.CLAIM_APPROVED,
                    "CLAIM",
                    claim.getId()
            );

            // 5. Notify Found-item Reporter
            notificationService.createNotification(
                    report.getReporter(),
                    "Item Successfully Recovered",
                    String.format("The item '%s' you reported finding has been claimed and verified by its rightful owner.", report.getTitle()),
                    NotificationType.ITEM_RECOVERED,
                    "ITEM",
                    report.getId()
            );

            auditLogService.logAction(
                    admin,
                    "APPROVE_CLAIM",
                    "Claim",
                    claim.getId(),
                    String.format("Approved claim %d for item %d ('%s'). Item marked RECOVERED.", claim.getId(), report.getId(), report.getTitle()),
                    ipAddress
            );

        } else if (request.getStatus() == ClaimStatus.REJECTED) {
            claim.setStatus(ClaimStatus.REJECTED);
            claim.setAdminNotes(request.getAdminNotes());
            claim.setReviewedBy(admin);
            claim.setReviewedAt(now);
            claimRepository.save(claim);

            // If no more pending/disputed claims, revert report to OPEN
            List<Claim> otherClaims = claimRepository.findOtherClaimsForReport(report.getId(), claim.getId());
            boolean hasOtherPending = otherClaims.stream().anyMatch(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.DISPUTED);
            if (!hasOtherPending && report.getStatus() != ReportStatus.RECOVERED) {
                report.setStatus(ReportStatus.OPEN);
                reportRepository.save(report);
            }

            notificationService.createNotification(
                    claim.getClaimant(),
                    "Claim Rejected",
                    String.format("Your claim for '%s' was reviewed and rejected. Admin Note: %s", report.getTitle(),
                            request.getAdminNotes() != null ? request.getAdminNotes() : "Proof provided was insufficient."),
                    NotificationType.CLAIM_REJECTED,
                    "CLAIM",
                    claim.getId()
            );

            auditLogService.logAction(
                    admin,
                    "REJECT_CLAIM",
                    "Claim",
                    claim.getId(),
                    String.format("Rejected claim %d for item %d ('%s'). Note: %s", claim.getId(), report.getId(), report.getTitle(), request.getAdminNotes()),
                    ipAddress
            );

        } else if (request.getStatus() == ClaimStatus.ADDITIONAL_INFO_REQUIRED) {
            claim.setStatus(ClaimStatus.ADDITIONAL_INFO_REQUIRED);
            claim.setAdminNotes(request.getAdminNotes());
            claim.setReviewedBy(admin);
            claim.setReviewedAt(now);
            claimRepository.save(claim);

            notificationService.createNotification(
                    claim.getClaimant(),
                    "Additional Information Requested",
                    String.format("The administrator reviewing your claim for '%s' requested more verification: %s", report.getTitle(), request.getAdminNotes()),
                    NotificationType.CLAIM_INFO_REQUESTED,
                    "CLAIM",
                    claim.getId()
            );

            auditLogService.logAction(
                    admin,
                    "REQUEST_MORE_INFO_CLAIM",
                    "Claim",
                    claim.getId(),
                    String.format("Requested more information on claim %d for item %d ('%s')", claim.getId(), report.getId(), report.getTitle()),
                    ipAddress
            );

        } else if (request.getStatus() == ClaimStatus.DISPUTED) {
            claim.setStatus(ClaimStatus.DISPUTED);
            claim.setAdminNotes(request.getAdminNotes());
            claim.setReviewedBy(admin);
            claim.setReviewedAt(now);
            claimRepository.save(claim);

            report.setStatus(ReportStatus.DISPUTED);
            reportRepository.save(report);

            notificationService.createNotification(
                    claim.getClaimant(),
                    "Claim Marked Disputed",
                    String.format("Your claim for '%s' is marked as disputed due to multiple claimants. A formal administrative review is in progress.", report.getTitle()),
                    NotificationType.DISPUTE_UPDATE,
                    "CLAIM",
                    claim.getId()
            );

            auditLogService.logAction(
                    admin,
                    "DISPUTE_CLAIM",
                    "Claim",
                    claim.getId(),
                    String.format("Marked claim %d as DISPUTED for item %d ('%s')", claim.getId(), report.getId(), report.getTitle()),
                    ipAddress
            );
        }

        return claimService.mapToResponse(claim, adminId, true);
    }

    @Transactional(readOnly = true)
    public PlatformStatisticsResponse getPlatformStatistics() {
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long totalLost = reportRepository.countByReportType(ReportType.LOST);
        long totalFound = reportRepository.countByReportType(ReportType.FOUND);
        long totalReports = totalLost + totalFound;
        long openReports = reportRepository.countByStatus(ReportStatus.OPEN);
        long pendingClaims = claimRepository.countByStatus(ClaimStatus.PENDING) + claimRepository.countByStatus(ClaimStatus.DISPUTED);
        long recoveredItems = reportRepository.countByStatus(ReportStatus.RECOVERED);
        long disputedClaims = claimRepository.countByStatus(ClaimStatus.DISPUTED);

        double recoveryRate = totalReports > 0 ? ((double) recoveredItems / totalReports) * 100.0 : 0.0;
        recoveryRate = Math.round(recoveryRate * 10.0) / 10.0;

        // Category breakdown
        Map<String, Long> categoryDistribution = new LinkedHashMap<>();
        for (Object[] row : reportRepository.countGroupByCategory()) {
            if (row[0] != null) {
                categoryDistribution.put(row[0].toString(), (Long) row[1]);
            }
        }

        // Monthly reports
        Map<String, Long> monthlyReports = new LinkedHashMap<>();
        for (Object[] row : reportRepository.countGroupByMonth()) {
            if (row[0] != null) {
                monthlyReports.put(row[0].toString(), (Long) row[1]);
            }
        }

        // Monthly recoveries
        Map<String, Long> monthlyRecoveries = new LinkedHashMap<>();
        for (Object[] row : reportRepository.countRecoveriesGroupByMonth()) {
            if (row[0] != null) {
                monthlyRecoveries.put(row[0].toString(), (Long) row[1]);
            }
        }

        return PlatformStatisticsResponse.builder()
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .totalLostReports(totalLost)
                .totalFoundReports(totalFound)
                .totalReports(totalReports)
                .openReports(openReports)
                .pendingClaims(pendingClaims)
                .recoveredItems(recoveredItems)
                .disputedClaims(disputedClaims)
                .recoveryRate(recoveryRate)
                .categoryDistribution(categoryDistribution)
                .monthlyReports(monthlyReports)
                .monthlyRecoveries(monthlyRecoveries)
                .build();
    }
}
