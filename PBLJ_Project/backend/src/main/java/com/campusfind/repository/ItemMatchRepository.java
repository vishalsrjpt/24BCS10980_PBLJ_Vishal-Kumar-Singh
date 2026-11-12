package com.campusfind.repository;

import com.campusfind.entity.ItemMatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemMatchRepository extends JpaRepository<ItemMatch, Long> {

    Optional<ItemMatch> findByLostReportIdAndFoundReportId(Long lostReportId, Long foundReportId);

    boolean existsByLostReportIdAndFoundReportId(Long lostReportId, Long foundReportId);

    @Query("SELECT m FROM ItemMatch m WHERE m.lostReport.id = :itemId OR m.foundReport.id = :itemId ORDER BY m.similarityScore DESC")
    List<ItemMatch> findMatchesForItem(@Param("itemId") Long itemId);

    @Query("SELECT m FROM ItemMatch m WHERE m.lostReport.reporter.id = :userId OR m.foundReport.reporter.id = :userId ORDER BY m.similarityScore DESC")
    Page<ItemMatch> findMatchesForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT m FROM ItemMatch m WHERE m.lostReport.reporter.id = :userId OR m.foundReport.reporter.id = :userId ORDER BY m.similarityScore DESC")
    List<ItemMatch> findTopMatchesForUser(@Param("userId") Long userId, Pageable pageable);
}
