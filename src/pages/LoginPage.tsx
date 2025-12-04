import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import type { LoginResponse } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@local')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/admin/auth/login', {
        email,
        password,
      })
      login(data.access_token)
      navigate(from, { replace: true })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось войти. Проверьте почту и пароль.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f3f4f6',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Вход в Laserio Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Введите e-mail и пароль администратора.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="username"
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={22} /> : 'Войти'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}


