import axiosInstance from './axiosInstance'

export const salesApi = {
  /**
   * Create a sale.
   * Payload: { itemId, quantityKg, totalPrice, saleDate?, saleTime? }
   */
  create: (data) => axiosInstance.post('/api/sales', data),

  /**
   * Update an existing sale.
   * Payload: { itemId, quantityKg, totalPrice, saleDate?, saleTime? }
   */
  update: (id, data) => axiosInstance.put(`/api/sales/${id}`, data),

  /**
   * Permanently delete a sale by id.
   */
  delete: (id) => axiosInstance.delete(`/api/sales/${id}`),

  /**
   * Get all sales for a specific date (used by Sales page date picker).
   * date: 'YYYY-MM-DD'
   */
  getByDate: (date) => axiosInstance.get('/api/sales/by-date', { params: { date } }),

  /**
   * Get paginated sales list (date range).
   * params: { start, end, page, size }
   */
  getAll: (params) => axiosInstance.get('/api/sales', { params }),

  /**
   * Sales History with search + date range.
   * params: { start, end, search, page, size }
   */
  getHistory: (params) => axiosInstance.get('/api/sales/history', { params }),

  /** Today's sales only (kept for backward compat) */
  getToday: () => axiosInstance.get('/api/sales/today'),
}

