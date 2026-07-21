import axiosInstance from './axiosInstance'

export const itemsApi = {
  getAll: (params) => axiosInstance.get('/api/items', { params }),
  search: (q) => axiosInstance.get('/api/items/search', { params: { q } }),
  getById: (id) => axiosInstance.get(`/api/items/${id}`),
  create: (data) => axiosInstance.post('/api/items', data),
  update: (id, data) => axiosInstance.put(`/api/items/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/items/${id}`),
  restore: (id) => axiosInstance.patch(`/api/items/${id}/restore`),
  getCategories: () => axiosInstance.get('/api/items/categories'),
}
