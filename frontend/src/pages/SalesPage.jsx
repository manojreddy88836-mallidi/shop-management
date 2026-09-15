import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button,
  InputAdornment, Autocomplete, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip
} from '@mui/material'
import {
  Save, Search, Receipt, Refresh, TrendingUp,
  Edit, Delete, Add, Cancel, CalendarMonth, Scale, ShoppingBag
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { salesApi } from '../api/salesApi'
import { itemsApi } from '../api/itemsApi'

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt   = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtKg = (v) => `${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG`

const fmtDateDisplay = (iso) => {
  if (!iso) return ''
  return dayjs(iso).format('DD MMM YYYY')
}

const EMPTY_FORM = {
  item:       null,
  quantityKg: '',
  totalPrice: '',
  saleDate:   dayjs().format('YYYY-MM-DD'),
}

export default function SalesPage() {
  const { enqueueSnackbar } = useSnackbar()

  // ─── Ref: Search Item input — used to auto-focus after every successful save ─
  const searchInputRef = useRef(null)

  // ─── Selected date for the table (defaults to today) ─────────────────────
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  // ─── Form state ───────────────────────────────────────────────────────────
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editId, setEditId]           = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [saving, setSaving]           = useState(false)

  // ─── Table state ──────────────────────────────────────────────────────────
  const [sales, setSales]             = useState([])
  const [salesLoading, setSalesLoading] = useState(true)

  // ─── Delete dialog ────────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [deleting, setDeleting]         = useState(false)

  const searchTimer = useRef(null)

  // ─── Load on mount + whenever selectedDate changes ───────────────────────
  useEffect(() => {
    fetchSalesByDate(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // ─── Core fetch ──────────────────────────────────────────────────────────
  const fetchSalesByDate = async (date) => {
    setSalesLoading(true)
    try {
      const res = await salesApi.getByDate(date)
      setSales(res.data.data || [])
    } catch (e) {
      console.error('Failed to fetch sales for', date, e)
      enqueueSnackbar('Failed to load sales', { variant: 'error' })
    }
    setSalesLoading(false)
  }

  const handleRefresh = () => fetchSalesByDate(selectedDate)

  const handleDateChange = (e) => {
    const d = e.target.value
    if (d) setSelectedDate(d)
  }

  // ─── Item search (debounced) ──────────────────────────────────────────────
  const handleItemSearch = (query) => {
    clearTimeout(searchTimer.current)
    if (!query || query.length < 1) { setItemOptions([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await itemsApi.search(query)
        setItemOptions(res.data.data || [])
      } catch (e) {
        console.error('Item search error:', e)
      }
      setSearchLoading(false)
    }, 300)
  }

  // ─── Focus Search Item input ──────────────────────────────────────────────
  // Called after every successful save so the user can immediately type the
  // next item without clicking anywhere.
  const focusSearchInput = () => {
    // Small delay lets React flush the state updates (form clear, itemOptions
    // reset) before we call focus, ensuring the input is in its cleared state.
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 80)
  }

  // ─── Load sale into form for editing ──────────────────────────────────────
  const handleEdit = (sale) => {
    setEditId(sale.id)
    setForm({
      item:       { id: sale.itemId, itemName: sale.itemName, category: sale.category },
      quantityKg: String(sale.quantityKg || ''),
      totalPrice: String(sale.totalPrice || ''),
      saleDate:   sale.saleDate || selectedDate,
    })
    setItemOptions([{ id: sale.itemId, itemName: sale.itemName, category: sale.category }])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, saleDate: selectedDate })
    setItemOptions([])
    focusSearchInput()
  }

  // ─── Delete flow ──────────────────────────────────────────────────────────
  const openDelete = (sale) =>
    setDeleteDialog({ open: true, id: sale.id, name: sale.itemName })

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await salesApi.delete(deleteDialog.id)
      enqueueSnackbar('✓ Sale deleted', { variant: 'success' })
      setDeleteDialog({ open: false, id: null, name: '' })
      fetchSalesByDate(selectedDate)
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Delete failed', { variant: 'error' })
    }
    setDeleting(false)
  }

  // ─── Total Amount display ─────────────────────────────────────────────────
  const displayTotal = form.totalPrice
    ? `₹${Number(form.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : '₹0.00'

  // ─── Form submission (Enter key OR Save button) ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()   // prevent browser page reload on Enter

    // Duplicate-submission guard — already saving, do nothing
    if (saving) return

    // ── Validation ──
    if (!form.item) {
      enqueueSnackbar('Please select an item', { variant: 'warning' }); return
    }
    if (!form.quantityKg || isNaN(Number(form.quantityKg)) || Number(form.quantityKg) <= 0) {
      enqueueSnackbar('Please enter a valid quantity (KG)', { variant: 'warning' }); return
    }
    if (!form.totalPrice || isNaN(Number(form.totalPrice)) || Number(form.totalPrice) <= 0) {
      enqueueSnackbar('Please enter the total price', { variant: 'warning' }); return
    }
    if (!form.saleDate) {
      enqueueSnackbar('Sale date is required', { variant: 'warning' }); return
    }

    const payload = {
      itemId:     form.item.id,
      quantityKg: Number(form.quantityKg),
      totalPrice: Number(form.totalPrice),
      saleDate:   form.saleDate,
    }

    setSaving(true)
    try {
      const savedDate = form.saleDate   // capture before clearing form

      if (editId) {
        await salesApi.update(editId, payload)
        enqueueSnackbar('✓ Sale updated successfully!', { variant: 'success' })
        setEditId(null)
      } else {
        await salesApi.create(payload)
        enqueueSnackbar('✓ Sale recorded! Press Enter for next sale.', { variant: 'success' })
      }

      // ── Reset form — keep the sale date, clear everything else ──
      setForm({ ...EMPTY_FORM, saleDate: savedDate })
      setItemOptions([])

      // Refresh table for the saved date
      fetchSalesByDate(savedDate)
      if (savedDate !== selectedDate) {
        setSelectedDate(savedDate)
      }

      // ── Auto-focus Search Item so user can enter next sale immediately ──
      focusSearchInput()

    } catch (err) {
      // On error: keep the form values so user can correct and retry
      const msg = err.response?.data?.message || (editId ? 'Failed to update sale' : 'Failed to record sale')
      enqueueSnackbar(msg, { variant: 'error' })
      console.error('Sale save error:', err)
    }
    setSaving(false)
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalRevenue  = sales.reduce((s, r) => s + Number(r.totalPrice  || 0), 0)
  const totalKg       = sales.reduce((s, r) => s + Number(r.quantityKg  || 0), 0)
  const totalRecords  = sales.length

  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Grid container spacing={3}>

        {/* ══════════════════ LEFT: Sale Entry Form ══════════════════ */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3.5 }}>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {editId ? <Edit color="warning" /> : <Receipt color="primary" />}
                <Typography variant="h6" fontWeight={700}>
                  {editId ? 'Edit Sale' : 'New Sale Entry'}
                </Typography>
                {editId && (
                  <Chip label={`Editing #${editId}`} color="warning" size="small" sx={{ ml: 'auto' }} />
                )}
                {!editId && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 'auto', fontStyle: 'italic' }}
                  >
                    Press Enter to save
                  </Typography>
                )}
              </Box>

              {/* form onSubmit handles both Enter key and Save button */}
              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>

                  {/* ── Search Item ── */}
                  <Autocomplete
                    options={itemOptions}
                    getOptionLabel={(o) => o.itemName}
                    onInputChange={(_, val) => handleItemSearch(val)}
                    onChange={(_, item) => setForm(f => ({ ...f, item }))}
                    value={form.item}
                    loading={searchLoading}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    filterOptions={(x) => x}
                    noOptionsText="Type to search items…"
                    // When an item is selected via Enter, the Autocomplete closes
                    // its dropdown but does NOT submit the form — correct behavior.
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Item *"
                        placeholder="Type a few letters then Tab/click to select…"
                        // Attach ref so we can programmatically focus after save
                        inputRef={searchInputRef}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <Search fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {searchLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{option.itemName}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.category}</Typography>
                        </Box>
                      </Box>
                    )}
                  />

                  {/* ── Quantity + Total Price ── */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Quantity (KG) *"
                        type="number"
                        fullWidth
                        value={form.quantityKg}
                        placeholder="e.g. 0.5, 1, 25"
                        inputProps={{ step: '0.001', min: '0.001' }}
                        onChange={(e) => setForm(f => ({ ...f, quantityKg: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary">KG</Typography>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Total Price (₹) *"
                        type="number"
                        fullWidth
                        value={form.totalPrice}
                        placeholder="e.g. 1500"
                        inputProps={{ step: '0.01', min: '0.01' }}
                        onChange={(e) => setForm(f => ({ ...f, totalPrice: e.target.value }))}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        helperText="Enter total sale amount"
                      />
                    </Grid>
                  </Grid>

                  {/* ── Sale Date — full width ── */}
                  <TextField
                    label="Sale Date *"
                    type="date"
                    fullWidth
                    value={form.saleDate}
                    onChange={(e) => setForm(f => ({ ...f, saleDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />

                  {/* ── Total Amount display ── */}
                  <Box sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: editId
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: editId
                      ? '0 6px 20px rgba(245,158,11,0.35)'
                      : '0 6px 20px rgba(99,102,241,0.35)',
                  }}>
                    <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 3, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -1 }}>
                      {displayTotal}
                    </Typography>
                    {form.quantityKg && (
                      <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                        {Number(form.quantityKg).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG
                        {form.item ? ` · ${form.item.itemName}` : ''}
                      </Typography>
                    )}
                  </Box>

                  {/* ── Action Buttons ── */}
                  <Stack spacing={1}>
                    {/* type="submit" fires handleSubmit on both click AND Enter */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : (editId ? <Save /> : <Add />)}
                      sx={{
                        py: 1.6,
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        background: editId
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: editId
                          ? '0 6px 20px rgba(245,158,11,0.4)'
                          : '0 6px 20px rgba(99,102,241,0.4)',
                      }}
                    >
                      {saving ? 'Saving…' : editId ? 'Update Sale' : 'Save Sale  ↵'}
                    </Button>

                    {editId && (
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        startIcon={<Cancel />}
                        onClick={handleCancelEdit}
                        color="inherit"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </Stack>

                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* ══════════════════ RIGHT: Sales Table ══════════════════ */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>

              {/* ── Date Picker Row ── */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2.5,
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                flexWrap: 'wrap',
              }}>
                <CalendarMonth color="primary" />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 0.5 }}>
                  Sales Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={selectedDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 165 }}
                  inputProps={{ 'aria-label': 'Select sales date' }}
                />
                {!isToday && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Go to Today
                  </Button>
                )}
              </Box>

              {/* ── Summary Stats ── */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  { label: 'Revenue',  value: fmt(totalRevenue), icon: <TrendingUp fontSize="small" />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
                  { label: 'KG Sold',  value: fmtKg(totalKg),   icon: <Scale fontSize="small" />,      color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
                  { label: 'Records',  value: totalRecords,      icon: <ShoppingBag fontSize="small" />,color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
                ].map((stat) => (
                  <Grid item xs={4} key={stat.label}>
                    <Box sx={{
                      p: 1.5, borderRadius: 2, bgcolor: stat.bg,
                      borderLeft: `3px solid ${stat.color}`,
                      display: 'flex', flexDirection: 'column', gap: 0.25,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: stat.color }}>
                        {stat.icon}
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: stat.color, fontSize: '0.85rem' }}>
                        {salesLoading ? '—' : stat.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* ── Table Header ── */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {isToday ? "Today's Sales" : `Sales on ${fmtDateDisplay(selectedDate)}`}
                </Typography>
                <Button size="small" startIcon={<Refresh />} onClick={handleRefresh} variant="outlined" disabled={salesLoading}>
                  Refresh
                </Button>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* ── Table ── */}
              <TableContainer sx={{ maxHeight: 430 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 30 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Qty (KG)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Price</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Sale Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Box sx={{ height: 36, bgcolor: 'action.hover', borderRadius: 1 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🛒</Typography>
                          <Typography color="text.secondary" variant="body2">
                            No sales on {fmtDateDisplay(selectedDate)}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {isToday ? 'Use the form on the left to record a sale' : 'Try selecting a different date'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((s, i) => (
                        <TableRow
                          key={s.id}
                          hover
                          sx={{
                            bgcolor: editId === s.id ? 'warning.light' : 'inherit',
                            opacity: editId && editId !== s.id ? 0.55 : 1,
                            transition: 'opacity 0.2s, background 0.2s',
                          }}
                        >
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{i + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{s.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{s.category}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${Number(s.quantityKg || 0).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG`}
                              size="small" variant="outlined" color="primary"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700} color="success.main">{fmt(s.totalPrice)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">{s.saleDate}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Edit sale">
                                <IconButton
                                  size="small" color="warning"
                                  onClick={() => handleEdit(s)}
                                  disabled={!!editId && editId !== s.id}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete sale">
                                <IconButton
                                  size="small" color="error"
                                  onClick={() => openDelete(s)}
                                  disabled={!!editId}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ══ Delete Confirmation Dialog ══ */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        maxWidth="xs" fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" /> Delete Sale
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the sale for <strong>{deleteDialog.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}
            variant="outlined" disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete} variant="contained" color="error" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
