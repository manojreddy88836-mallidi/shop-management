package com.shopmanager.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTO {

    private BigDecimal totalRevenue;
    private Long totalTransactions;
    private BigDecimal totalKgSold;
    private String mostSoldItem;       // highest KG item
    private String highestRevenueItem; // highest revenue item
    private List<SaleDTO> recentSales;
    private List<ReportItemDTO> topItems; // top 10 items by KG
    private String periodLabel;           // e.g. "Today", "This Week", "01 Jul – 15 Jul"

    public DashboardDTO() {}

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public Long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(Long totalTransactions) { this.totalTransactions = totalTransactions; }

    public BigDecimal getTotalKgSold() { return totalKgSold; }
    public void setTotalKgSold(BigDecimal totalKgSold) { this.totalKgSold = totalKgSold; }

    public String getMostSoldItem() { return mostSoldItem; }
    public void setMostSoldItem(String mostSoldItem) { this.mostSoldItem = mostSoldItem; }

    public String getHighestRevenueItem() { return highestRevenueItem; }
    public void setHighestRevenueItem(String highestRevenueItem) { this.highestRevenueItem = highestRevenueItem; }

    public List<SaleDTO> getRecentSales() { return recentSales; }
    public void setRecentSales(List<SaleDTO> recentSales) { this.recentSales = recentSales; }

    public List<ReportItemDTO> getTopItems() { return topItems; }
    public void setTopItems(List<ReportItemDTO> topItems) { this.topItems = topItems; }

    public String getPeriodLabel() { return periodLabel; }
    public void setPeriodLabel(String periodLabel) { this.periodLabel = periodLabel; }
}
