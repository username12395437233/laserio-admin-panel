import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatQuote,
  Code,
  CodeOff,
  Undo,
  Redo,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Title,
  Clear,
  TableChart,
  Add,
  Delete,
} from '@mui/icons-material'

// ====== Types ======

type HeadingLevel = 'p' | 'h1' | 'h2' | 'h3' | 'h4'

export interface SpecsRow {
  id: string
  cells: string[]
}

export interface SpecsModel {
  columns: number
  rows: SpecsRow[]
}

export interface ExportPayload {
  content_html: string
  specs_html: string
  categories_html: string
}

// ====== Toolbar ======

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void
  onHeadingChange: (level: HeadingLevel) => void
  onInsertLink: () => void
  onToggleCodeBlock: () => void
  onClearFormatting: () => void
}

function EditorToolbar({
  onCommand,
  onHeadingChange,
  onInsertLink,
  onToggleCodeBlock,
  onClearFormatting,
}: ToolbarProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ borderBottom: '1px solid #e5e7eb', pb: 0.5, mb: 1 }}>
      <Tooltip title="Жирный">
        <IconButton size="small" onClick={() => onCommand('bold')}>
          <FormatBold fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Курсив">
        <IconButton size="small" onClick={() => onCommand('italic')}>
          <FormatItalic fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Подчёркивание">
        <IconButton size="small" onClick={() => onCommand('underline')}>
          <FormatUnderlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Заголовок">
        <IconButton
          size="small"
          onClick={(e) => {
            const menu = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null
            if (menu) {
              menu.style.display = menu.style.display === 'none' ? 'flex' : 'none'
            }
          }}
        >
          <Title fontSize="small" />
        </IconButton>
      </Tooltip>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          display: 'none',
          '& > button': { textTransform: 'none', minWidth: 0, px: 1, fontSize: 12 },
        }}
      >
        <Button size="small" onClick={() => onHeadingChange('p')}>
          P
        </Button>
        <Button size="small" onClick={() => onHeadingChange('h1')}>
          H1
        </Button>
        <Button size="small" onClick={() => onHeadingChange('h2')}>
          H2
        </Button>
        <Button size="small" onClick={() => onHeadingChange('h3')}>
          H3
        </Button>
        <Button size="small" onClick={() => onHeadingChange('h4')}>
          H4
        </Button>
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Маркированный список">
        <IconButton size="small" onClick={() => onCommand('insertUnorderedList')}>
          <FormatListBulleted fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Нумерованный список">
        <IconButton size="small" onClick={() => onCommand('insertOrderedList')}>
          <FormatListNumbered fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Ссылка">
        <IconButton size="small" onClick={onInsertLink}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Цитата">
        <IconButton size="small" onClick={() => onCommand('formatBlock', 'blockquote')}>
          <FormatQuote fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Код (inline)">
        <IconButton size="small" onClick={() => onCommand('inlineCode')}>
          <Code fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Блок кода">
        <IconButton size="small" onClick={onToggleCodeBlock}>
          <CodeOff fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Отменить">
        <IconButton size="small" onClick={() => onCommand('undo')}>
          <Undo fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Повторить">
        <IconButton size="small" onClick={() => onCommand('redo')}>
          <Redo fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Очистить форматирование">
        <IconButton size="small" onClick={onClearFormatting}>
          <Clear fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

// ====== RichEditor (contenteditable) ======

interface RichEditorProps {
  placeholder?: string
  onHtmlChange?: (html: string) => void
  editorRef?: React.RefObject<HTMLDivElement | null>
}

