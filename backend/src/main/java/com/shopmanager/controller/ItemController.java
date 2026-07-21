package com.shopmanager.controller;

import com.shopmanager.dto.ApiResponse;
import com.shopmanager.dto.ItemDTO;
import com.shopmanager.dto.PageResponse;
import com.shopmanager.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ItemDTO>>> getAllItems(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "itemName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Items fetched",
                itemService.getAllItems(search, category, pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> searchItems(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success("Search results", itemService.searchItems(q)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories", itemService.getCategories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemDTO>> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Item found", itemService.getItemById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ItemDTO>> createItem(@Valid @RequestBody ItemDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item created", itemService.createItem(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemDTO>> updateItem(
            @PathVariable Long id, @Valid @RequestBody ItemDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Item updated", itemService.updateItem(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        itemService.softDeleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Item deleted", null));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restoreItem(@PathVariable Long id) {
        itemService.restoreItem(id);
        return ResponseEntity.ok(ApiResponse.success("Item restored", null));
    }
}
