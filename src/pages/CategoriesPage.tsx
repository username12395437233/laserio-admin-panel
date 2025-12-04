import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Edit, ExpandLess, ExpandMore } from '@mui/icons-material'
import api from '../api/client'

interface CategoryNode {
  id: number
  name: string
  slug: string
  description: string | null
  desc_product_count: number
  sort_order: number
  children: CategoryNode[]
}

interface CategoryFormState {
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
  featured_only: boolean
}

interface CategoryPayload {
  name?: string
  slug?: string
  parent_id?: number | null
  is_active?: boolean
  featured_only?: boolean
  sort_order?: number
  description?: string | null
}

interface CategoryTreeProps {
  nodes: CategoryNode[]
  level?: number
  parentId?: number | null
  expanded: Set<number>
  onToggle: (id: number) => void
  onCreate: (parentId: number | null) => void
  onEdit: (node: CategoryNode, parentId: number | null) => void
  onSelect?: (node: CategoryNode) => void
}

function CategoryTree({
  nodes,
  level = 0,
  parentId = null,
  expanded,
  onToggle,
  onCreate,
  onEdit,
  onSelect,
}: CategoryTreeProps) {
  if (!nodes.length) return null

  return (
    <List disablePadding>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expanded.has(node.id)

        return (
          <Box key={node.id} sx={{ pl: level * 2 }}>
            <ListItem
              disableGutters
              onClick={() => onSelect && onSelect(node)}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => onCreate(node.id)}
                    aria-label="Добавить подкатегорию"
                  >
                    <Add fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => onEdit(node, parentId)}
                    aria-label="Редактировать категорию"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                {hasChildren ? (
                  <IconButton
                    size="small"
                    onClick={() => onToggle(node.id)}
                    aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                  >
                    {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </IconButton>
                ) : (
                  <Box sx={{ width: 32 }} />
                )}
                <ListItemText
                  primaryTypographyProps={{ fontWeight: 500 }}
                  primary={node.name}
                  secondary={`slug: ${node.slug} • товаров в поддереве: ${node.desc_product_count}`}
                />
              </Stack>
            </ListItem>
            {hasChildren && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <CategoryTree
                  nodes={node.children}
                  level={level + 1}
                  parentId={node.id}
                  expanded={expanded}
                  onToggle={onToggle}
                  onCreate={onCreate}
                  onEdit={onEdit}
                />
              </Collapse>
            )}
          </Box>
        )
      })}
    </List>
  )
}

function buildInitialFormState(node?: CategoryNode): CategoryFormState {
  if (!node) {
    return {
      name: '',
      slug: '',
      description: '',
      sort_order: 0,
      is_active: true,
      featured_only: false,
    }
  }

  return {
    name: node.name,
    slug: node.slug,
    description: node.description ?? '',
    sort_order: node.sort_order ?? 0,
    is_active: true,
    featured_only: false,
  }
}

interface CategoriesPageProps {
  onCategorySelect?: (slug: string) => void
}

export default function CategoriesPage(props: CategoriesPageProps) {
  const { onCategorySelect } = props
  const [data, setData] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [currentNode, setCurrentNode] = useState<CategoryNode | null>(null)
  const [currentParentId, setCurrentParentId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormState>(() => buildInitialFormState())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadTree = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<CategoryNode[]>('/categories/tree')
      setData(data)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Не удалось загрузить дерево категорий.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTree()
  }, [])

  const handleToggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const openCreateDialog = (parentId: number | null) => {
    setDialogMode('create')
    setCurrentNode(null)
    setCurrentParentId(parentId)
    setForm(buildInitialFormState())
    setSaveError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (node: CategoryNode, parentId: number | null) => {
    setDialogMode('edit')
    setCurrentNode(node)
    setCurrentParentId(parentId)
    setForm(buildInitialFormState(node))
    setSaveError(null)
    setDialogOpen(true)
  }

  const handleFormChange =
    (field: keyof CategoryFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'is_active' || field === 'featured_only'
          ? event.target.checked
          : field === 'sort_order'
            ? Number(event.target.value)
            : event.target.value

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const payload: CategoryPayload = useMemo(
    () => ({
      name: form.name || undefined,
      slug: form.slug || undefined,
      parent_id: currentParentId ?? undefined,
      is_active: form.is_active,
      featured_only: form.featured_only,
      sort_order: Number.isNaN(form.sort_order) ? 0 : form.sort_order,
      description: form.description || undefined,
    }),
    [form, currentParentId],
  )

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      setSaveError('Имя и slug обязательны.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      if (dialogMode === 'create') {
        await api.post('/admin/categories', payload)
      } else if (dialogMode === 'edit' && currentNode) {
        await api.put(`/admin/categories/${currentNode.id}`, payload)
      }

      setDialogOpen(false)
      await loadTree()
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Не удалось сохранить категорию.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const dialogTitle =
    dialogMode === 'create'
      ? currentParentId
        ? 'Новая подкатегория'
        : 'Новая корневая категория'
      : 'Редактирование категории'

  const handleSelectCategory = (node: CategoryNode) => {
    if (onCategorySelect) {
      onCategorySelect(node.slug)
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Категории
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь можно просматривать дерево категорий и создавать/редактировать записи.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openCreateDialog(null)}
        >
          Добавить категорию
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

      {!loading && !error && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Категорий пока нет.
        </Typography>
      )}

      {!loading && !error && data.length > 0 && (
        <CategoryTree
          nodes={data}
          expanded={expanded}
          onToggle={handleToggle}
          onCreate={openCreateDialog}
          onEdit={openEditDialog}
          onSelect={handleSelectCategory}
        />
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {currentParentId && (
              <Typography variant="body2" color="text.secondary">
                Родительская категория ID: {currentParentId}
              </Typography>
            )}
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
              label="Описание (HTML)"
              value={form.description}
              onChange={handleFormChange('description')}
              fullWidth
              multiline
              minRows={4}
            />
            <TextField
              label="Порядок сортировки"
              type="number"
              value={form.sort_order}
              onChange={handleFormChange('sort_order')}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={handleFormChange('is_active')}
                    color="primary"
                  />
                }
                label="Активна"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.featured_only}
                    onChange={handleFormChange('featured_only')}
                    color="primary"
                  />
                }
                label="Только избранные товары"
              />
            </Stack>

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

