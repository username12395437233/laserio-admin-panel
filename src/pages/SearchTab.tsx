import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import api, { searchApi } from '../api/client'

interface SearchCategory {
  id: number
  name: string
  slug: string
  description: string | null
}

interface SearchProduct {
  id: number
  name: string
  slug: string
  price: number
  primary_image_url: string | null
  content_html: string | null
  specs_html: string | null
  category_name: string
  category_slug: string
}

interface SearchResponse {
  query: string
  categories: SearchCategory[]
  products: SearchProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories')

  const [editCategory, setEditCategory] = useState<SearchCategory | null>(null)
  const [editCategoryDesc, setEditCategoryDesc] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [editCategoryError, setEditCategoryError] = useState<string | null>(null)

  const [editProduct, setEditProduct] = useState<SearchProduct | null>(null)
  const [editProductContent, setEditProductContent] = useState('')
  const [editProductSpecs, setEditProductSpecs] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [editProductError, setEditProductError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Введите строку для поиска.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await searchApi.get<SearchResponse>('/search', {
        params: { q: query.trim(), page: 1, limit: 20 },
      })
      setData(data)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Ошибка при выполнении поиска.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditCategory = (category: SearchCategory) => {
    setEditCategory(category)
    setEditCategoryDesc(category.description ?? '')
    setEditCategoryError(null)
  }

  const handleSaveCategory = async () => {
    if (!editCategory) return
    setSavingCategory(true)
    setEditCategoryError(null)
    try {
      await api.put(`/admin/categories/${editCategory.id}`, {
        description: editCategoryDesc,
      })
      setEditCategory(null)
      if (data) {
        setData({
          ...data,
          categories: data.categories.map((c) =>
            c.id === editCategory.id ? { ...c, description: editCategoryDesc } : c,
          ),
        })
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось сохранить категорию.'
      setEditCategoryError(message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleOpenEditProduct = (product: SearchProduct) => {
    setEditProduct(product)
    setEditProductContent(product.content_html ?? '')
    setEditProductSpecs(product.specs_html ?? '')
    setEditProductError(null)
  }

  const handleSaveProduct = async () => {
    if (!editProduct) return
    setSavingProduct(true)
    setEditProductError(null)
    try {
      await api.patch(`/admin/products/${editProduct.id}`, {
        content_html: editProductContent,
        specs_html: editProductSpecs,
      })
      setEditProduct(null)
      if (data) {
        setData({
          ...data,
          products: data.products.map((p) =>
            p.id === editProduct.id
              ? { ...p, content_html: editProductContent, specs_html: editProductSpecs }
              : p,
          ),
        })
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось сохранить товар.'
      setEditProductError(message)
    } finally {
      setSavingProduct(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Поиск по категориям и товарам
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Введите фразу (например, «лазер») — будут найдены совпадающие категории и товары, которые
        можно сразу отредактировать.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, mb: 2 }}>
        <TextField
          label="Поисковый запрос"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          Найти
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {data && !loading && !error && (
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab
              value="categories"
              label={`Категории (${data.categories.length})`}
            />
            <Tab
              value="products"
              label={`Товары (${data.products.length})`}
            />
          </Tabs>

          {activeTab === 'categories' && (
            <Stack spacing={1}>
              {data.categories.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Категории не найдены.
                </Typography>
              )}
              {data.categories.map((cat) => (
                <Box
                  key={cat.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">{cat.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      slug: {cat.slug}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => handleOpenEditCategory(cat)}>
                    Редактировать описание
                  </Button>
                </Box>
              ))}
            </Stack>
          )}

          {activeTab === 'products' && (
            <Stack spacing={1}>
              {data.products.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Товары не найдены.
                </Typography>
              )}
              {data.products.map((p) => (
                <Box
                  key={p.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      slug: {p.slug} • категория: {p.category_name}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => handleOpenEditProduct(p)}>
                    Редактировать описание
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      <Dialog
        open={!!editCategory}
        onClose={() => !savingCategory && setEditCategory(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Редактирование категории</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            {editCategory?.name}
          </Typography>
          <TextField
            label="Описание (HTML)"
            value={editCategoryDesc}
            onChange={(e) => setEditCategoryDesc(e.target.value)}
            fullWidth
            multiline
            minRows={6}
          />
          {editCategoryError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {editCategoryError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCategory(null)} disabled={savingCategory}>
            Отмена
          </Button>
          <Button onClick={handleSaveCategory} disabled={savingCategory} variant="contained">
            {savingCategory ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editProduct}
        onClose={() => !savingProduct && setEditProduct(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Редактирование товара</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            {editProduct?.name}
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Описание (content_html)"
              value={editProductContent}
              onChange={(e) => setEditProductContent(e.target.value)}
              fullWidth
              multiline
              minRows={6}
            />
            <TextField
              label="Характеристики (specs_html)"
              value={editProductSpecs}
              onChange={(e) => setEditProductSpecs(e.target.value)}
              fullWidth
              multiline
              minRows={6}
            />
            {editProductError && (
              <Alert severity="error">
                {editProductError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProduct(null)} disabled={savingProduct}>
            Отмена
          </Button>
          <Button onClick={handleSaveProduct} disabled={savingProduct} variant="contained">
            {savingProduct ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}


