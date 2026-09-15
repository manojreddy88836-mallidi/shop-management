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
const fmtDateDisplay = (iso) => iso ? dayjs(iso).format('DD MMM YYYY') : ''

const EMPTY_FORM = {
  item:       null,
  quantityKg: '',
  totalPrice: '',
  saleDate:   dayjs().format('YYYY-MM-DD'),
}

// ─── DOM focus helper ──────────────────────────────────────────────────────────
const IDS = { item: 'sale-item-search', qty: 'sale-qty-input', price: 'sale-price-input' }
const focusField = (id, delay = 80) => {
  setTimeout(() => {
    const el = document.getElementById(id)
    if (el) { el.focus(); el.select() }
  }, delay)
}

// ══════════════════════════════════════════════════════════════════════════════
//  SMART SEARCH ENGINE
//  -------------------
//  Normalization strips brackets, parentheses, and special characters so
//  "hmt bell s" matches "HMT BELL (S)".
//  Results are ranked by relevance — prefix matches come first.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize a string for search comparison:
 * - lowercase
 * - lowercase
 * - remove ALL spaces
 * - remove brackets ( ) [ ] { }
 * - remove ALL special characters
 * - keep only a-z and 0-9
 *
 * Examples:
 *   "HMT BELL (S)"   → "hmtbells"
 *   "hmt bell s"     → "hmtbells"   ← both equal → MATCH
 *   "10KG HMT BELL(S)" → "10kghmtbells"
 *
 * The original display name is NEVER modified.
 */
const normalize = (str) => {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
  // strips spaces, brackets, dashes, slashes — anything not a-z or 0-9
}

/**
 * Score an item against the normalized query.
 * Both normalizedItemName and normalizedQuery are pure alphanumeric (a-z0-9).
 *
 * Priority:
 *  100 – exact match          "hmtbells"  vs "hmtbells"
 *   90 – item starts with query "hmtbell…" vs "hmtbell"
 *   70 – item contains query   "10kghmtbells" vs "hmtbells"
 *   -1 – no match (excluded)
 *
 * Tie-breaker: shorter normalized name wins (closer to what was typed).
 */
const scoreItem = (normalizedItemName, normalizedQuery) => {
  const name = normalizedItemName
  if (!name.includes(normalizedQuery)) return -1        // no match → exclude

  let score = 70                                        // base: contains
  if (name === normalizedQuery)          score = 100    // exact
  else if (name.startsWith(normalizedQuery)) score = 90 // prefix

  // Shorter name = more specific match → wins ties
  const lengthBonus = Math.max(0, 20 - name.length / 3)
  return score + lengthBonus
}


/**
 * MUI Autocomplete filterOptions replacement.
 * Receives ALL loaded items and the current inputValue.
 * Returns the top-30 ranked results.
 */
