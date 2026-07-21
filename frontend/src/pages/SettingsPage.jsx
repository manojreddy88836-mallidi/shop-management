import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Divider, Stack, Chip, Switch, FormControlLabel
} from '@mui/material'
import { Settings, Lock, Palette, Info } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar()
  const { mode, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match'); return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters'); return
    }
    setPwLoading(true); setPwError('')
    try {
      await axiosInstance.post('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      enqueueSnackbar('Password changed successfully!', { variant: 'success' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    }
    setPwLoading(false)
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Settings color="primary" />
        <Typography variant="h6" fontWeight={700}>Settings</Typography>
      </Box>

      <Stack spacing={3}>
        {/* Account Info */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>Account Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              {[
                { label: 'Username', value: user?.username },
                { label: 'Role', value: <Chip label={user?.role} color="primary" size="small" /> },
                { label: 'System', value: '🌾 Rice & Grains ShopManager v1.0.0' },
              ].map(r => (
                <Box key={r.label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography color="text.secondary" sx={{ minWidth: 120 }}>{r.label}</Typography>
                  <Typography fontWeight={600}>{r.value}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Palette color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>Appearance</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={<Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />}
              label={mode === 'dark' ? '🌙 Dark Mode (Active)' : '☀️ Light Mode (Active)'}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Theme preference is saved in your browser.
            </Typography>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Lock color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {pwError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPwError('')}>{pwError}</Alert>}
            <form onSubmit={handlePasswordChange}>
              <Stack spacing={2.5}>
                <TextField
                  label="Current Password" type="password" size="small" fullWidth required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
                <TextField
                  label="New Password" type="password" size="small" fullWidth required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  helperText="Minimum 6 characters"
                />
                <TextField
                  label="Confirm New Password" type="password" size="small" fullWidth required
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
                <Box>
                  <Button
                    type="submit" variant="contained" disabled={pwLoading}
                    sx={{ minWidth: 160 }}
                  >
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
