import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import CatalogPage from './pages/CatalogPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<CatalogPage />} />
          <Route path="catalog" element={<CatalogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
