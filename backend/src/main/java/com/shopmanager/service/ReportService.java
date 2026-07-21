package com.shopmanager.service;

import com.shopmanager.dto.ReportItemDTO;
import com.shopmanager.repository.SaleAggregationRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ReportService {

    private final SaleAggregationRepository saleAggregationRepository;

    public ReportService(SaleAggregationRepository saleAggregationRepository) {
        this.saleAggregationRepository = saleAggregationRepository;
    }

    public List<ReportItemDTO> getReport(LocalDate start, LocalDate end) {
        return saleAggregationRepository.findReportBetween(start, end);
    }

    public List<ReportItemDTO> getDailyReport(LocalDate date) {
        return getReport(date, date);
    }

    public List<ReportItemDTO> getWeeklyReport() {
        LocalDate today = LocalDate.now();
        return getReport(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), today);
    }

    public List<ReportItemDTO> getMonthlyReport() {
        LocalDate today = LocalDate.now();
        return getReport(today.with(TemporalAdjusters.firstDayOfMonth()), today);
    }

    public List<ReportItemDTO> getCustomReport(LocalDate start, LocalDate end) {
        return getReport(start, end);
    }
}
