package com.shopmanager.repository;

import com.shopmanager.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    boolean existsByItemNameIgnoreCase(String itemName);

    Optional<Item> findByItemNameIgnoreCase(String itemName);

    List<Item> findByItemNameContainingIgnoreCaseAndStatus(String name, String status);

    List<Item> findByStatus(String status);

    long countByStatus(String status);

    Page<Item> findByItemNameContainingIgnoreCase(String name, Pageable pageable);

    // Status-filtered pagination (used by Item Management page)
    Page<Item> findByStatusAndItemNameContainingIgnoreCase(String status, String name, Pageable pageable);

    Page<Item> findByCategoryAndStatusAndItemNameContainingIgnoreCase(String category, String status, String name, Pageable pageable);

    @Query("SELECT DISTINCT i.category FROM Item i WHERE i.category IS NOT NULL ORDER BY i.category")
    List<String> findAllCategories();
}
