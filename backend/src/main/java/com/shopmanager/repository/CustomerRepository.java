package com.shopmanager.repository;

import com.shopmanager.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {
    Page<Customer> findByNameContainingIgnoreCase(String name, Pageable pageable);
    boolean existsByPhone(String phone);
}
