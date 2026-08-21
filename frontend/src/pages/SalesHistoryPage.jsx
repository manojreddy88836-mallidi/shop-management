import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, CircularProgress, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, InputAdornment, Grid, Checkbox
} from '@mui/material'
import {
  History as HistoryIcon, Search, Edit, Delete,
  Refresh, Save, Cancel, DeleteSweep
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { salesApi } from '../api/salesApi'
import { itemsApi } from '../api/itemsApi'

const EMPTY_EDIT = {
  item: null, quantityKg: '', totalPrice: '',
  saleDate: dayjs().format('YYYY-MM-DD'),
  saleTime: dayjs().format('HH:mm'),
}

export default function SalesHistoryPage() {
  const { enqueueSnackbar } = useSnackbar()

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [fromDate,    setFromDate]    = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'))
  const [toDate,      setToDate]      = useState(dayjs().format('YYYY-MM-DD'))
  const [page,        setPage]        = useState(1)
  const PAGE_SIZE = 25

  // ── Data ──────────────────────────────────────────────────────────────────
  const [sales,       setSales]       = useState([])
  const [totalPages,  setTotalPages]  = useState(1)
  const [totalItems,  setTotalItems]  = useState(0)
  const [loading,     setLoading]     = useState(false)

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selected,    setSelected]    = useState(new Set())   // Set of sale IDs

  // Derived selection state
  const allOnPageSelected  = sales.length > 0 && sales.every(s => selected.has(s.id))
  const someOnPageSelected = sales.some(s => selected.has(s.id)) && !allOnPageSelected
  const selectedCount      = selected.size

  // ── Edit dialog ───────────────────────────────────────────────────────────
  const [editDialog,  setEditDialog]  = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [editForm,    setEditForm]    = useState(EMPTY_EDIT)
  const [itemOptions, setItemOptions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const searchTimer = useRef(null)

  // ── Single delete dialog ──────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [deleting,    setDeleting]    = useState(false)

  // ── Bulk delete dialog ────────────────────────────────────────────────────
  const [bulkDialog,  setBulkDialog]  = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (p = page) => {
    setLoading(true)
    setSelected(new Set())   // clear stale selections on every fetch
    try {
      const res = await salesApi.getHistory({
        start: fromDate, end: toDate,
        search: search || undefined,
        page: p - 1, size: PAGE_SIZE,
      })
      const pd = res.data.data
      setSales(pd.content || [])
      setTotalPages(pd.totalPages || 1)
      setTotalItems(pd.totalElements || 0)
    } catch (e) {
      enqueueSnackbar('Failed to load sales history', { variant: 'error' })
      console.error('History fetch error:', e)
    }
    setLoading(false)
  }, [fromDate, toDate, search, page, enqueueSnackbar])

  useEffect(() => { fetchHistory(1); setPage(1) }, [fromDate, toDate])
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchHistory(1) }
  const handleReset  = () => { setSearch(''); setSelected(new Set()); fetchHistory(1) }
  const handlePageChange = (_, p) => { setPage(p); fetchHistory(p) }

  // ── Selection handlers ────────────────────────────────────────────────────
  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      // Deselect all rows on this page
      setSelected(prev => {
        const next = new Set(prev)
        sales.forEach(s => next.delete(s.id))
        return next
      })
    } else {
      // Select all rows on this page
      setSelected(prev => {
        const next = new Set(prev)
        sales.forEach(s => next.add(s.id))
        return next
      })
    }
  }

  // ── Item search (debounced) for edit dialog ───────────────────────────────
  const handleItemSearch = (query) => {
    clearTimeout(searchTimer.current)
    if (!query || query.length < 1) { setItemOptions([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await itemsApi.search(query)
        setItemOptions(res.data.data || [])
      } catch (e) { console.error('Item search error:', e) }
      setSearchLoading(false)
    }, 300)
  }

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (sale) => {
    setEditId(sale.id)
    setEditForm({
      item: { id: sale.itemId, itemName: sale.itemName, category: sale.category },
      quantityKg: String(sale.quantityKg || ''),
      totalPrice: String(sale.totalPrice || ''),
      saleDate: sale.saleDate || dayjs().format('YYYY-MM-DD'),
      saleTime: sale.saleTime?.substring(0, 5) || dayjs().format('HH:mm'),
    })
    setItemOptions([{ id: sale.itemId, itemName: sale.itemName, category: sale.category }])
    setEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.item || !editForm.quantityKg || !editForm.totalPrice) {
      enqueueSnackbar('All fields are required', { variant: 'warning' }); return
    }
    setSaving(true)
    try {
      await salesApi.update(editId, {
        itemId:     editForm.item.id,
        quantityKg: Number(editForm.quantityKg),
        totalPrice: Number(editForm.totalPrice),
        saleDate:   editForm.saleDate,
        saleTime:   editForm.saleTime ? `${editForm.saleTime}:00` : null,
      })
      enqueueSnackbar('✓ Sale updated', { variant: 'success' })
      setEditDialog(false)
      fetchHistory(page)
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Update failed', { variant: 'error' })
    }
    setSaving(false)
  }

  // ── Single delete ─────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await salesApi.delete(deleteDialog.id)
      enqueueSnackbar('✓ Sale deleted', { variant: 'success' })
      // Also remove from selection if it was selected
      setSelected(prev => { const n = new Set(prev); n.delete(deleteDialog.id); return n })
      setDeleteDialog({ open: false, id: null, name: '' })
      fetchHistory(page)
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Delete failed', { variant: 'error' })
    }
    setDeleting(false)
  }

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const confirmBulkDelete = async () => {
    setBulkDeleting(true)
    const ids = [...selected]
    try {
      const res = await salesApi.bulkDelete(ids)
      const deleted = res.data.data?.deleted ?? ids.length
      enqueueSnackbar(`✓ ${deleted} sale(s) deleted successfully`, { variant: 'success' })
      setBulkDialog(false)
      setSelected(new Set())
      fetchHistory(page)
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Bulk delete failed', { variant: 'error' })
    }
    setBulkDeleting(false)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt   = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const fmtKg = (v) => `${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG`

  return (
    <Box>
      {/* ── Filter Bar ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Sales History</Typography>
            {totalItems > 0 && (
              <Chip label={`${totalItems} records`} size="small" color="primary" sx={{ ml: 1 }} />
            )}
            {/* ── Delete Selected button ── */}
            {selectedCount > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteSweep />}
                onClick={() => setBulkDialog(true)}
                sx={{ ml: 'auto' }}
              >
                Delete Selected ({selectedCount})
              </Button>
            )}
            {selectedCount === 0 && totalItems > 0 && (
              <Box sx={{ ml: 'auto' }} /> /* spacer */
            )}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              label="Search by Item"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. HMT, GM CRM…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" size="small" onClick={handleSearch} startIcon={<Search />}>
              Search
            </Button>
            <Button variant="outlined" size="small" onClick={handleReset} startIcon={<Refresh />}>
              Reset
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Sales Table ── */}
      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : sales.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>📋</Typography>
              <Typography color="text.secondary" variant="body2">No sales found for selected filters</Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 550 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {/* ── Select All checkbox ── */}
                      <TableCell padding="checkbox" sx={{ width: 42 }}>
                        <Tooltip title={allOnPageSelected ? 'Deselect all on page' : 'Select all on page'}>
                          <Checkbox
                            size="small"
                            checked={allOnPageSelected}
                            indeterminate={someOnPageSelected}
                            onChange={toggleSelectAll}
                            color="error"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 36 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Qty KG</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((s, i) => {
                      const isSelected = selected.has(s.id)
                      return (
                        <TableRow
                          key={s.id}
                          hover
                          selected={isSelected}
                          sx={isSelected ? {
                            bgcolor: 'rgba(211, 47, 47, 0.08)',
                            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.12)' }
                          } : {}}
                        >
                          {/* ── Row checkbox ── */}
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={() => toggleRow(s.id)}
                              color="error"
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{s.saleDate}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {s.saleTime?.substring(0, 5) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{s.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{s.category}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={fmtKg(s.quantityKg)}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700} color="success.main">{fmt(s.totalPrice)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Edit">
                                <IconButton size="small" color="warning" onClick={() => openEdit(s)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({ open: true, id: s.id, name: s.itemName })}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="warning" /> Edit Sale #{editId}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Autocomplete
              options={itemOptions}
              getOptionLabel={(o) => o.itemName}
              onInputChange={(_, val) => handleItemSearch(val)}
              onChange={(_, item) => setEditForm(f => ({ ...f, item }))}
              value={editForm.item}
              loading={searchLoading}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              filterOptions={(x) => x}
              noOptionsText="Type to search items…"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Item *"
                  InputProps={{
                    ...params.InputProps,
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
                  <Typography variant="body2" fontWeight={600}>{option.itemName}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{option.category}</Typography>
                </Box>
              )}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Quantity (KG) *" type="number" fullWidth
                  value={editForm.quantityKg}
                  onChange={(e) => setEditForm(f => ({ ...f, quantityKg: e.target.value }))}
                  inputProps={{ step: '0.001', min: '0.001' }}
                  InputProps={{ endAdornment: <InputAdornment position="end">KG</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Total Price (₹) *" type="number" fullWidth
                  value={editForm.totalPrice}
                  onChange={(e) => setEditForm(f => ({ ...f, totalPrice: e.target.value }))}
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sale Date" type="date" fullWidth
                  value={editForm.saleDate}
                  onChange={(e) => setEditForm(f => ({ ...f, saleDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sale Time" type="time" fullWidth
                  value={editForm.saleTime}
                  onChange={(e) => setEditForm(f => ({ ...f, saleTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditDialog(false)} variant="outlined" startIcon={<Cancel />} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="warning"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          >
            {saving ? 'Saving…' : 'Update Sale'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Single Delete Dialog ── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" /> Delete Sale
        </DialogTitle>
        <DialogContent>
          <Typography>
            Delete sale for <strong>{deleteDialog.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, name: '' })} variant="outlined" disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Delete Dialog ── */}
      <Dialog open={bulkDialog} onClose={() => !bulkDeleting && setBulkDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweep color="error" /> Delete Selected Sales
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{selectedCount} selected sale{selectedCount !== 1 ? 's' : ''}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove <strong>{selectedCount}</strong>{' '}
            record{selectedCount !== 1 ? 's' : ''} from the database.
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setBulkDialog(false)}
            variant="outlined"
            disabled={bulkDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBulkDelete}
            variant="contained"
            color="error"
            disabled={bulkDeleting}
            startIcon={bulkDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteSweep />}
          >
            {bulkDeleting ? 'Deleting…' : `Delete ${selectedCount}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
