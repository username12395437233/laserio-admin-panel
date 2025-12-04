import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Edit, Refresh } from '@mui/icons-material'
import api from '../api/client'

interface CategoryOption {
  id: number
  name: string
  slug: string
}

interface CategoryProductsResponse {
  category: {
    id: number
    name: string
    slug: string
    description: string | null
  }
  products: ProductListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ProductListItem {
  id: number
  name: string
  slug: string
  price: number
  primary_image_url: string | null
  doc_url: string | null
}

interface ProductDetail extends ProductListItem {
  content_html: string | null
  specs_html: string | null
  category_id: number
}

interface ProductFormState {
  name: string
  slug: string
  content_html: string
  specs_html: string
  category_id: number | ''
}

interface ProductPayload {
  name?: string
  slug?: string
  price?: number
  category_id?: number
  content_html?: string
  specs_html?: string
}

interface ProductsPageProps {
  externalCategorySlug?: string
}

export default function ProductsPage(props: ProductsPageProps) {
  const { externalCategorySlug } = props
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('')

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [currentProduct, setCurrentProduct] = useState<ProductDetail | null>(null)
  const [form, setForm] = useState<ProductFormState>({
    name: '',
    slug: '',
    content_html: '',
    specs_html: '',
    category_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === selectedCategorySlug) ?? null,
    [categories, selectedCategorySlug],
  )

  useEffect(() => {
    if (externalCategorySlug) {
      setSelectedCategorySlug(externalCategorySlug)
    }
  }, [externalCategorySlug])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const { data } = await api.get<CategoryOption[]>('/categories/')
      setCategories(data)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Не удалось загрузить список категорий.'
      setCategoriesError(message)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadProducts = async (slug: string) => {
    if (!slug) {
      setProducts([])
      return
    }
    setProductsLoading(true)
    setProductsError(null)
    try {
      const { data } = await api.get<CategoryProductsResponse>(`/categories/${slug}/products`)
      setProducts(data.products)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось загрузить товары для выбранной категории.'
      setProductsError(message)
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategorySlug) {
      loadProducts(selectedCategorySlug)
    } else {
      setProducts([])
    }
  }, [selectedCategorySlug])

  const handleChangeCategory = (event: any) => {
    setSelectedCategorySlug(event.target.value)
  }

  const handleOpenCreate = () => {
    setDialogMode('create')
    setCurrentProduct(null)
    setForm({
      name: '',
      slug: '',
      content_html: '',
      specs_html: '',
      category_id: selectedCategory?.id ?? '',
    })
    setSaveError(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = async (product: ProductListItem) => {
    setDialogMode('edit')
    setSaveError(null)

    try {
      const { data } = await api.get<ProductDetail>(`/products/${product.slug}`)
      setCurrentProduct(data)
      setForm({
        name: data.name,
        slug: data.slug,
        content_html: data.content_html ?? '',
        specs_html: data.specs_html ?? '',
        category_id: data.category_id,
      })
      setDialogOpen(true)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось загрузить данные товара.'
      setSaveError(message)
    }
  }

  const handleFormChange =
    (field: keyof ProductFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'category_id' ? Number(event.target.value) || '' : event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const payload: ProductPayload = useMemo(
    () => ({
      name: form.name || undefined,
      slug: form.slug || undefined,
      price: 0,
      category_id: typeof form.category_id === 'number' ? form.category_id : undefined,
      content_html: form.content_html || undefined,
      specs_html: form.specs_html || undefined,
    }),
    [form],
  )

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.category_id || typeof form.category_id !== 'number') {
      setSaveError('Название, slug и категория обязательны.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      if (dialogMode === 'create') {
        await api.post('/admin/products', payload)
      } else if (dialogMode === 'edit' && currentProduct) {
        await api.patch(`/admin/products/${currentProduct.id}`, payload)
      }

      setDialogOpen(false)

      if (selectedCategorySlug) {
        await loadProducts(selectedCategorySlug)
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось сохранить товар.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const dialogTitle = dialogMode === 'create' ? 'Новый товар' : 'Редактирование товара'

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Товары
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите категорию, чтобы увидеть товары. Можно добавлять и редактировать описание.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => selectedCategorySlug && loadProducts(selectedCategorySlug)}
            disabled={!selectedCategorySlug || productsLoading}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            disabled={!categories.length}
          >
            Добавить товар
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 260 }} size="small">
          <InputLabel id="products-category-label">Категория</InputLabel>
          <Select
            labelId="products-category-label"
            label="Категория"
            value={selectedCategorySlug}
            onChange={handleChangeCategory}
          >
            <MenuItem value="">
              <em>Не выбрана</em>
            </MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.slug}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {categoriesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {categoriesError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {categoriesError}
        </Alert>
      )}

      {selectedCategorySlug && productsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {productsError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {productsError}
        </Alert>
      )}

      {!selectedCategorySlug && !productsLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Сначала выберите категорию.
        </Typography>
      )}

      {selectedCategorySlug && !productsLoading && !productsError && (
        <>
          {products.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              В выбранной категории пока нет товаров.
            </Typography>
          ) : (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell align="right">Цена</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.slug}</TableCell>
                    <TableCell align="right">{product.price}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenEdit(product)}
                      >
                        Редактировать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="product-category-select-label">Категория</InputLabel>
              <Select
                labelId="product-category-select-label"
                label="Категория"
                value={form.category_id === '' ? '' : String(form.category_id)}
                onChange={(event) =>
                  handleFormChange('category_id')(
                    event as unknown as React.ChangeEvent<HTMLInputElement>,
                  )
                }
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Название"
              value={form.name}
              onChange={handleFormChange('name')}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={handleFormChange('slug')}
              fullWidth
              required
            />
            <TextField
              label="Описание (content_html)"
              value={form.content_html}
              onChange={handleFormChange('content_html')}
              fullWidth
              multiline
              minRows={4}
            />
            <TextField
              label="Характеристики (specs_html)"
              value={form.specs_html}
              onChange={handleFormChange('specs_html')}
              fullWidth
              multiline
              minRows={4}
            />

            {saveError && (
              <Alert severity="error">
                {saveError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

