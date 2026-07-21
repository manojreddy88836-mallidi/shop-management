package com.shopmanager.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class CustomerDTO {

    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    private String phone;
    private String address;
    private LocalDateTime createdAt;

    public CustomerDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
