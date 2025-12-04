import { useRef, useState } from 'react'
import { Box, Stack } from '@mui/material'
import CategoriesPage, { type CategoriesPageHandle } from './CategoriesPage'
import ProductsPage from './ProductsPage'

export default function CatalogPage() {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('')
  const categoriesRef = useRef<CategoriesPageHandle | null>(null)

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems="flex-start"
        sx={{ mt: 1 }}
      >
        <Box sx={{ flex: 1.1, minWidth: { xs: '100%', md: 340 } }}>
          <CategoriesPage ref={categoriesRef} onCategorySelect={setSelectedCategorySlug} />
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
            onProductsChanged={() => categoriesRef.current?.reload()}
          />
        </Box>
      </Stack>
    </Box>
  )
}


