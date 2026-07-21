import React, { useState, useEffect } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Skeleton,
  Stack, Chip, Button, ButtonGroup, TextField,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar
} from '@mui/material'
import {
  CurrencyRupee, ShoppingCart, Scale, Star,
  TrendingUp, CalendarToday, EmojiEvents
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { dashboardApi } from '../api/dashboardApi'

const PERIODS = [
  { key: 'today',     label: 'Today'      },
  { key: 'yesterday', label: 'Yesterday'  },
  { key: 'week',      label: 'This Week'  },
  { key: 'month',     label: 'This Month' },
  { key: 'custom',    label: 'Custom'     },
]

function StatCard({ title, value, subtitle, icon, gradient, loading }) {
  if (loading) return <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
  return (
    <Card sx={{
      background: gradient,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.12, fontSize: '6rem', lineHeight: 1, transform: 'rotate(-15deg)' }}>
          {icon}
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 2, fontSize: '0.65rem' }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, fontSize: { xs: '1.6rem', md: '2rem' } }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>{subtitle}</Typography>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('today')
  const [customStart, setCustomStart] = useState(dayjs().format('YYYY-MM-DD'))
  const [customEnd,   setCustomEnd]   = useState(dayjs().format('YYYY-MM-DD'))

  const fetchStats = async (p = period, s = customStart, e = customEnd) => {
    setLoading(true)
    try {
      const params = p === 'custom' ? { period: 'custom', start: s, end: e } : { period: p }
      const res = await dashboardApi.getStats(params)
      setStats(res.data.data)
    } catch (err) {
      console.error('Dashboard error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (period !== 'custom') fetchStats(period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fmt = (v) =>
    v != null
      ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '₹0.00'

  const fmtKg = (v) =>
    v != null ? `${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })} KG` : '0 KG'

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Good Day! 👋
        </Typography>
        <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <CalendarToday sx={{ fontSize: 16 }} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {stats?.periodLabel && (
            <Chip label={stats.periodLabel} size="small" color="primary" sx={{ ml: 1 }} />
          )}
        </Typography>
      </Box>

      {/* ── Period Filter ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
            <ButtonGroup variant="outlined" size="small">
              {PERIODS.map(p => (
                <Button
                  key={p.key}
                  variant={period === p.key ? 'contained' : 'outlined'}
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </ButtonGroup>

            {period === 'custom' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="From" type="date" size="small" value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
                />
                <TextField
                  label="To" type="date" size="small" value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
                />
                <Button variant="contained" size="small" onClick={() => fetchStats('custom', customStart, customEnd)}>
                  Go
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={fmt(stats?.totalRevenue)}
            subtitle={`${stats?.periodLabel || 'Today'}`}
            icon={<CurrencyRupee />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Transactions"
            value={stats?.totalTransactions ?? 0}
            subtitle="Sale records"
            icon={<ShoppingCart />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="KG Sold"
            value={fmtKg(stats?.totalKgSold)}
            subtitle="Total quantity"
            icon={<Scale />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Top Item (KG)"
            value={stats?.mostSoldItem || 'N/A'}
            subtitle="Most sold by weight"
            icon={<Star />}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Highest Revenue + Top Items Table + Recent Sales ── */}
      <Grid container spacing={3}>

        {/* ── Top Selling Items Table ── */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6" fontWeight={700}>Top Selling Items</Typography>
                </Box>
                {stats?.highestRevenueItem && stats.highestRevenueItem !== 'N/A' && (
                  <Chip
                    icon={<EmojiEvents />}
                    label={`Best Revenue: ${stats.highestRevenueItem}`}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1, borderRadius: 1.5 }} />
                ))
              ) : !stats?.topItems?.length ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography sx={{ fontSize: '2.5rem' }}>📊</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    No sales for selected period
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 40 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">KG Sold</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Transactions</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topItems.map((item, i) => (
                        <TableRow key={item.itemName} hover>
                          <TableCell>
                            <Avatar
                              sx={{
                                width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700,
                                bgcolor: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c54' : 'action.hover',
                                color: i < 3 ? 'white' : 'text.primary',
                              }}
                            >
                              {i + 1}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={i < 3 ? 700 : 500}>
                              {item.itemName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${Number(item.totalKg || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} KG`}
                              size="small"
                              color={i === 0 ? 'primary' : 'default'}
                              variant={i === 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{item.transactions}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700} color="success.main">
                              {fmt(item.revenue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Recent Sales ── */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Today's Recent Sales</Typography>
                <Chip
                  label={`${stats?.recentSales?.length ?? 0} records`}
                  size="small"
                  color="primary"
                />
              </Box>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              ) : !stats?.recentSales?.length ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '2.5rem' }}>🛒</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    No sales recorded today
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1} sx={{ maxHeight: 380, overflowY: 'auto' }}>
                  {stats.recentSales.map((sale) => (
                    <Box
                      key={sale.id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 1.5, borderRadius: 2, bgcolor: 'action.hover',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                        {sale.itemName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{sale.itemName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Number(sale.quantityKg || 0).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG
                          · {sale.saleTime?.substring(0, 5)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="success.main" noWrap>
                        {fmt(sale.totalPrice)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
