package com.shopmanager.service;

import com.shopmanager.dto.CustomerDTO;
import com.shopmanager.dto.PageResponse;
import com.shopmanager.entity.Customer;
import com.shopmanager.exception.ResourceNotFoundException;
import com.shopmanager.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public PageResponse<CustomerDTO> getAllCustomers(String search, Pageable pageable) {
        Page<Customer> page = customerRepository.findByNameContainingIgnoreCase(
                search != null ? search : "", pageable);
        List<CustomerDTO> content = page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public CustomerDTO getCustomerById(String id) {
        return toDTO(customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id)));
    }

    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setCreatedAt(LocalDateTime.now());
        return toDTO(customerRepository.save(customer));
    }

    public CustomerDTO updateCustomer(String id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        return toDTO(customerRepository.save(customer));
    }

    public void deleteCustomer(String id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer", id);
        }
        customerRepository.deleteById(id);
    }

    private CustomerDTO toDTO(Customer c) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setPhone(c.getPhone());
        dto.setAddress(c.getAddress());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
