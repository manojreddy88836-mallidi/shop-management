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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private static final Logger log = LoggerFactory.getLogger(SaleService.class);

    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;

    public SaleService(SaleRepository saleRepository, ItemRepository itemRepository) {
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
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
        sale.setSaleTime(request.getSaleTime() != null ? request.getSaleTime() : LocalTime.now());
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
        if (request.getSaleTime() != null) sale.setSaleTime(request.getSaleTime());
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

    // ── Read ──────────────────────────────────────────────────────────────────

    public PageResponse<SaleDTO> getSales(LocalDate start, LocalDate end, Pageable pageable) {
        Page<Sale> page = saleRepository.findBySaleDateBetween(start, end, pageable);
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public PageResponse<SaleDTO> getHistory(LocalDate start, LocalDate end, String search, Pageable pageable) {
        String q = (search != null && !search.trim().isEmpty()) ? search.trim() : "";
        Page<Sale> page;
        if (q.isEmpty()) {
            page = saleRepository.findBySaleDateBetween(start, end, pageable);
        } else {
            page = saleRepository.findBySaleDateBetweenAndItemNameContainingIgnoreCase(
                    start, end, q, pageable);
        }
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public List<SaleDTO> getTodaySales() {
        return getSalesByDate(LocalDate.now());
    }

    /** Return all sales for an arbitrary date, ordered by time desc. */
    public List<SaleDTO> getSalesByDate(LocalDate date) {
        return saleRepository.findBySaleDateOrderBySaleTimeDesc(date)
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