function RichEditor({ placeholder, onHtmlChange, editorRef }: RichEditorProps) {
  const localRef = useRef<HTMLDivElement | null>(null)
  const ref = editorRef ?? localRef

  const exec = useCallback(
    (command: string, value?: string) => {
      const el = ref.current
      if (!el) return
      el.focus()

      if (command === 'inlineCode') {
        const selection = window.getSelection()
        const text = selection?.toString() || ''
        const safe = text.replace(/[<&>]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] as string))
        document.execCommand('insertHTML', false, `<code>${safe || 'code'}</code>`)
        return
      }

      if (command === 'formatBlock') {
        document.execCommand('formatBlock', false, value || 'p')
        return
      }

      document.execCommand(command, false, value)
      if (onHtmlChange && el) {
        onHtmlChange(el.innerHTML)
      }
    },
    [onHtmlChange, ref],
  )

  const handleInput = () => {
    const el = ref.current
    if (el && onHtmlChange) {
      onHtmlChange(el.innerHTML)
    }
  }

  const handleInsertLink = () => {
    const url = window.prompt('Введите URL ссылки')
    if (!url) return
    exec('createLink', url)
  }

  const handleHeadingChange = (level: HeadingLevel) => {
    const el = ref.current
    if (!el) return
    el.focus()
    if (level === 'p') {
      document.execCommand('formatBlock', false, 'p')
    } else {
      document.execCommand('formatBlock', false, level.toUpperCase())
    }
    if (onHtmlChange) {
      onHtmlChange(el.innerHTML)
    }
  }

  const handleToggleCodeBlock = () => {
    const el = ref.current
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    const text = selection?.toString() || ''
    const safe = text.replace(/[<&>]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] as string))
    const html = `<pre><code>${safe || 'code block'}</code></pre>`
    document.execCommand('insertHTML', false, html)
    if (onHtmlChange) {
      onHtmlChange(el.innerHTML)
    }
  }

  const handleClearFormatting = () => {
    const el = ref.current
    if (!el) return
    el.focus()
    document.execCommand('removeFormat')
    if (onHtmlChange) {
      onHtmlChange(el.innerHTML)
    }
  }

  return (
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: 'white' }}>
      <EditorToolbar
        onCommand={exec}
        onHeadingChange={handleHeadingChange}
        onInsertLink={handleInsertLink}
        onToggleCodeBlock={handleToggleCodeBlock}
        onClearFormatting={handleClearFormatting}
      />
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        sx={{
          minHeight: 160,
          px: 1.5,
          py: 1,
          outline: 'none',
          '&:empty:before': {
            content: `"${placeholder || 'Начните вводить текст...'}"`,
            color: '#9ca3af',
          },
        }}
      />
    </Box>
  )
}

// ====== TableEditor for specs ======

interface TableEditorProps {
  model: SpecsModel
  onChange: (model: SpecsModel) => void
}

function TableEditor({ model, onChange }: TableEditorProps) {
  const addRow = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    onChange({
      ...model,
      rows: [...model.rows, { id, cells: Array(model.columns).fill('') }],
    })
  }

  const removeRow = (id: string) => {
    if (model.rows.length <= 1) return
    onChange({
      ...model,
      rows: model.rows.filter((r) => r.id !== id),
    })
  }

  const addColumn = () => {
    const nextCols = model.columns + 1
    onChange({
      columns: nextCols,
      rows: model.rows.map((r) => ({
        ...r,
        cells: [...r.cells, ''],
      })),
    })
  }

  const removeColumn = () => {
    if (model.columns <= 1) return
    const nextCols = model.columns - 1
    onChange({
      columns: nextCols,
      rows: model.rows.map((r) => ({
        ...r,
        cells: r.cells.slice(0, nextCols),
      })),
    })
  }

  const updateCell = (rowId: string, colIndex: number, value: string) => {
    onChange({
      ...model,
      rows: model.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              cells: r.cells.map((c, i) => (i === colIndex ? value : c)),
            }
          : r,
      ),
    })
  }

  return (
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, bgcolor: 'white' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <TableChart fontSize="small" />
        <Typography variant="subtitle2">Таблица спецификаций</Typography>
        <Box flexGrow={1} />
        <Tooltip title="Добавить строку">
          <IconButton size="small" onClick={addRow}>
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить последний столбец">
          <IconButton size="small" onClick={removeColumn}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Добавить столбец">
          <IconButton size="small" onClick={addColumn}>
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={1}>
        {model.rows.map((row, rowIndex) => (
          <Stack key={row.id} direction="row" spacing={1} alignItems="center">
            {row.cells.map((cell, colIndex) => (
              <TextField
                key={colIndex}
                size="small"
                fullWidth
                label={colIndex === 0 ? 'Параметр' : `Значение ${colIndex}`}
                value={cell}
                onChange={(e) => updateCell(row.id, colIndex, e.target.value)}
              />
            ))}
            <IconButton
              size="small"
              onClick={() => removeRow(row.id)}
              disabled={model.rows.length <= 1}
            >
              <Delete fontSize="small" />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              #{rowIndex + 1}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

// ====== Serialization helpers ======

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (className) el.className = className
  return el
}

function cloneInlineChildren(src: Node, dest: HTMLElement) {
  src.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      dest.appendChild(document.createTextNode(child.textContent || ''))
      return
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      let newEl: HTMLElement | null = null
      switch (el.tagName) {
        case 'STRONG':
        case 'B':
          newEl = createEl('strong')
          break;
        case 'EM':
        case 'I':
          newEl = createEl('em')
          break
        case 'U':
          newEl = createEl('u')
          break
        case 'CODE':
          newEl = createEl('code')
          break
        case 'A': {
          newEl = createEl('a', 'text-blue-600 underline hover:text-blue-700')
          const href = el.getAttribute('href') || '#'
          newEl.setAttribute('href', href)
          newEl.setAttribute('rel', 'noopener noreferrer')
          newEl.setAttribute('target', '_blank')
          break
        }
        case 'BR':
          dest.appendChild(document.createElement('br'))
          return
        default:
          // unwrap unknown inline
          cloneInlineChildren(el, dest)
          return
      }

      if (newEl) {
        cloneInlineChildren(el, newEl)
        dest.appendChild(newEl)
      }
    }
  })
}

