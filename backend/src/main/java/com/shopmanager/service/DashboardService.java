package com.shopmanager.service;

import com.shopmanager.dto.DashboardDTO;
import com.shopmanager.dto.ReportItemDTO;
import com.shopmanager.dto.SaleDTO;
import com.shopmanager.repository.SaleAggregationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final SaleAggregationRepository saleAggregationRepository;
    private final SaleService saleService;

    public DashboardService(SaleAggregationRepository saleAggregationRepository,
                            SaleService saleService) {
        this.saleAggregationRepository = saleAggregationRepository;
        this.saleService = saleService;
    }

    /** Default: today's stats */
    public DashboardDTO getDashboardStats() {
        LocalDate today = LocalDate.now();
        return getStatsForRange(today, today, "Today");
    }

    /** Date-range stats (Yesterday, This Week, This Month, Custom) */
    public DashboardDTO getStatsForRange(LocalDate start, LocalDate end, String label) {

        // ── Aggregates ────────────────────────────────────────────────────────
        BigDecimal revenue      = saleAggregationRepository.sumTotalBetween(start, end).orElse(BigDecimal.ZERO);
        BigDecimal kgSold       = saleAggregationRepository.sumQuantityKgBetween(start, end).orElse(BigDecimal.ZERO);
        Long transactions       = saleAggregationRepository.countBetween(start, end);

        // ── Top items (KG) ────────────────────────────────────────────────────
        List<ReportItemDTO> topItems = saleAggregationRepository.findTopItemsBetween(start, end);

        // ── Most sold by KG ───────────────────────────────────────────────────
        String mostSoldItem = topItems.isEmpty() ? "N/A" : topItems.get(0).getItemName();

        // ── Highest revenue item ──────────────────────────────────────────────
        String highestRevenueItem = topItems.stream()
                .max((a, b) -> a.getRevenue().compareTo(b.getRevenue()))
                .map(ReportItemDTO::getItemName)
                .orElse("N/A");

        // ── Recent 10 sales (today only — for sidebar list) ───────────────────
        List<SaleDTO> recentSales = saleService.getTodaySales();
        if (recentSales.size() > 10) recentSales = recentSales.subList(0, 10);

        // ── Build period label ────────────────────────────────────────────────
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM");
        String periodLabel = label != null ? label :
                (start.equals(end)
                        ? start.format(fmt)
                        : start.format(fmt) + " – " + end.format(fmt));

        DashboardDTO dto = new DashboardDTO();
        dto.setTotalRevenue(revenue);
        dto.setTotalKgSold(kgSold);
        dto.setTotalTransactions(transactions);
        dto.setMostSoldItem(mostSoldItem);
        dto.setHighestRevenueItem(highestRevenueItem);
        dto.setTopItems(topItems.size() > 10 ? topItems.subList(0, 10) : topItems);
        dto.setRecentSales(recentSales);
        dto.setPeriodLabel(periodLabel);
        return dto;
    }
}
