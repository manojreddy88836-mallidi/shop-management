import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, useMediaQuery, useTheme as useMuiTheme, Tooltip, Badge
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  PointOfSale, Inventory2, Assessment, People, Settings,
  Menu as MenuIcon, DarkMode, LightMode, Logout, Notifications,
  ChevronLeft, History
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const DRAWER_WIDTH = 240

const navItems = [
  { label: 'Dashboard',     icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Sales',         icon: <PointOfSale />,   path: '/sales'     },
  { label: 'Sales History', icon: <History />,        path: '/history'   },
  { label: 'Items',         icon: <Inventory2 />,     path: '/items'     },
  { label: 'Reports',       icon: <Assessment />,     path: '/reports'   },
  { label: 'Customers',     icon: <People />,         path: '/customers' },
  { label: 'Settings',      icon: <Settings />,       path: '/settings'  },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const muiTheme = useMuiTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))

  const currentPage = navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard'

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{
        p: 3,
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: 'white',
        position: 'relative',
      }}>
        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🌾 ShopManager
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>Rice & Grains</Typography>
      </Box>

      {/* Nav Items */}
      <List sx={{ flex: 1, pt: 2, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false) }}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'white' : 'text.secondary',
                  background: isActive
                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                    : 'transparent',
                  boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : 'action.hover',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActive ? 700 : 400, fontSize: '0.9rem' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider />

      {/* User info + logout */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.875rem' }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: 'error.main', py: 0.75 }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{currentPage}</Typography>
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default', overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
