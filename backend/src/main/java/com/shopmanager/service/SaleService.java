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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
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
        sale.setItem(item);
        sale.setQuantityKg(request.getQuantityKg());
        sale.setTotalPrice(request.getTotalPrice());
        // Use user-provided date/time; fall back to now() if absent
        sale.setSaleDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now());
        sale.setSaleTime(request.getSaleTime() != null ? request.getSaleTime() : LocalTime.now());

        Sale saved = saleRepository.save(sale);
        log.info("Sale created: id={}, item='{}', qty={}kg, total=₹{}, date={}",
                saved.getId(), item.getItemName(), request.getQuantityKg(),
                request.getTotalPrice(), saved.getSaleDate());
        return toDTO(saved);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public SaleDTO updateSale(Long id, SaleRequest request) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", id));

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));

        sale.setItem(item);
        sale.setQuantityKg(request.getQuantityKg());
        sale.setTotalPrice(request.getTotalPrice());
        if (request.getSaleDate() != null) sale.setSaleDate(request.getSaleDate());
        if (request.getSaleTime() != null) sale.setSaleTime(request.getSaleTime());

        Sale saved = saleRepository.save(sale);
        log.info("Sale updated: id={}, item='{}', qty={}kg, total=₹{}, date={}",
                id, item.getItemName(), request.getQuantityKg(),
                request.getTotalPrice(), saved.getSaleDate());
        return toDTO(saved);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void deleteSale(Long id) {
        if (!saleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sale", id);
        }
        saleRepository.deleteById(id);
        log.info("Sale deleted: id={}", id);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<SaleDTO> getSales(LocalDate start, LocalDate end, Pageable pageable) {
        Page<Sale> page = saleRepository.findBySaleDateBetween(start, end, pageable);
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleDTO> getHistory(LocalDate start, LocalDate end, String search, Pageable pageable) {
        // Normalize search — empty string treated as null (wildcard)
        String q = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Sale> page = saleRepository.findHistory(start, end, q, pageable);
        List<SaleDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public List<SaleDTO> getTodaySales() {
        return saleRepository.findRecentSalesByDate(LocalDate.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Return all sales for an arbitrary date, ordered by time desc. */
    @Transactional(readOnly = true)
    public List<SaleDTO> getSalesByDate(LocalDate date) {
        return saleRepository.findRecentSalesByDate(date)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    public SaleDTO toDTO(Sale sale) {
        SaleDTO dto = new SaleDTO();
        dto.setId(sale.getId());
        dto.setItemId(sale.getItem().getId());
        dto.setItemName(sale.getItem().getItemName());
        dto.setCategory(sale.getItem().getCategory());
        dto.setQuantityKg(sale.getQuantityKg());
        dto.setTotalPrice(sale.getTotalPrice());
        dto.setSaleDate(sale.getSaleDate());
        dto.setSaleTime(sale.getSaleTime());
        dto.setCreatedAt(sale.getCreatedAt());
        dto.setUpdatedAt(sale.getUpdatedAt());
        return dto;
    }
}
