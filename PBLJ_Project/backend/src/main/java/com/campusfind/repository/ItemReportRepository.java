package com.campusfind.repository;

import com.campusfind.entity.ItemReport;
import com.campusfind.enums.ItemCategory;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ItemReportRepository extends JpaRepository<ItemReport, Long>, JpaSpecificationExecutor<ItemReport> {

    Page<ItemReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId, Pageable pageable);

    List<ItemReport> findByReporterIdAndReportType(Long reporterId, ReportType reportType);

    long countByReporterIdAndReportType(Long reporterId, ReportType reportType);

    long countByReporterIdAndStatus(Long reporterId, ReportStatus status);

    long countByReportType(ReportType reportType);

    long countByStatus(ReportStatus status);

    @Query("SELECT r.category, COUNT(r) FROM ItemReport r GROUP BY r.category")
    List<Object[]> countGroupByCategory();

    @Query("SELECT FUNCTION('to_char', r.createdAt, 'YYYY-MM') as month, COUNT(r) FROM ItemReport r GROUP BY month ORDER BY month DESC")
    List<Object[]> countGroupByMonth();

    @Query("SELECT FUNCTION('to_char', r.recoveredAt, 'YYYY-MM') as month, COUNT(r) FROM ItemReport r WHERE r.status = 'RECOVERED' AND r.recoveredAt IS NOT NULL GROUP BY month ORDER BY month DESC")
    List<Object[]> countRecoveriesGroupByMonth();

    List<ItemReport> findByReportTypeAndStatus(ReportType reportType, ReportStatus status);

    @Query("SELECT r FROM ItemReport r WHERE r.status = 'RECOVERED' AND (r.reporter.id = :userId OR r.recoveredByClaimId IN (SELECT c.id FROM Claim c WHERE c.claimant.id = :userId)) ORDER BY r.recoveredAt DESC")
    Page<ItemReport> findUserRecoveryHistory(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT r FROM ItemReport r WHERE r.status = 'RECOVERED' ORDER BY r.recoveredAt DESC")
    Page<ItemReport> findAllRecoveryHistory(Pageable pageable);

    @Query("SELECT r FROM ItemReport r WHERE r.reportType = :oppositeType AND r.status = 'OPEN' AND r.id != :excludedId")
    List<ItemReport> findCandidateMatches(@Param("oppositeType") ReportType oppositeType, @Param("excludedId") Long excludedId);
}
