package com.shopmanager.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request body for creating or updating a sale.
 * - quantityKg : decimal KG amount
 * - totalPrice : user-entered total — IS the final revenue
 * - saleDate   : optional; defaults to today if null
 *
 * Note: saleTime has been removed from the UI and is no longer accepted.
 * Existing sale documents in MongoDB that have a saleTime field are unaffected.
 */
public class SaleRequest {

    @NotNull(message = "Item ID is required")
    private String itemId;

    @NotNull(message = "Quantity (KG) is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
    private BigDecimal quantityKg;

    @NotNull(message = "Total price is required")
    @DecimalMin(value = "0.01", message = "Total price must be greater than 0")
    private BigDecimal totalPrice;

    /** Optional — if null, backend defaults to LocalDate.now() */
    private LocalDate saleDate;

    public SaleRequest() {}

    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }

    public BigDecimal getQuantityKg() { return quantityKg; }
    public void setQuantityKg(BigDecimal quantityKg) { this.quantityKg = quantityKg; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public LocalDate getSaleDate() { return saleDate; }
    public void setSaleDate(LocalDate saleDate) { this.saleDate = saleDate; }
}
