package com.shopmanager.repository;

import com.shopmanager.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends MongoRepository<Item, String> {

    boolean existsByItemNameIgnoreCase(String itemName);

    Optional<Item> findByItemNameIgnoreCase(String itemName);

    List<Item> findByItemNameContainingIgnoreCaseAndStatus(String name, String status);

    List<Item> findByStatus(String status);

    long countByStatus(String status);

    Page<Item> findByItemNameContainingIgnoreCase(String name, Pageable pageable);

    // Status-filtered pagination
    Page<Item> findByStatusAndItemNameContainingIgnoreCase(String status, String name, Pageable pageable);

    Page<Item> findByCategoryAndStatusAndItemNameContainingIgnoreCase(String category, String status, String name, Pageable pageable);

    // Distinct categories — handled in ItemService via MongoTemplate
    @Query(value = "{status: {$ne: null}}", fields = "{category: 1, _id: 0}")
    List<Item> findAllForCategories();
}
