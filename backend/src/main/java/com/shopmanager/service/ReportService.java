package com.shopmanager.service;

import com.shopmanager.dto.ReportItemDTO;
import com.shopmanager.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final SaleRepository saleRepository;

    public ReportService(SaleRepository saleRepository) {
        this.saleRepository = saleRepository;
    }

    public List<ReportItemDTO> getReport(LocalDate start, LocalDate end) {
        List<Object[]> rows = saleRepository.findReportBetween(start, end);
        return rows.stream().map(r -> new ReportItemDTO(
                (String)  r[0],                           // itemName
                (BigDecimal) r[1],                        // totalKg (SUM quantityKg)
                ((Number) r[2]).longValue(),               // transactions (COUNT)
                (BigDecimal) r[3]                         // revenue (SUM totalPrice)
        )).collect(Collectors.toList());
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
