import axiosInstance from './axiosInstance'

export const customersApi = {
  getAll: (params) => axiosInstance.get('/api/customers', { params }),
  getById: (id) => axiosInstance.get(`/api/customers/${id}`),
  create: (data) => axiosInstance.post('/api/customers', data),
  update: (id, data) => axiosInstance.put(`/api/customers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/api/customers/${id}`),
}
