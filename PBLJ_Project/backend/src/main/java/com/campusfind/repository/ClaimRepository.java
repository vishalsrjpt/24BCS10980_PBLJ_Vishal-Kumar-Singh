package com.campusfind.repository;

import com.campusfind.entity.Claim;
import com.campusfind.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    Page<Claim> findByClaimantIdOrderBySubmittedAtDesc(Long claimantId, Pageable pageable);

    List<Claim> findByItemReportId(Long itemReportId);

    long countByClaimantId(Long claimantId);

    long countByClaimantIdAndStatus(Long claimantId, ClaimStatus status);

    long countByStatus(ClaimStatus status);

    boolean existsByItemReportIdAndClaimantId(Long itemReportId, Long claimantId);

    @Query("SELECT COUNT(c) FROM Claim c WHERE c.itemReport.id = :reportId AND c.status = 'APPROVED'")
    long countApprovedClaimsForReport(@Param("reportId") Long reportId);

    @Query("SELECT c FROM Claim c WHERE c.itemReport.id = :reportId AND c.id != :excludedClaimId")
    List<Claim> findOtherClaimsForReport(@Param("reportId") Long reportId, @Param("excludedClaimId") Long excludedClaimId);

    Page<Claim> findAllByOrderBySubmittedAtDesc(Pageable pageable);

    Page<Claim> findByStatusOrderBySubmittedAtDesc(ClaimStatus status, Pageable pageable);

    @Query("SELECT c FROM Claim c WHERE c.status = 'DISPUTED' OR c.itemReport.id IN (SELECT c2.itemReport.id FROM Claim c2 GROUP BY c2.itemReport.id HAVING COUNT(c2) > 1)")
    Page<Claim> findDisputedClaims(Pageable pageable);
}
