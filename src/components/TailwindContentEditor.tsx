import { useEffect, useState } from 'react'
import { Box, Button, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'

interface TailwindContentEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TailwindContentEditor({ label, value, onChange }: TailwindContentEditorProps) {
  const [mode, setMode] = useState<'builder' | 'raw'>(value.trim() ? 'raw' : 'builder')

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [paragraphs, setParagraphs] = useState<string[]>([''])
  const [bullets, setBullets] = useState<string[]>([])

  useEffect(() => {
    if (mode !== 'builder') return
    const parts: string[] = []
    parts.push('<section class="space-y-6">')

    if (title.trim()) {
      parts.push(`<h2 class="text-2xl font-bold">${title.trim()}</h2>`)
    }
    if (subtitle.trim()) {
      parts.push(`<h3 class="text-xl font-semibold">${subtitle.trim()}</h3>`)
    }

    paragraphs
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        parts.push(`<p class="text-gray-700 leading-relaxed">${p}</p>`)
      })

    const bulletItems = bullets.map((b) => b.trim()).filter(Boolean)
    if (bulletItems.length > 0) {
      parts.push('<ul class="list-disc list-inside space-y-1 text-gray-700">')
      bulletItems.forEach((b) => {
        parts.push(`<li>${b}</li>`)
      })
      parts.push('</ul>')
    }

    parts.push('</section>')
    onChange(parts.join(''))
  }, [mode, title, subtitle, paragraphs, bullets, onChange])

  const handleParagraphChange = (index: number, text: string) => {
    setParagraphs((prev) => {
      const next = [...prev]
      next[index] = text
      return next
    })
  }

  const handleAddParagraph = () => {
    setParagraphs((prev) => [...prev, ''])
  }

  const handleBulletChange = (index: number, text: string) => {
    setBullets((prev) => {
      const next = [...prev]
      next[index] = text
      return next
    })
  }

  const handleAddBullet = () => {
    setBullets((prev) => [...prev, ''])
  }

  return (
    <Box>
      <Tabs
        value={mode}
        onChange={(_, v) => setMode(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab value="builder" label={`${label} — конструктор`} />
        <Tab value="raw" label={`${label} — исходный HTML`} />
      </Tabs>

      {mode === 'builder' ? (
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Заголовок (h2)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Подзаголовок (h3)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            fullWidth
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Абзацы
            </Typography>
            <Stack spacing={1}>
              {paragraphs.map((p, idx) => (
                <TextField
                  key={idx}
                  label={`Абзац ${idx + 1}`}
                  value={p}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              ))}
              <Button size="small" onClick={handleAddParagraph}>
                Добавить абзац
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Список (bullet list)
            </Typography>
            <Stack spacing={1}>
              {bullets.map((b, idx) => (
                <TextField
                  key={idx}
                  label={`Пункт ${idx + 1}`}
                  value={b}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  fullWidth
                />
              ))}
              <Button size="small" onClick={handleAddBullet}>
                Добавить пункт
              </Button>
            </Stack>
          </Box>
        </Stack>
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


