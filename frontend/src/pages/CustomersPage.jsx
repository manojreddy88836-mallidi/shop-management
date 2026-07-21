import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, InputAdornment, CircularProgress, Alert
} from '@mui/material'
import { Add, Edit, Delete, Search, People } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { customersApi } from '../api/customersApi'

const emptyForm = { name: '', phone: '', address: '' }

export default function CustomersPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customersApi.getAll({ search, page, size: rowsPerPage })
      const d = res.data.data
      setCustomers(d.content || [])
      setTotal(d.totalElements || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [search, page, rowsPerPage])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const openAdd = () => {
    setEditCustomer(null); setForm(emptyForm); setFormError(''); setDialogOpen(true)
  }
  const openEdit = (c) => {
    setEditCustomer(c)
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '' })
    setFormError(''); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editCustomer) {
        await customersApi.update(editCustomer.id, form)
        enqueueSnackbar('Customer updated!', { variant: 'success' })
      } else {
        await customersApi.create(form)
        enqueueSnackbar('Customer added!', { variant: 'success' })
      }
      setDialogOpen(false)
      fetchCustomers()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await customersApi.delete(deleteId)
      enqueueSnackbar('Customer deleted', { variant: 'info' })
      setDeleteId(null)
      fetchCustomers()
    } catch (err) {
      enqueueSnackbar('Failed to delete', { variant: 'error' })
    }
  }

  return (
    <Box>
      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People color="primary" />
              <Typography variant="h6" fontWeight={700}>Customers</Typography>
              <Chip label={`${total} total`} size="small" color="primary" />
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Customer</Button>
          </Box>

          {/* Search */}
          <TextField
            label="Search customers"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            sx={{ mb: 2.5, minWidth: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />

          {/* Table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Box sx={{ height: 36, bgcolor: 'action.hover', borderRadius: 1, my: 0.5 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography sx={{ fontSize: '2rem' }}>👥</Typography>
                      <Typography color="text.secondary" variant="body2">No customers found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c, i) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {page * rowsPerPage + i + 1}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{c.name}</Typography>
                      </TableCell>
                      <TableCell>{c.phone || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>{c.address || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => openEdit(c)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Full Name *" value={form.name} fullWidth required
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="Phone" value={form.phone} fullWidth
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            <TextField label="Address" value={form.address} fullWidth multiline rows={3}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editCustomer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this customer?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