export function serializeContentToTailwindHtml(root: HTMLElement): string {
  const wrapper = createEl('div')
  wrapper.innerHTML = root.innerHTML

  const section = createEl('section', 'space-y-6')

  const processBlock = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (!text) return
      const p = createEl('p', 'text-gray-700 leading-relaxed')
      p.textContent = text
      section.appendChild(p)
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement

    switch (el.tagName) {
      case 'H1': {
        const h = createEl('h1', 'text-3xl font-bold')
        cloneInlineChildren(el, h)
        section.appendChild(h)
        break
      }
      case 'H2': {
        const h = createEl('h2', 'text-2xl font-bold')
        cloneInlineChildren(el, h)
        section.appendChild(h)
        break
      }
      case 'H3': {
        const h = createEl('h3', 'text-xl font-semibold')
        cloneInlineChildren(el, h)
        section.appendChild(h)
        break
      }
      case 'H4': {
        const h = createEl('h4', 'text-lg font-semibold')
        cloneInlineChildren(el, h)
        section.appendChild(h)
        break
      }
      case 'P':
      case 'DIV': {
        const p = createEl('p', 'text-gray-700 leading-relaxed')
        cloneInlineChildren(el, p)
        if (p.textContent && p.textContent.trim().length > 0) {
          section.appendChild(p)
        }
        break
      }
      case 'UL':
      case 'OL': {
        const list =
          el.tagName === 'UL'
            ? createEl('ul', 'list-disc list-inside space-y-1 text-gray-700')
            : createEl('ol', 'list-decimal list-inside space-y-1 text-gray-700')
        el.childNodes.forEach((liNode) => {
          if (liNode.nodeType !== Node.ELEMENT_NODE) return
          const liEl = liNode as HTMLElement
          if (liEl.tagName !== 'LI') return
          const li = createEl('li')
          cloneInlineChildren(liEl, li)
          list.appendChild(li)
        })
        section.appendChild(list)
        break
      }
      case 'BLOCKQUOTE': {
        const bq = createEl('blockquote', 'border-l-4 border-gray-300 pl-4 italic text-gray-600')
        cloneInlineChildren(el, bq)
        section.appendChild(bq)
        break
      }
      case 'PRE': {
        const pre = createEl('pre', 'bg-gray-900 text-gray-100 rounded-md p-3 text-sm overflow-x-auto')
        const code = createEl('code')
        const inner = el.textContent || ''
        code.textContent = inner
        pre.appendChild(code)
        section.appendChild(pre)
        break
      }
      default: {
        // unwrap unknown blocks but keep their children
        el.childNodes.forEach((child) => processBlock(child))
      }
    }
  }

  Array.from(wrapper.childNodes).forEach(processBlock)
  return section.outerHTML
}

