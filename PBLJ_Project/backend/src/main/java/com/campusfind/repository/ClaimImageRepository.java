package com.campusfind.repository;

import com.campusfind.entity.ClaimImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimImageRepository extends JpaRepository<ClaimImage, Long> {
    List<ClaimImage> findByClaimId(Long claimId);
}
