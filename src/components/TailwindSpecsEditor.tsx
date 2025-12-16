import { useEffect, useState } from 'react'
import { Box, Button, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'

interface Row {
  label: string
  value: string
}

interface TailwindSpecsEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TailwindSpecsEditor({ label, value, onChange }: TailwindSpecsEditorProps) {
  const [mode, setMode] = useState<'builder' | 'raw'>(value.trim() ? 'raw' : 'builder')
  const [rows, setRows] = useState<Row[]>([{ label: '', value: '' }])

  useEffect(() => {
    if (mode !== 'builder') return
    const parts: string[] = []
    parts.push('<table class="min-w-full border border-gray-300 text-sm"><tbody>')
    rows
      .filter((r) => r.label.trim() || r.value.trim())
      .forEach((r) => {
        parts.push(
          `<tr><td class="p-2 font-medium">${r.label.trim()}</td><td class="p-2">${r.value.trim()}</td></tr>`,
        )
      })
    parts.push('</tbody></table>')
    onChange(parts.join(''))
  }, [mode, rows, onChange])

  const handleRowChange = (index: number, field: keyof Row, text: string) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: text }
      return next
    })
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, { label: '', value: '' }])
  }

  return (
    <Box>
      <Tabs
        value={mode}
        onChange={(_, v) => setMode(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab value="builder" label={`${label} — таблица`} />
        <Tab value="raw" label={`${label} — исходный HTML`} />
      </Tabs>

      {mode === 'builder' ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Строки таблицы
          </Typography>
          <Stack spacing={1}>
            {rows.map((row, idx) => (
              <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  label="Параметр"
                  value={row.label}
                  onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Значение"
                  value={row.value}
                  onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                  fullWidth
                />
              </Stack>
            ))}
            <Button size="small" onClick={handleAddRow}>
              Добавить строку
            </Button>
          </Stack>
        </Box>
      ) : (
        <TextField
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          multiline
          minRows={6}
        />
      )}
    </Box>
  )
}