export function serializeSpecsToTailwindTable(model: SpecsModel): string {
  const table = createEl('table', 'min-w-full border border-gray-300 text-sm')
  const tbody = createEl('tbody')
  table.appendChild(tbody)

  model.rows.forEach((row) => {
    const tr = createEl('tr', 'border-b')
    row.cells.forEach((cell, index) => {
      const isLabel = index === 0
      const td = createEl('td', isLabel ? 'p-2 font-medium' : 'p-2')
      td.textContent = cell
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })

  return table.outerHTML
}

export function sanitizeHtml(html: string): string {
  // Мы генерируем HTML сами только из разрешённых тегов и textContent,
  // поэтому здесь достаточно вернуть строку как есть.
  // Если в будущем будут обрабатываться произвольные вставки пользователя,
  // сюда можно подключить DOMPurify или аналогичный sanitize.
  return html
}

// ====== Main ProductEditor ======

export interface ProductEditorHandle {
  getValue: () => ExportPayload
}

interface ProductEditorProps {
  mode?: 'product' | 'category'
  initialContentHtml?: string
  initialSpecsHtml?: string
  initialCategoriesHtml?: string
}

export const ProductEditor = forwardRef(
  (
    {
      mode = 'product',
      initialContentHtml,
      initialSpecsHtml,
      initialCategoriesHtml,
    }: ProductEditorProps,
    ref: React.Ref<ProductEditorHandle>,
  ) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor')

  const contentRef = useRef<HTMLDivElement | null>(null)
  const categoriesRef = useRef<HTMLDivElement | null>(null)

  const [, setContentHtml] = useState(initialContentHtml || '')
  const [, setCategoriesHtml] = useState(initialCategoriesHtml || '')
  const [specsModel, setSpecsModel] = useState<SpecsModel>(() => ({
    columns: 2,
    rows: [
      { id: 'row-1', cells: ['Параметр', 'Значение'] },
      { id: 'row-2', cells: ['', ''] },
    ],
  }))

  // Инициализация начального HTML в редакторах
  useEffect(() => {
    if (contentRef.current && initialContentHtml !== undefined) {
      contentRef.current.innerHTML = initialContentHtml || ''
    }
  }, [initialContentHtml])

  useEffect(() => {
    if (categoriesRef.current && initialCategoriesHtml !== undefined) {
      categoriesRef.current.innerHTML = initialCategoriesHtml || ''
    }
  }, [initialCategoriesHtml])

  useEffect(() => {
    if (!initialSpecsHtml) return
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(initialSpecsHtml, 'text/html')
      const rows = Array.from(doc.querySelectorAll('tr'))
      if (!rows.length) return

      const parsedRows: SpecsRow[] = []
      let maxCols = 0
      rows.forEach((tr, index) => {
        const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent || '')
        maxCols = Math.max(maxCols, cells.length)
        parsedRows.push({
          id: `row-${index + 1}`,
          cells,
        })
      })
      if (parsedRows.length) {
        setSpecsModel({
          columns: maxCols || 2,
          rows: parsedRows,
        })
      }
    } catch {
      // ignore parse errors, keep default model
    }
  }, [initialSpecsHtml])

  const exportJson = useCallback((): ExportPayload => {
    const contentRoot = contentRef.current
    const categoriesRoot = mode === 'product' ? categoriesRef.current : null

    const content = contentRoot ? sanitizeHtml(serializeContentToTailwindHtml(contentRoot)) : ''
    const categories =
      mode === 'product' && categoriesRoot
        ? sanitizeHtml(serializeContentToTailwindHtml(categoriesRoot))
        : ''
    const specs = mode === 'product' ? sanitizeHtml(serializeSpecsToTailwindTable(specsModel)) : ''

    return {
      content_html: content,
      specs_html: specs,
      categories_html: categories,
    }
  }, [specsModel])

  useImperativeHandle(
    ref,
    () => ({
      getValue: exportJson,
    }),
    [exportJson],
  )

  const exported = useMemo(() => (viewMode === 'preview' ? exportJson() : null), [viewMode, exportJson])

  return (
    <Box>
      <Tabs
        value={viewMode}
        onChange={(_, v) => setViewMode(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab value="editor" label="Editor" />
        <Tab value="preview" label="HTML Preview" />
      </Tabs>

      {viewMode === 'editor' && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Контент (content_html)
            </Typography>
            <RichEditor
              placeholder="Основное описание товара..."
              editorRef={contentRef}
              onHtmlChange={setContentHtml}
            />
          </Box>

          {mode === 'product' && (
            <>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Таблица характеристик (specs_html)
                </Typography>
                <TableEditor model={specsModel} onChange={setSpecsModel} />
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Описание для категорий / дополнительный текст (categories_html)
                </Typography>
                <RichEditor
                  placeholder="Текст для категорий..."
                  editorRef={categoriesRef}
                  onHtmlChange={setCategoriesHtml}
                />
              </Box>
            </>
          )}

          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                const json = exportJson()
                // временно просто логируем; интеграция с формой – по месту использования
                // eslint-disable-next-line no-console
                console.log('Export JSON', json)
                alert('JSON экспортирован в консоль браузера')
              }}
            >
              Export JSON
            </Button>
          </Box>
        </Stack>
      )}

      {viewMode === 'preview' && exported && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              content_html
            </Typography>
            {exported.content_html ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'white',
                }}
                dangerouslySetInnerHTML={{ __html: exported.content_html }}
              />
            ) : (
              <Alert severity="info">Контент пока пуст.</Alert>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              specs_html
            </Typography>
            {exported.specs_html ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'white',
                  overflowX: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: exported.specs_html }}
              />
            ) : (
              <Alert severity="info">Таблица характеристик пока пуста.</Alert>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              categories_html
            </Typography>
            {exported.categories_html ? (
              <Box
                sx={{
                  border: '1px solid #e57e7eb',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'white',
                }}
                dangerouslySetInnerHTML={{ __html: exported.categories_html }}
              />
            ) : (
              <Alert severity="info">Текст для категорий пока пуст.</Alert>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Export JSON
            </Typography>
            <TextField
              multiline
              fullWidth
              minRows={6}
              value={JSON.stringify(exported, null, 2)}
              InputProps={{ readOnly: true }}
            />
          </Box>
        </Stack>
      )}
    </Box>
  )
})

