package com.shopmanager.dto;

import java.math.BigDecimal;

/**
 * One row in the reports table.
 * - totalKg     : total KG sold for the item in the period
 * - transactions: number of sale records
 * - revenue     : SUM(total_price) — user-entered totals
 */
public class ReportItemDTO {

    private String itemName;
    private BigDecimal totalKg;
    private Long transactions;
    private BigDecimal revenue;

    public ReportItemDTO() {}

    public ReportItemDTO(String itemName, BigDecimal totalKg, Long transactions, BigDecimal revenue) {
        this.itemName = itemName;
        this.totalKg = totalKg;
        this.transactions = transactions;
        this.revenue = revenue;
    }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public BigDecimal getTotalKg() { return totalKg; }
    public void setTotalKg(BigDecimal totalKg) { this.totalKg = totalKg; }

    public Long getTransactions() { return transactions; }
    public void setTransactions(Long transactions) { this.transactions = transactions; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
