package com.shopmanager.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Sale document — stored in the "sales" MongoDB collection.
 *
 * Denormalized: itemId, itemName and category are stored directly on the sale
 * document so lookups don't require a join. They are populated at create/update
 * time from the Item collection.
 */
@Document(collection = "sales")
public class Sale {

    @Id
    private String id;

    /** Reference to Item — stored as String ObjectId */
    @Field("itemId")
    private String itemId;

    /** Denormalized for fast display (avoids extra lookup) */
    @Field("itemName")
    private String itemName;

    @Field("category")
    private String category;

    /** Quantity in kilograms — supports decimals (e.g. 0.25, 1.5, 25) */
    @Field("quantityKg")
    private BigDecimal quantityKg;

    /** Total price entered by the user (IS the final revenue) */
    @Field("totalPrice")
    private BigDecimal totalPrice;

    @Indexed
    @Field("saleDate")
    private LocalDate saleDate;

    @Field("saleTime")
    private LocalTime saleTime;

    @Field("createdAt")
    private LocalDateTime createdAt;

    @Field("updatedAt")
    private LocalDateTime updatedAt;

    public Sale() {}

    // ─── Getters / Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getQuantityKg() { return quantityKg; }
    public void setQuantityKg(BigDecimal quantityKg) { this.quantityKg = quantityKg; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public LocalDate getSaleDate() { return saleDate; }
    public void setSaleDate(LocalDate saleDate) { this.saleDate = saleDate; }

    public LocalTime getSaleTime() { return saleTime; }
    public void setSaleTime(LocalTime saleTime) { this.saleTime = saleTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
