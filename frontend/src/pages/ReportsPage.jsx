import React, { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, ButtonGroup, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, CircularProgress, TableSortLabel
} from '@mui/material'
import { TableChart, PictureAsPdf, Print, Assessment } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { reportsApi } from '../api/reportsApi'

const PERIODS = [
  { key: 'daily',     label: 'Today'      },
  { key: 'yesterday', label: 'Yesterday'  },
  { key: 'weekly',    label: 'This Week'  },
  { key: 'monthly',   label: 'This Month' },
  { key: 'custom',    label: 'Custom'     },
]

export default function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [period, setPeriod]         = useState('daily')
  const [customStart, setCustomStart] = useState(dayjs().format('YYYY-MM-DD'))
  const [customEnd,   setCustomEnd]   = useState(dayjs().format('YYYY-MM-DD'))
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [sortBy, setSortBy]         = useState('revenue')
  const [sortDir, setSortDir]       = useState('desc')

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      if      (period === 'daily')     res = await reportsApi.daily(dayjs().format('YYYY-MM-DD'))
      else if (period === 'yesterday') res = await reportsApi.daily(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
      else if (period === 'weekly')    res = await reportsApi.weekly()
      else if (period === 'monthly')   res = await reportsApi.monthly()
      else                             res = await reportsApi.custom(customStart, customEnd)
      setData(res.data.data || [])
    } catch (e) {
      enqueueSnackbar('Failed to load report', { variant: 'error' })
      console.error('Report error:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (period !== 'custom') fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  // ── Fix: use totalKg (not totalQuantity) — the correct DTO field name ────
  const sorted = [...data].sort((a, b) => {
    const d = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'revenue')      return d * (Number(a.revenue)      - Number(b.revenue))
    if (sortBy === 'totalKg')      return d * (Number(a.totalKg)      - Number(b.totalKg))
    if (sortBy === 'transactions') return d * (Number(a.transactions)  - Number(b.transactions))
    return d * a.itemName.localeCompare(b.itemName)
  })

  // ── Totals — use Number() to avoid NaN ───────────────────────────────────
  const totalRevenue = data.reduce((s, r) => s + Number(r.revenue  || 0), 0)
  const totalKg      = data.reduce((s, r) => s + Number(r.totalKg  || 0), 0)
  const totalTxn     = data.reduce((s, r) => s + Number(r.transactions || 0), 0)

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const fmtKg = (v) => `${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG`

  // ── Export helpers ───────────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(sorted.map((r, i) => ({
        'Rank':            i + 1,
        'Item Name':       r.itemName,
        'Total KG Sold':   Number(r.totalKg || 0).toFixed(3),
        'Transactions':    r.transactions,
        'Revenue (₹)':     Number(r.revenue || 0).toFixed(2),
      })))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      XLSX.writeFile(wb, `report_${period}_${dayjs().format('YYYY-MM-DD')}.xlsx`)
      enqueueSnackbar('Excel exported!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar('Export failed — install xlsx: npm i xlsx', { variant: 'error' })
    }
  }

  const exportPDF = async () => {
    try {
      const { default: jsPDF }    = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Sales Report — ShopManager', 14, 18)
      doc.setFontSize(11)
      const pLabel = PERIODS.find(p => p.key === period)?.label ?? period
      doc.text(`Period: ${pLabel} | Revenue: ${fmt(totalRevenue)}`, 14, 28)
      doc.setFontSize(9)
      doc.text(`Generated: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 35)
      autoTable(doc, {
        startY: 42,
        head: [['#', 'Item Name', 'KG Sold', 'Transactions', 'Revenue (₹)']],
        body: sorted.map((r, i) => [
          i + 1, r.itemName,
          Number(r.totalKg || 0).toFixed(3),
          r.transactions,
          Number(r.revenue || 0).toFixed(2),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        foot: [['', 'TOTAL', totalKg.toFixed(3), totalTxn, totalRevenue.toFixed(2)]],
        footStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      })
      doc.save(`report_${period}_${dayjs().format('YYYY-MM-DD')}.pdf`)
      enqueueSnackbar('PDF exported!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar('PDF export failed — install jspdf + jspdf-autotable', { variant: 'error' })
    }
  }

  return (
    <Box>
      {/* ── Controls ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Assessment color="primary" />
            <Typography variant="h6" fontWeight={700}>Sales Reports</Typography>
          </Box>

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
                <Button variant="contained" size="small" onClick={fetchReport}>
                  Generate
                </Button>
              </Stack>
            )}

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<TableChart />} onClick={exportExcel} variant="outlined">
                Excel
              </Button>
              <Button size="small" startIcon={<PictureAsPdf />} onClick={exportPDF} variant="outlined" color="error">
                PDF
              </Button>
              <Button size="small" startIcon={<Print />} onClick={() => window.print()} variant="outlined">
                Print
              </Button>
            </Stack>
          </Stack>

          {/* ── Summary Cards ── */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            {[
              { label: 'Total Revenue',  value: fmt(totalRevenue),             color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
              { label: 'Total KG Sold',  value: fmtKg(totalKg),                color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
              { label: 'Transactions',   value: totalTxn,                       color: '#ec4899', bg: 'rgba(236,72,153,0.1)'  },
              { label: 'Unique Items',   value: data.length,                    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
            ].map(s => (
              <Box
                key={s.label}
                sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: s.bg, borderLeft: `4px solid ${s.color}` }}
              >
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Item-Wise Report Table ── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Item-Wise Detailed Report</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel active={sortBy === 'itemName'} direction={sortDir}
                        onClick={() => handleSort('itemName')}>Item Name</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      <TableSortLabel active={sortBy === 'totalKg'} direction={sortDir}
                        onClick={() => handleSort('totalKg')}>KG Sold</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      <TableSortLabel active={sortBy === 'transactions'} direction={sortDir}
                        onClick={() => handleSort('transactions')}>Transactions</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      <TableSortLabel active={sortBy === 'revenue'} direction={sortDir}
                        onClick={() => handleSort('revenue')}>Revenue</TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📊</Typography>
                        <Typography color="text.secondary" variant="body2">
                          No data for selected period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((row, i) => (
                      <TableRow key={row.itemName} hover>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{i + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{row.itemName}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={fmtKg(row.totalKg)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{row.transactions}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} color="success.main">{fmt(row.revenue)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {sorted.length > 0 && (
                    <TableRow sx={{ bgcolor: 'action.selected' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>TOTAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{fmtKg(totalKg)}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{totalTxn}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {fmt(totalRevenue)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