const buildFilterOptions = (allItems) => (_, { inputValue }) => {
  const query = normalize(inputValue)

  // Empty query — show first 20 items (alphabetical from server)
  if (!query) return allItems.slice(0, 20)

  // Score and rank all items — no queryWords split needed (pure alphanumeric)
  const scored = allItems
    .map(item => ({
      item,
      score: scoreItem(normalize(item.itemName), query),
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)

  return scored.map(({ item }) => item)
}

// ──────────────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { enqueueSnackbar } = useSnackbar()

  // ─── All items (loaded once on mount) ─────────────────────────────────────
  const [allItems,     setAllItems]     = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)

  // Stable filterOptions reference — depends on allItems
  const filterOptionsRef = useRef(buildFilterOptions([]))

  useEffect(() => {
    const load = async () => {
      setItemsLoading(true)
      try {
        // Load all active items in one call — 136 items is tiny for client-side filter
        const res = await itemsApi.getAll({ page: 0, size: 500, active: true })
        const items = res.data.data?.content || res.data.data || []
        setAllItems(items)
        filterOptionsRef.current = buildFilterOptions(items)
      } catch (e) {
        console.error('Failed to load items', e)
        enqueueSnackbar('Could not load items list', { variant: 'error' })
      }
      setItemsLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Selected date ────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  // ─── Form state ───────────────────────────────────────────────────────────
  const [form, setForm]   = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  // ─── Table state ──────────────────────────────────────────────────────────
  const [sales,       setSales]       = useState([])
  const [salesLoading, setSalesLoading] = useState(true)

  // ─── Delete dialog ────────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [deleting,     setDeleting]     = useState(false)

  // ─── Load sales when selected date changes ────────────────────────────────
  useEffect(() => {
    fetchSalesByDate(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchSalesByDate = async (date) => {
    setSalesLoading(true)
    try {
      const res = await salesApi.getByDate(date)
      setSales(res.data.data || [])
    } catch (e) {
      console.error('Fetch sales error', e)
      enqueueSnackbar('Failed to load sales', { variant: 'error' })
    }
    setSalesLoading(false)
  }

  const handleRefresh   = () => fetchSalesByDate(selectedDate)
  const handleDateChange = (e) => { if (e.target.value) setSelectedDate(e.target.value) }

  // ─── Item selected → move to Qty ─────────────────────────────────────────
  const handleItemChange = (_, item) => {
    setForm(f => ({ ...f, item }))
    if (item) focusField(IDS.qty)
  }

  // ─── Qty Enter → move to Price ────────────────────────────────────────────
  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusField(IDS.price, 0) }
  }

  // ─── Price Enter → Save ───────────────────────────────────────────────────
  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); triggerSave() }
  }

  // ─── Core save (called by Price Enter AND Save button) ───────────────────
  const triggerSave = async () => {
    if (saving) return

    if (!form.item) {
      enqueueSnackbar('Please select an item first', { variant: 'warning' })
      focusField(IDS.item); return
    }
    if (!form.quantityKg || isNaN(Number(form.quantityKg)) || Number(form.quantityKg) <= 0) {
      enqueueSnackbar('Please enter a valid quantity (KG)', { variant: 'warning' })
      focusField(IDS.qty); return
    }
    if (!form.totalPrice || isNaN(Number(form.totalPrice)) || Number(form.totalPrice) <= 0) {
      enqueueSnackbar('Please enter the total price', { variant: 'warning' })
      focusField(IDS.price); return
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
      const savedDate = form.saleDate

      if (editId) {
        await salesApi.update(editId, payload)
        enqueueSnackbar('✓ Sale updated!', { variant: 'success' })
        setEditId(null)
      } else {
        await salesApi.create(payload)
        enqueueSnackbar('✓ Sale saved! Type next item.', { variant: 'success' })
      }

      setForm({ ...EMPTY_FORM, saleDate: savedDate })
      fetchSalesByDate(savedDate)
      if (savedDate !== selectedDate) setSelectedDate(savedDate)
      focusField(IDS.item, 150)

    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || (editId ? 'Failed to update' : 'Failed to save'),
        { variant: 'error' }
      )
      console.error('Sale save error:', err)
    }
    setSaving(false)
  }

  // ─── Edit / Cancel ────────────────────────────────────────────────────────
  const handleEdit = (sale) => {
    setEditId(sale.id)
    setForm({
      item:       { id: sale.itemId, itemName: sale.itemName, category: sale.category },
      quantityKg: String(sale.quantityKg || ''),
      totalPrice: String(sale.totalPrice || ''),
      saleDate:   sale.saleDate || selectedDate,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, saleDate: selectedDate })
    focusField(IDS.item)
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    const idToDelete = deleteDialog.id
    setDeleting(true)
    try {
      await salesApi.delete(idToDelete)
      enqueueSnackbar('✓ Sale deleted', { variant: 'success' })
      setDeleteDialog({ open: false, id: null, name: '' })

      // Remove the deleted record directly from state — NO API re-fetch,
      // NO page reload, NO scroll reset. Summary cards recompute automatically.
      // Serial numbers (#) resequence via {i + 1} in the table rows.
      setSales(prev => prev.filter(s => s.id !== idToDelete))

    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Delete failed', { variant: 'error' })
    }
    setDeleting(false)
  }


  // ─── Computed ─────────────────────────────────────────────────────────────
  const displayTotal = form.totalPrice
    ? `₹${Number(form.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : '₹0.00'

  const totalRevenue = sales.reduce((s, r) => s + Number(r.totalPrice  || 0), 0)
  const totalKg      = sales.reduce((s, r) => s + Number(r.quantityKg  || 0), 0)
  const totalRecords = sales.length
  const isToday      = selectedDate === dayjs().format('YYYY-MM-DD')

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Grid container spacing={3}>

        {/* ══════════ LEFT: Sale Entry Form ══════════ */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3.5 }}>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {editId ? <Edit color="warning" /> : <Receipt color="primary" />}
                <Typography variant="h6" fontWeight={700}>
                  {editId ? 'Edit Sale' : 'New Sale Entry'}
                </Typography>
                {editId
                  ? <Chip label="Editing" color="warning" size="small" sx={{ ml: 'auto' }} />
                  : <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontStyle: 'italic' }}>
                      Item → KG → Cost → Enter
                    </Typography>
                }
              </Box>

              <Stack spacing={2.5}>

                {/* ── Search Item ── */}
                <Autocomplete
                  options={allItems}
                  getOptionLabel={(o) => o.itemName}
                  /*
                   * filterOptions: client-side normalization + relevance ranking.
                   * Strips brackets/special chars from both the query and item names
                   * before comparing, so "hmt bell s" matches "HMT BELL (S)".
                   * Results sorted: exact → prefix → word-prefix → contains → all-words.
                   */
                  filterOptions={filterOptionsRef.current}
                  /*
                   * autoHighlight: the first (most relevant) option is pre-highlighted.
                   * Pressing Enter in the search field selects that top option and
                   * fires onChange → handleItemChange → focus moves to Qty.
                   */
                  autoHighlight
                  onChange={handleItemChange}
                  value={form.item}
                  loading={itemsLoading}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  noOptionsText={itemsLoading ? 'Loading items…' : 'No items found'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Item *"
                      placeholder={itemsLoading ? 'Loading…' : 'Type item name (brackets ignored)…'}
                      inputProps={{
                        ...params.inputProps,
                        id: IDS.item,  // used by focusField after save
                      }}
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
                            {itemsLoading ? <CircularProgress size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box>
                        {/* Display name is ALWAYS the original — never the normalized version */}
                        <Typography variant="body2" fontWeight={600}>{option.itemName}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.category}</Typography>
                      </Box>
                    </Box>
                  )}
                />

                {/* ── Quantity + Price ── */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Quantity (KG) *"
                      type="number"
                      fullWidth
                      value={form.quantityKg}
                      placeholder="e.g. 26"
                      inputProps={{ step: '0.001', min: '0.001', id: IDS.qty }}
                      onChange={(e) => setForm(f => ({ ...f, quantityKg: e.target.value }))}
                      onKeyDown={handleQtyKeyDown}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" color="text.secondary">KG</Typography>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Enter → move to Cost"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Total Price (₹) *"
                      type="number"
                      fullWidth
                      value={form.totalPrice}
                      placeholder="e.g. 1500"
                      inputProps={{ step: '0.01', min: '0.01', id: IDS.price }}
                      onChange={(e) => setForm(f => ({ ...f, totalPrice: e.target.value }))}
                      onKeyDown={handlePriceKeyDown}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      helperText="Enter → Save sale"
                    />
                  </Grid>
                </Grid>

                {/* ── Sale Date ── */}
                <TextField
                  label="Sale Date *"
                  type="date"
                  fullWidth
                  value={form.saleDate}
                  onChange={(e) => setForm(f => ({ ...f, saleDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />

                {/* ── Total Amount ── */}
                <Box sx={{
                  p: 2.5, borderRadius: 3, textAlign: 'center', color: 'white',
                  background: editId
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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

                {/* ── Buttons ── */}
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={saving}
                    onClick={triggerSave}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : (editId ? <Save /> : <Add />)}
                    sx={{
                      py: 1.6, fontSize: '1rem', fontWeight: 700, borderRadius: 2,
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
                    <Button variant="outlined" fullWidth startIcon={<Cancel />}
                      onClick={handleCancelEdit} color="inherit">
                      Cancel Edit
                    </Button>
                  )}
                </Stack>

              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ══════════ RIGHT: Sales Table ══════════ */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>

              {/* Date picker */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, p: 2,
                borderRadius: 2, bgcolor: 'action.hover', flexWrap: 'wrap',
              }}>
                <CalendarMonth color="primary" />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 0.5 }}>Sales Date</Typography>
                <TextField
                  type="date" size="small" value={selectedDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }} sx={{ width: 165 }}
                />
                {!isToday && (
                  <Button size="small" variant="outlined"
                    onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                    sx={{ whiteSpace: 'nowrap' }}>
                    Go to Today
                  </Button>
                )}
              </Box>

              {/* Stats */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  { label: 'Revenue', value: fmt(totalRevenue),  icon: <TrendingUp fontSize="small" />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
                  { label: 'KG Sold', value: fmtKg(totalKg),     icon: <Scale fontSize="small" />,      color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                  { label: 'Records', value: totalRecords,        icon: <ShoppingBag fontSize="small" />,color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                ].map((stat) => (
                  <Grid item xs={4} key={stat.label}>
                    <Box sx={{
                      p: 1.5, borderRadius: 2, bgcolor: stat.bg,
                      borderLeft: `3px solid ${stat.color}`,
                      display: 'flex', flexDirection: 'column', gap: 0.25,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: stat.color }}>
                        {stat.icon}
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{stat.label}</Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: stat.color, fontSize: '0.85rem' }}>
                        {salesLoading ? '—' : stat.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Table */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {isToday ? "Today's Sales" : `Sales on ${fmtDateDisplay(selectedDate)}`}
                </Typography>
                <Button size="small" startIcon={<Refresh />} onClick={handleRefresh}
                  variant="outlined" disabled={salesLoading}>Refresh</Button>
              </Box>
              <Divider sx={{ mb: 1.5 }} />

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
                        <TableRow key={s.id} hover sx={{
                          bgcolor: editId === s.id ? 'warning.light' : 'inherit',
                          opacity: editId && editId !== s.id ? 0.55 : 1,
                          transition: 'opacity 0.2s, background 0.2s',
                        }}>
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
                                <IconButton size="small" color="warning" onClick={() => handleEdit(s)}
                                  disabled={!!editId && editId !== s.id}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete sale">
                                <IconButton size="small" color="error"
                                  onClick={() => setDeleteDialog({ open: true, id: s.id, name: s.itemName })}
                                  disabled={!!editId}>
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

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        maxWidth="xs" fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" /> Delete Sale
        </DialogTitle>
        <DialogContent>
          <Typography>Delete sale for <strong>{deleteDialog.name}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}
            variant="outlined" disabled={deleting}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
