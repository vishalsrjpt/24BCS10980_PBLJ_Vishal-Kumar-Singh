package com.campusfind.service;

import com.campusfind.dto.response.ItemReportResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.entity.ItemReport;
import com.campusfind.repository.ItemReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final ItemReportRepository reportRepository;
    private final ItemReportService itemReportService;

    @Transactional(readOnly = true)
    public PageResponse<ItemReportResponse> getStudentRecoveryHistory(Long studentId, Pageable pageable) {
        Page<ItemReport> page = reportRepository.findUserRecoveryHistory(studentId, pageable);
        return PageResponse.from(page.map(r -> itemReportService.mapToResponse(r, studentId, false)));
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemReportResponse> getAllRecoveryHistory(Pageable pageable, Long adminId) {
        Page<ItemReport> page = reportRepository.findAllRecoveryHistory(pageable);
        return PageResponse.from(page.map(r -> itemReportService.mapToResponse(r, adminId, true)));
    }
}
