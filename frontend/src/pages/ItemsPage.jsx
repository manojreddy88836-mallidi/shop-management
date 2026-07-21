import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Tooltip, Alert, CircularProgress
} from '@mui/material'
import { Add, Edit, Delete, RestoreFromTrash, Search, Inventory2 } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { itemsApi } from '../api/itemsApi'

const CATEGORIES = ['RICE', 'FLOUR', 'LENTILS', 'OIL', 'SUGAR', 'SALT', 'GRAINS', 'OTHER']
const emptyForm = { itemName: '', category: 'RICE', price: '', status: 'ACTIVE' }

export default function ItemsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })
  const [categories, setCategories] = useState(CATEGORIES)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await itemsApi.getAll({
        search, category: categoryFilter, page, size: rowsPerPage,
      })
      const data = res.data.data
      setItems(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [search, categoryFilter, page, rowsPerPage])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    itemsApi.getCategories()
      .then(r => { if (r.data.data?.length) setCategories([...new Set([...CATEGORIES, ...r.data.data])]) })
      .catch(() => {})
  }, [])

  const openAdd = () => {
    setEditItem(null); setForm(emptyForm); setFormError(''); setDialogOpen(true)
  }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ itemName: item.itemName, category: item.category || 'RICE', price: item.price, status: item.status })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.itemName.trim()) { setFormError('Item name is required'); return }
    if (!form.price || Number(form.price) <= 0) { setFormError('Valid price is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editItem) {
        await itemsApi.update(editItem.id, form)
        enqueueSnackbar('Item updated!', { variant: 'success' })
      } else {
        await itemsApi.create(form)
        enqueueSnackbar('Item created!', { variant: 'success' })
      }
      setDialogOpen(false)
      fetchItems()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await itemsApi.delete(deleteDialog.item.id)
      enqueueSnackbar('Item deleted (soft)', { variant: 'info' })
      setDeleteDialog({ open: false, item: null })
      fetchItems()
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed', { variant: 'error' })
    }
  }

  const handleRestore = async (item) => {
    try {
      await itemsApi.restore(item.id)
      enqueueSnackbar('Item restored!', { variant: 'success' })
      fetchItems()
    } catch (e) {
      enqueueSnackbar('Failed to restore', { variant: 'error' })
    }
  }

  const statusColor = (s) => s === 'ACTIVE' ? 'success' : s === 'DELETED' ? 'error' : 'warning'

  return (
    <Box>
      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory2 color="primary" />
              <Typography variant="h6" fontWeight={700}>Item Master</Typography>
              <Chip label={`${totalElements} items`} size="small" color="primary" />
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
              Add Item
            </Button>
          </Box>

          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Search items"
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category"
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {/* Table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price (₹)</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Box sx={{ height: 36, bgcolor: 'action.hover', borderRadius: 1, my: 0.5 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">No items found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, i) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {page * rowsPerPage + i + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.itemName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category || '—'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700}>₹{Number(item.price).toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.status} color={statusColor(item.status)} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(item)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.status === 'DELETED' ? (
                          <Tooltip title="Restore">
                            <IconButton size="small" color="success" onClick={() => handleRestore(item)}>
                              <RestoreFromTrash fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Delete (soft)">
                            <IconButton size="small" color="error"
                              onClick={() => setDeleteDialog({ open: true, item })}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Item Name *"
              value={form.itemName}
              required
              fullWidth
              onChange={(e) => setForm(f => ({ ...f, itemName: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category"
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Price (₹) *"
              type="number"
              value={form.price}
              required
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status"
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{deleteDialog.item?.itemName}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This is a soft delete — you can restore the item later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
