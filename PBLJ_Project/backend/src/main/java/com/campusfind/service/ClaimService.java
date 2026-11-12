package com.campusfind.service;

import com.campusfind.dto.request.ClaimCreateRequest;
import com.campusfind.dto.response.ClaimResponse;
import com.campusfind.dto.response.ItemImageResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.entity.Claim;
import com.campusfind.entity.ClaimImage;
import com.campusfind.entity.ItemReport;
import com.campusfind.entity.User;
import com.campusfind.enums.ClaimStatus;
import com.campusfind.enums.NotificationType;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import com.campusfind.enums.Role;
import com.campusfind.exception.BadRequestException;
import com.campusfind.exception.ForbiddenException;
import com.campusfind.exception.ResourceNotFoundException;
import com.campusfind.repository.ClaimImageRepository;
import com.campusfind.repository.ClaimRepository;
import com.campusfind.repository.ItemReportRepository;
import com.campusfind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimImageRepository claimImageRepository;
    private final ItemReportRepository reportRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public ClaimResponse submitClaim(
            Long claimantId,
            ClaimCreateRequest request,
            List<MultipartFile> proofImages
    ) {
        User claimant = userRepository.findById(claimantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + claimantId));

        ItemReport report = reportRepository.findById(request.getItemReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Item report not found with id: " + request.getItemReportId()));

        if (report.getReportType() != ReportType.FOUND) {
            throw new BadRequestException("Claims can only be filed against FOUND items");
        }

        if (report.getStatus() == ReportStatus.RECOVERED) {
            throw new BadRequestException("This item has already been marked as RECOVERED");
        }

        if (report.getStatus() == ReportStatus.REJECTED || report.getStatus() == ReportStatus.EXPIRED) {
            throw new BadRequestException("This item report is no longer active for claims");
        }

        if (report.getReporter().getId().equals(claimantId)) {
            throw new BadRequestException("You cannot submit an ownership claim on an item that you reported finding");
        }

        if (claimRepository.existsByItemReportIdAndClaimantId(report.getId(), claimantId)) {
            throw new BadRequestException("You have already submitted a claim for this item");
        }

        // Check if existing claims exist to detect dispute
        List<Claim> existingClaims = claimRepository.findByItemReportId(report.getId());
        boolean hasExistingClaims = !existingClaims.isEmpty();

        Claim claim = Claim.builder()
                .itemReport(report)
                .claimant(claimant)
                .explanation(request.getExplanation().trim())
                .identifyingDetails(request.getIdentifyingDetails().trim())
                .purchaseDetails(request.getPurchaseDetails() != null ? request.getPurchaseDetails().trim() : null)
                .status(ClaimStatus.PENDING)
                .build();

        Claim savedClaim = claimRepository.save(claim);

        // Upload supporting proof images
        if (proofImages != null && !proofImages.isEmpty()) {
            for (MultipartFile file : proofImages) {
                if (file != null && !file.isEmpty()) {
                    String storedName = fileStorageService.storeFile(file);
                    ClaimImage img = ClaimImage.builder()
                            .claim(savedClaim)
                            .fileName(storedName)
                            .filePath("uploads/" + storedName)
                            .contentType(file.getContentType())
                            .build();
                    claimImageRepository.save(img);
                    savedClaim.getImages().add(img);
                }
            }
        }

        // Update Item Report Status
        if (hasExistingClaims) {
            report.setStatus(ReportStatus.DISPUTED);
            // Mark all existing pending claims on this item with dispute flag awareness
            for (Claim c : existingClaims) {
                if (c.getStatus() == ClaimStatus.PENDING) {
                    c.setStatus(ClaimStatus.DISPUTED);
                    claimRepository.save(c);
                }
            }
            savedClaim.setStatus(ClaimStatus.DISPUTED);
            claimRepository.save(savedClaim);
        } else {
            report.setStatus(ReportStatus.CLAIM_PENDING);
        }
        reportRepository.save(report);

        // Notify Found-item Reporter
        notificationService.createNotification(
                report.getReporter(),
                "New Claim Submitted",
                String.format("A student has submitted an ownership claim on the item you found: '%s'. Admins will verify ownership.", report.getTitle()),
                NotificationType.CLAIM_SUBMITTED,
                "CLAIM",
                savedClaim.getId()
        );

        // Notify Claimant
        notificationService.createNotification(
                claimant,
                "Claim Received",
                String.format("Your ownership claim for '%s' has been received. Our administration team is reviewing your verification details.", report.getTitle()),
                NotificationType.CLAIM_SUBMITTED,
                "CLAIM",
                savedClaim.getId()
        );

        return mapToResponse(savedClaim, claimantId, false);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> getMyClaims(Long userId, Pageable pageable) {
        Page<Claim> page = claimRepository.findByClaimantIdOrderBySubmittedAtDesc(userId, pageable);
        return PageResponse.from(page.map(c -> mapToResponse(c, userId, false)));
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(Long claimId, Long currentUserId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN;
        boolean isClaimant = claim.getClaimant().getId().equals(currentUserId);
        boolean isReporter = claim.getItemReport().getReporter().getId().equals(currentUserId);

        if (!isAdmin && !isClaimant && !isReporter) {
            throw new ForbiddenException("You are not authorized to view this claim");
        }

        return mapToResponse(claim, currentUserId, isAdmin);
    }

    public ClaimResponse mapToResponse(Claim claim, Long currentUserId, boolean isAdmin) {
        List<Claim> allClaimsOnItem = claimRepository.findByItemReportId(claim.getItemReport().getId());
        boolean isDisputed = allClaimsOnItem.size() > 1 || claim.getStatus() == ClaimStatus.DISPUTED;

        String primaryImageUrl = claim.getItemReport().getImages().isEmpty() ? null :
                "/api/files/" + claim.getItemReport().getImages().get(0).getFileName();

        List<ItemImageResponse> proofImages = claim.getImages().stream()
                .map(img -> ItemImageResponse.builder()
                        .id(img.getId())
                        .fileName(img.getFileName())
                        .url("/api/files/" + img.getFileName())
                        .contentType(img.getContentType())
                        .uploadedAt(img.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        boolean isClaimant = currentUserId != null && claim.getClaimant().getId().equals(currentUserId);

        // Security check: only claimant or admin can see claimant's email and phone
        String claimantEmail = (isAdmin || isClaimant) ? claim.getClaimant().getEmail() : null;
        String claimantPhone = (isAdmin || isClaimant) ? claim.getClaimant().getPhoneNumber() : null;
        String claimantStudentId = (isAdmin || isClaimant) ? claim.getClaimant().getStudentId() : null;

        return ClaimResponse.builder()
                .id(claim.getId())
                .itemReportId(claim.getItemReport().getId())
                .itemTitle(claim.getItemReport().getTitle())
                .itemCategory(claim.getItemReport().getCategory())
                .itemLocation(claim.getItemReport().getLocation())
                .itemReportType(claim.getItemReport().getReportType())
                .itemPrimaryImageUrl(primaryImageUrl)
                .claimantId(claim.getClaimant().getId())
                .claimantName(claim.getClaimant().getFullName())
                .claimantEmail(claimantEmail)
                .claimantPhone(claimantPhone)
                .claimantStudentId(claimantStudentId)
                .explanation(claim.getExplanation())
                .identifyingDetails(claim.getIdentifyingDetails())
                .purchaseDetails(claim.getPurchaseDetails())
                .status(claim.getStatus())
                .adminNotes(claim.getAdminNotes())
                .reviewerId(claim.getReviewedBy() != null ? claim.getReviewedBy().getId() : null)
                .reviewerName(claim.getReviewedBy() != null ? claim.getReviewedBy().getFullName() : null)
                .images(proofImages)
                .submittedAt(claim.getSubmittedAt())
                .reviewedAt(claim.getReviewedAt())
                .dispute(isDisputed)
                .totalClaimsOnItem(allClaimsOnItem.size())
                .build();
    }
}
