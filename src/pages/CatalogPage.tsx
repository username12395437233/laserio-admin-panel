import { useRef, useState } from 'react'
import { Box, Stack, Tab, Tabs } from '@mui/material'
import CategoriesPage, { type CategoriesPageHandle } from './CategoriesPage'
import ProductsPage from './ProductsPage'
import SearchTab from './SearchTab'

export default function CatalogPage() {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('')
  const [categoriesVersion, setCategoriesVersion] = useState(0)
  const categoriesRef = useRef<CategoriesPageHandle | null>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'search'>('main')

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab value="main" label="Основная" />
        <Tab value="search" label="Поиск" />
      </Tabs>

      {activeTab === 'main' && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="flex-start"
          sx={{ mt: 1 }}
        >
          <Box sx={{ flex: 1.1, minWidth: { xs: '100%', md: 340 } }}>
            <CategoriesPage
              ref={categoriesRef}
              onCategorySelect={setSelectedCategorySlug}
              onCategoriesChanged={() => setCategoriesVersion((version) => version + 1)}
            />
          </Box>
          <Box
            sx={{
              flex: 2,
              minWidth: { xs: '100%', md: 420 },
              borderLeft: { md: '1px solid #e5e7eb' },
              pl: { md: 3 },
              mt: { xs: 2, md: 0 },
            }}
          >
            <ProductsPage
              externalCategorySlug={selectedCategorySlug}
              categoriesVersion={categoriesVersion}
              onProductsChanged={() => categoriesRef.current?.reload()}
            />
          </Box>
        </Stack>
      )}

      {activeTab === 'search' && (
        <Box sx={{ mt: 2 }}>
          <SearchTab />
        </Box>
      )}
    </Box>
  )
}

