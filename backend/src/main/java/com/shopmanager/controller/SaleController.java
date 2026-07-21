package com.shopmanager.controller;

import com.shopmanager.dto.ApiResponse;
import com.shopmanager.dto.PageResponse;
import com.shopmanager.dto.SaleDTO;
import com.shopmanager.dto.SaleRequest;
import com.shopmanager.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<SaleDTO>> createSale(@Valid @RequestBody SaleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sale recorded", saleService.createSale(request)));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleDTO>> updateSale(
            @PathVariable String id,
            @Valid @RequestBody SaleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Sale updated", saleService.updateSale(id, request)));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSale(@PathVariable String id) {
        saleService.deleteSale(id);
        return ResponseEntity.ok(ApiResponse.success("Sale deleted", null));
    }

    // ── Paginated list (date range) ───────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SaleDTO>>> getSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (start == null) start = LocalDate.now().minusMonths(1);
        if (end == null)   end   = LocalDate.now();

        Pageable pageable = PageRequest.of(page, size,
                Sort.by("saleDate").descending().and(Sort.by("saleTime").descending()));
        return ResponseEntity.ok(ApiResponse.success("Sales fetched",
                saleService.getSales(start, end, pageable)));
    }

    // ── Sales History (search + date range) ───────────────────────────────────

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<SaleDTO>>> getHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        if (start == null) start = LocalDate.now().minusMonths(3);
        if (end == null)   end   = LocalDate.now();

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Sales history",
                saleService.getHistory(start, end, search, pageable)));
    }

    // ── Sales for a specific date (used by Sales page date picker) ────────────

    @GetMapping("/by-date")
    public ResponseEntity<ApiResponse<List<SaleDTO>>> getSalesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success("Sales for " + date,
                saleService.getSalesByDate(date)));
    }

    // ── Today's Sales ─────────────────────────────────────────────────────────

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<SaleDTO>>> getTodaySales() {
        return ResponseEntity.ok(ApiResponse.success("Today's sales", saleService.getTodaySales()));
    }
}
