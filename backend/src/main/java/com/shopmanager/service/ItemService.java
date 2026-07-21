package com.shopmanager.service;

import com.shopmanager.dto.ItemDTO;
import com.shopmanager.dto.PageResponse;
import com.shopmanager.entity.Item;
import com.shopmanager.exception.DuplicateResourceException;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.ItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public List<ItemDTO> searchItems(String query) {
        return itemRepository.findByItemNameContainingIgnoreCaseAndStatus(query, "ACTIVE")
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PageResponse<ItemDTO> getAllItems(String search, String category, Pageable pageable) {
        Page<Item> page;
        String searchTerm = (search != null) ? search : "";
        if (category != null && !category.isEmpty()) {
            page = itemRepository
                    .findByCategoryAndStatusAndItemNameContainingIgnoreCase(category, "ACTIVE", searchTerm, pageable);
        } else {
            page = itemRepository
                    .findByStatusAndItemNameContainingIgnoreCase("ACTIVE", searchTerm, pageable);
        }
        List<ItemDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public ItemDTO getItemById(String id) {
        return toDTO(itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id)));
    }

    public ItemDTO createItem(ItemDTO dto) {
        if (itemRepository.existsByItemNameIgnoreCase(dto.getItemName())) {
            throw new DuplicateResourceException("Item '" + dto.getItemName() + "' already exists");
        }
        Item item = new Item();
        item.setItemName(dto.getItemName().trim());
        item.setCategory(dto.getCategory() != null ? dto.getCategory().trim().toUpperCase() : null);
        item.setPrice(dto.getPrice());
        item.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return toDTO(itemRepository.save(item));
    }

    public ItemDTO updateItem(String id, ItemDTO dto) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        if (!item.getItemName().equalsIgnoreCase(dto.getItemName()) &&
                itemRepository.existsByItemNameIgnoreCase(dto.getItemName())) {
            throw new DuplicateResourceException("Item '" + dto.getItemName() + "' already exists");
        }
        item.setItemName(dto.getItemName().trim());
        item.setCategory(dto.getCategory() != null ? dto.getCategory().trim().toUpperCase() : null);
        item.setPrice(dto.getPrice());
        item.setStatus(dto.getStatus());
        item.setUpdatedAt(LocalDateTime.now());
        return toDTO(itemRepository.save(item));
    }

    public void softDeleteItem(String id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        item.setStatus("DELETED");
        item.setUpdatedAt(LocalDateTime.now());
        itemRepository.save(item);
    }

    public void restoreItem(String id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        item.setStatus("ACTIVE");
        item.setUpdatedAt(LocalDateTime.now());
        itemRepository.save(item);
    }

    public List<String> getCategories() {
        return itemRepository.findByStatus("ACTIVE").stream()
                .map(Item::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private ItemDTO toDTO(Item item) {
        ItemDTO dto = new ItemDTO();
        dto.setId(item.getId());
        dto.setItemName(item.getItemName());
        dto.setCategory(item.getCategory());
        dto.setPrice(item.getPrice());
        dto.setStatus(item.getStatus());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
