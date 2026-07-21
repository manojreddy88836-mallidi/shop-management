package com.shopmanager.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** For MongoDB String ObjectId */
    public ResourceNotFoundException(String resource, String id) {
        super(resource + " not found with id: " + id);
    }

    /** Kept for backward compatibility */
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
    }
}
