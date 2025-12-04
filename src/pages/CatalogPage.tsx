import { useState } from 'react'
import { Box, Stack } from '@mui/material'
import CategoriesPage from './CategoriesPage'
import ProductsPage from './ProductsPage'

export default function CatalogPage() {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('')

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems="flex-start"
        sx={{ mt: 1 }}
      >
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}>
          <CategoriesPage onCategorySelect={setSelectedCategorySlug} />
        </Box>
        <Box
          sx={{
            flex: 1.5,
            minWidth: { xs: '100%', md: 360 },
            borderLeft: { md: '1px solid #e5e7eb' },
            pl: { md: 3 },
            mt: { xs: 2, md: 0 },
          }}
        >
          <ProductsPage externalCategorySlug={selectedCategorySlug} />
        </Box>
      </Stack>
    </Box>
  )
}


