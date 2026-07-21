package com.shopmanager.repository;

import com.shopmanager.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findBySaleDateOrderByCreatedAtDesc(LocalDate date);

    Page<Sale> findBySaleDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    // ── History page: search by item name + date range ────────────────────────

    @Query("SELECT s FROM Sale s JOIN FETCH s.item " +
           "WHERE s.saleDate BETWEEN :start AND :end " +
           "AND (:search IS NULL OR s.item.itemName LIKE %:search%) " +
           "ORDER BY s.saleDate DESC, s.saleTime DESC")
    Page<Sale> findHistory(@Param("start") LocalDate start,
                           @Param("end") LocalDate end,
                           @Param("search") String search,
                           Pageable pageable);

    // ── Revenue (totalPrice is user-entered total — IS the revenue) ───────────

    @Query("SELECT SUM(s.totalPrice) FROM Sale s WHERE s.saleDate = :date")
    Optional<BigDecimal> sumTotalBySaleDate(@Param("date") LocalDate date);

    @Query("SELECT SUM(s.totalPrice) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    Optional<BigDecimal> sumTotalBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // ── Counts ────────────────────────────────────────────────────────────────

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate = :date")
    Long countBySaleDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    Long countBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // ── Quantity (KG) ─────────────────────────────────────────────────────────

    @Query("SELECT SUM(s.quantityKg) FROM Sale s WHERE s.saleDate = :date")
    Optional<BigDecimal> sumQuantityKgBySaleDate(@Param("date") LocalDate date);

    @Query("SELECT SUM(s.quantityKg) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    Optional<BigDecimal> sumQuantityKgBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // ── Top items by KG sold (date range) ────────────────────────────────────

    @Query("SELECT s.item.itemName, SUM(s.quantityKg) as qty, COUNT(s) as txn, SUM(s.totalPrice) as rev " +
           "FROM Sale s WHERE s.saleDate BETWEEN :start AND :end " +
           "GROUP BY s.item.id, s.item.itemName ORDER BY qty DESC")
    List<Object[]> findTopItemsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // ── Top items by KG sold today (kept for backwards compat) ────────────────

    @Query("SELECT s.item.itemName, SUM(s.quantityKg) as qty FROM Sale s " +
           "WHERE s.saleDate = :date GROUP BY s.item.id, s.item.itemName ORDER BY qty DESC")
    List<Object[]> findTopItemsBySaleDate(@Param("date") LocalDate date);

    // ── Item-wise report (qty KG, txn count, revenue) ─────────────────────────

    @Query("SELECT s.item.itemName, SUM(s.quantityKg) as qty, COUNT(s) as txn, SUM(s.totalPrice) as rev " +
           "FROM Sale s WHERE s.saleDate BETWEEN :start AND :end " +
           "GROUP BY s.item.id, s.item.itemName ORDER BY rev DESC")
    List<Object[]> findReportBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // ── Recent sales with item fetched ────────────────────────────────────────

    @Query("SELECT s FROM Sale s JOIN FETCH s.item WHERE s.saleDate = :date ORDER BY s.saleTime DESC, s.createdAt DESC")
    List<Sale> findRecentSalesByDate(@Param("date") LocalDate date);
}
