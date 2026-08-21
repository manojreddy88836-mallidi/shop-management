package com.shopmanager.repository;

import com.shopmanager.entity.Sale;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SaleRepository extends MongoRepository<Sale, String> {

    /**
     * All sales for a specific date, ordered strictly by entry time:
     * createdAt ASC (primary) then id ASC (tiebreaker — MongoDB ObjectId
     * encodes insertion order, so this guarantees deterministic ordering
     * even when two records share the same createdAt millisecond).
     */
    List<Sale> findBySaleDateOrderByCreatedAtAscIdAsc(LocalDate date);
}
