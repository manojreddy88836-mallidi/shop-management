import axiosInstance from './axiosInstance'

export const reportsApi = {
  daily: (date) => axiosInstance.get('/api/reports/daily', { params: { date } }),
  weekly: () => axiosInstance.get('/api/reports/weekly'),
  monthly: () => axiosInstance.get('/api/reports/monthly'),
  custom: (start, end) => axiosInstance.get('/api/reports/custom', { params: { start, end } }),
}
