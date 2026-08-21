package com.shopmanager.service;

import com.shopmanager.dto.PageResponse;
import com.shopmanager.dto.SaleDTO;
import com.shopmanager.dto.SaleRequest;
import com.shopmanager.entity.Item;
import com.shopmanager.entity.Sale;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.ItemRepository;
import com.shopmanager.repository.SaleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private static final Logger log = LoggerFactory.getLogger(SaleService.class);

    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;
    private final MongoTemplate mongoTemplate;

    public SaleService(SaleRepository saleRepository,
                       ItemRepository itemRepository,
                       MongoTemplate mongoTemplate) {
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
        this.mongoTemplate  = mongoTemplate;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public SaleDTO createSale(SaleRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));

        Sale sale = new Sale();
        sale.setItemId(item.getId());
        sale.setItemName(item.getItemName());
        sale.setCategory(item.getCategory());
        sale.setQuantityKg(request.getQuantityKg());
        sale.setTotalPrice(request.getTotalPrice());
        sale.setSaleDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now());
        // saleTime removed — no longer collected or stored
        sale.setCreatedAt(LocalDateTime.now());
        sale.setUpdatedAt(LocalDateTime.now());

        Sale saved = saleRepository.save(sale);
        log.info("Sale created: id={}, item='{}', qty={}kg, total=₹{}, date={}",
                saved.getId(), item.getItemName(), request.getQuantityKg(),
                request.getTotalPrice(), saved.getSaleDate());
        return toDTO(saved);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public SaleDTO updateSale(String id, SaleRequest request) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", id));

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));

        sale.setItemId(item.getId());
        sale.setItemName(item.getItemName());
        sale.setCategory(item.getCategory());
        sale.setQuantityKg(request.getQuantityKg());
        sale.setTotalPrice(request.getTotalPrice());
        if (request.getSaleDate() != null) sale.setSaleDate(request.getSaleDate());
        // saleTime intentionally not updated — field removed from UI
        sale.setUpdatedAt(LocalDateTime.now());

        Sale saved = saleRepository.save(sale);
        log.info("Sale updated: id={}, item='{}', qty={}kg, total=₹{}, date={}",
                id, item.getItemName(), request.getQuantityKg(),
                request.getTotalPrice(), saved.getSaleDate());
        return toDTO(saved);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void deleteSale(String id) {
        if (!saleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sale", id);
        }
        saleRepository.deleteById(id);
        log.info("Sale deleted: id={}", id);
    }

    /**
     * Bulk delete — only deletes IDs that actually exist.
     * Non-existent IDs are silently skipped (safe).
     * @return number of records actually deleted
     */
    public int bulkDelete(java.util.List<String> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        java.util.List<String> unique = ids.stream().distinct().collect(Collectors.toList());
        java.util.List<Sale> existing = saleRepository.findAllById(unique);
        saleRepository.deleteAll(existing);
        log.info("Bulk delete: requested={}, deleted={}", unique.size(), existing.size());
        return existing.size();
    }

    // ── Read — use MongoTemplate for date-range queries ───────────────────────
    // Derived query methods (findBySaleDateBetween) have a LocalDate type
    // conversion inconsistency in Spring Data MongoDB. MongoTemplate Criteria
    // uses the same conversion as the aggregation pipeline (which works).

    public PageResponse<SaleDTO> getSales(LocalDate start, LocalDate end, Pageable pageable) {
        Page<Sale> page = findByDateRange(start, end, null, pageable);
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public PageResponse<SaleDTO> getHistory(LocalDate start, LocalDate end, String search, Pageable pageable) {
        String q = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Sale> page = findByDateRange(start, end, q, pageable);
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    /**
     * Core date-range query using MongoTemplate.
     *
     * Sort: createdAt ASC → id ASC
     * Rationale: createdAt is set to LocalDateTime.now() at insert time and
     * never updated on edit. id (MongoDB ObjectId) encodes the insertion
     * instant in its first 4 bytes, giving a deterministic tiebreaker when
     * two records share the same createdAt millisecond.
     * Together they guarantee records are always returned in exact entry order.
     */
    private Page<Sale> findByDateRange(LocalDate start, LocalDate end,
                                        String itemNameSearch, Pageable pageable) {
        Criteria criteria = Criteria.where("saleDate").gte(start).lte(end);
        if (itemNameSearch != null && !itemNameSearch.isEmpty()) {
            criteria = criteria.and("itemName").regex(itemNameSearch, "i");
        }

        // Always override the caller's sort with entry order
        org.springframework.data.domain.Sort entryOrder =
                org.springframework.data.domain.Sort.by("createdAt").ascending()
                        .and(org.springframework.data.domain.Sort.by("id").ascending());

        Pageable orderedPageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), entryOrder);

        Query countQuery = new Query(criteria);
        long total = mongoTemplate.count(countQuery, Sale.class);

        Query dataQuery = new Query(criteria).with(orderedPageable);
        List<Sale> sales = mongoTemplate.find(dataQuery, Sale.class);

        return new PageImpl<>(sales, orderedPageable, total);
    }

    public List<SaleDTO> getTodaySales() {
        return getSalesByDate(LocalDate.now());
    }

    /**
     * Return all sales for a specific date in exact entry order:
     * createdAt ASC, id ASC.
     */
    public List<SaleDTO> getSalesByDate(LocalDate date) {
        return saleRepository.findBySaleDateOrderByCreatedAtAscIdAsc(date)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    public SaleDTO toDTO(Sale sale) {
        SaleDTO dto = new SaleDTO();
        dto.setId(sale.getId());
        dto.setItemId(sale.getItemId());
        dto.setItemName(sale.getItemName());
        dto.setCategory(sale.getCategory());
        dto.setQuantityKg(sale.getQuantityKg());
        dto.setTotalPrice(sale.getTotalPrice());
        dto.setSaleDate(sale.getSaleDate());
        dto.setSaleTime(sale.getSaleTime());
        dto.setCreatedAt(sale.getCreatedAt());
        dto.setUpdatedAt(sale.getUpdatedAt());
        return dto;
    }
}
