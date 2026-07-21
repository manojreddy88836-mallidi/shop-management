package com.shopmanager.repository;

import com.shopmanager.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SaleRepository extends MongoRepository<Sale, String> {

    /** All sales for a specific date, ordered by saleTime descending */
    List<Sale> findBySaleDateOrderBySaleTimeDescCreatedAtDesc(LocalDate date);

    /** Paginated sales between two dates */
    Page<Sale> findBySaleDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    /** Paginated sales between dates with item name search */
    Page<Sale> findBySaleDateBetweenAndItemNameContainingIgnoreCase(
            LocalDate start, LocalDate end, String itemName, Pageable pageable);

    /** All sales for a specific date (used by by-date endpoint) */
    List<Sale> findBySaleDateOrderBySaleTimeDesc(LocalDate date);
}
