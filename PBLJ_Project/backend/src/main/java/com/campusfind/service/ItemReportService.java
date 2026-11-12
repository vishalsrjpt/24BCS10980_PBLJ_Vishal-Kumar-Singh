package com.campusfind.service;

import com.campusfind.dto.request.ItemReportCreateRequest;
import com.campusfind.dto.request.ItemReportUpdateRequest;
import com.campusfind.dto.response.ItemImageResponse;
import com.campusfind.dto.response.ItemReportResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.entity.ItemImage;
import com.campusfind.entity.ItemReport;
import com.campusfind.entity.User;
import com.campusfind.enums.ItemCategory;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import com.campusfind.enums.Role;
import com.campusfind.exception.BadRequestException;
import com.campusfind.exception.ForbiddenException;
import com.campusfind.exception.ResourceNotFoundException;
import com.campusfind.repository.ClaimRepository;
import com.campusfind.repository.ItemImageRepository;
import com.campusfind.repository.ItemReportRepository;
import com.campusfind.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemReportService {

    private final ItemReportRepository reportRepository;
    private final ItemImageRepository imageRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final FileStorageService fileStorageService;
    private final SmartMatchingService smartMatchingService;

    @Transactional
    public ItemReportResponse createReport(
            Long reporterId,
            ItemReportCreateRequest request,
            List<MultipartFile> imageFiles
    ) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + reporterId));

        ItemReport report = ItemReport.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .reportType(request.getReportType())
                .category(request.getCategory())
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .brand(request.getBrand() != null ? request.getBrand().trim() : null)
                .location(request.getLocation().trim())
                .eventDate(request.getEventDate())
                .status(ReportStatus.OPEN)
                .reporter(reporter)
                .identifyingDetails(request.getIdentifyingDetails())
                .additionalNotes(request.getAdditionalNotes())
                .build();

        ItemReport saved = reportRepository.save(report);

        // Process images
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile file : imageFiles) {
                if (file != null && !file.isEmpty()) {
                    String storedName = fileStorageService.storeFile(file);
                    ItemImage image = ItemImage.builder()
                            .itemReport(saved)
                            .fileName(storedName)
                            .filePath("uploads/" + storedName)
                            .contentType(file.getContentType())
                            .fileSize(file.getSize())
                            .build();
                    imageRepository.save(image);
                    saved.getImages().add(image);
                }
            }
        }

        // Run smart matching in background or synchronously
        try {
            smartMatchingService.findAndSaveMatches(saved);
        } catch (Exception ex) {
            log.error("Error during smart matching calculation: {}", ex.getMessage());
        }

        return mapToResponse(saved, reporterId, false);
    }

    @Transactional
    public ItemReportResponse updateReport(
            Long currentUserId,
            Long reportId,
            ItemReportUpdateRequest request,
            List<MultipartFile> newImages
    ) {
        ItemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Item report not found with id: " + reportId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN;
        boolean isOwner = report.getReporter().getId().equals(currentUserId);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to update this report");
        }

        if (report.getStatus() == ReportStatus.RECOVERED) {
            throw new BadRequestException("Recovered reports cannot be modified");
        }

        report.setTitle(request.getTitle().trim());
        report.setDescription(request.getDescription().trim());
        report.setCategory(request.getCategory());
        report.setColor(request.getColor() != null ? request.getColor().trim() : null);
        report.setBrand(request.getBrand() != null ? request.getBrand().trim() : null);
        report.setLocation(request.getLocation().trim());
        report.setEventDate(request.getEventDate());
        report.setIdentifyingDetails(request.getIdentifyingDetails());
        report.setAdditionalNotes(request.getAdditionalNotes());

        if (newImages != null && !newImages.isEmpty()) {
            for (MultipartFile file : newImages) {
                if (file != null && !file.isEmpty()) {
                    String storedName = fileStorageService.storeFile(file);
                    ItemImage image = ItemImage.builder()
                            .itemReport(report)
                            .fileName(storedName)
                            .filePath("uploads/" + storedName)
                            .contentType(file.getContentType())
                            .fileSize(file.getSize())
                            .build();
                    imageRepository.save(image);
                    report.getImages().add(image);
                }
            }
        }

        ItemReport updated = reportRepository.save(report);

        // Re-run matching on updated details
        try {
            smartMatchingService.findAndSaveMatches(updated);
        } catch (Exception ex) {
            log.error("Error during match recalculation: {}", ex.getMessage());
        }

        return mapToResponse(updated, currentUserId, isAdmin);
    }

    @Transactional
    public void deleteReport(Long currentUserId, Long reportId) {
        ItemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Item report not found with id: " + reportId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN;
        boolean isOwner = report.getReporter().getId().equals(currentUserId);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to delete this report");
        }

        if (report.getStatus() == ReportStatus.RECOVERED) {
            throw new BadRequestException("Recovered reports cannot be deleted");
        }

        // Delete physical image files
        for (ItemImage img : report.getImages()) {
            fileStorageService.deleteFile(img.getFileName());
        }

        reportRepository.delete(report);
    }

    @Transactional(readOnly = true)
    public ItemReportResponse getReportById(Long reportId, Long currentUserId) {
        ItemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Item report not found with id: " + reportId));

        boolean isAdmin = false;
        if (currentUserId != null) {
            userRepository.findById(currentUserId).ifPresent(u -> {
                // check if admin
            });
            User user = userRepository.findById(currentUserId).orElse(null);
            if (user != null && (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPERADMIN)) {
                isAdmin = true;
            }
        }

        return mapToResponse(report, currentUserId, isAdmin);
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemReportResponse> searchReports(
            String keyword,
            ItemCategory category,
            String location,
            OffsetDateTime fromDate,
            OffsetDateTime toDate,
            ReportType reportType,
            ReportStatus status,
            Pageable pageable,
            Long currentUserId
    ) {
        Specification<ItemReport> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String term = "%" + keyword.toLowerCase().trim() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("title")), term);
                Predicate descPred = cb.like(cb.lower(root.get("description")), term);
                Predicate brandPred = cb.like(cb.lower(root.get("brand")), term);
                Predicate colorPred = cb.like(cb.lower(root.get("color")), term);
                predicates.add(cb.or(titlePred, descPred, brandPred, colorPred));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (StringUtils.hasText(location)) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase().trim() + "%"));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventDate"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("eventDate"), toDate));
            }

            if (reportType != null) {
                predicates.add(cb.equal(root.get("reportType"), reportType));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ItemReport> page = reportRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(r -> mapToResponse(r, currentUserId, false)));
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemReportResponse> getMyReports(Long userId, Pageable pageable) {
        Page<ItemReport> page = reportRepository.findByReporterIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.from(page.map(r -> mapToResponse(r, userId, false)));
    }

    public ItemReportResponse mapToResponse(ItemReport report, Long currentUserId, boolean isAdmin) {
        boolean isReporter = currentUserId != null && report.getReporter().getId().equals(currentUserId);

        // Security: hide sensitive identifying details if caller is not the reporter and not an admin
        String safeIdentifyingDetails = null;
        if (isReporter || isAdmin) {
            safeIdentifyingDetails = report.getIdentifyingDetails();
        }

        boolean canClaim = false;
        boolean hasClaimed = false;

        if (currentUserId != null && !isReporter && report.getReportType() == ReportType.FOUND &&
                (report.getStatus() == ReportStatus.OPEN || report.getStatus() == ReportStatus.CLAIM_PENDING || report.getStatus() == ReportStatus.DISPUTED)) {
            hasClaimed = claimRepository.existsByItemReportIdAndClaimantId(report.getId(), currentUserId);
            canClaim = !hasClaimed;
        }

        long claimsCount = 0;
        if (isAdmin || isReporter) {
            claimsCount = claimRepository.findByItemReportId(report.getId()).size();
        }

        List<ItemImageResponse> images = report.getImages().stream()
                .map(img -> ItemImageResponse.builder()
                        .id(img.getId())
                        .fileName(img.getFileName())
                        .url("/api/files/" + img.getFileName())
                        .contentType(img.getContentType())
                        .fileSize(img.getFileSize())
                        .uploadedAt(img.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        return ItemReportResponse.builder()
                .id(report.getId())
                .title(report.getTitle())
                .description(report.getDescription())
                .reportType(report.getReportType())
                .category(report.getCategory())
                .color(report.getColor())
                .brand(report.getBrand())
                .location(report.getLocation())
                .eventDate(report.getEventDate())
                .status(report.getStatus())
                .reporterName(report.getReporter().getFullName())
                .reporterId(report.getReporter().getId())
                .identifyingDetails(safeIdentifyingDetails)
                .additionalNotes(report.getAdditionalNotes())
                .recoveredAt(report.getRecoveredAt())
                .recoveredByClaimId(report.getRecoveredByClaimId())
                .images(images)
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .canClaim(canClaim)
                .hasClaimed(hasClaimed)
                .claimsCount(claimsCount)
                .build();
    }
}
