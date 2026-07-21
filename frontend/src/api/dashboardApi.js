import axiosInstance from './axiosInstance'

export const dashboardApi = {
  /**
   * Get dashboard stats for a period.
   * params: { period: 'today'|'yesterday'|'week'|'month'|'custom', start?, end? }
   */
  getStats: (params = { period: 'today' }) =>
    axiosInstance.get('/api/dashboard/stats', { params }),
}
