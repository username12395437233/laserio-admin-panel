import { useEffect, useMemo, useState, useRef } from "react";
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
  Pagination,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutline,
  Edit,
  Refresh,
  UploadFile,
} from "@mui/icons-material";
import api from "../api/client";
import { slugify } from "../utils/slugify";
import {
  ProductEditor,
  type ProductEditorHandle,
} from "../components/ProductEditor";

import { ProductImagesManager } from "../components/ProductImagesManager";
import { resolveAssetUrl } from "../utils/resolveAssetUrl";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

interface ProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ProductsPaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  doc_url: string | null;
}

interface ProductDetail extends ProductListItem {
  content_html: string | null;
  specs_html: string | null;
  category_id: number;
}

interface ProductFormState {
  name: string;
  slug: string;
  content_html: string;
  specs_html: string;
  category_id: number | "";
}

interface ProductPayload {
  name?: string;
  slug?: string;
  price?: number;
  category_id?: number;
  content_html?: string;
  specs_html?: string;
}

interface ProductsPageProps {
  externalCategorySlug?: string;
  onProductsChanged?: () => void;
}

function resolveDocUrl(url?: string | null) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = String(api.defaults.baseURL || window.location.origin);
  const origin = new URL(base, window.location.origin).origin;

  return new URL(url, origin).toString();
}

export default function ProductsPage(props: ProductsPageProps) {
  const { externalCategorySlug, onProductsChanged } = props;
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState<ProductsPaginationState>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentProduct, setCurrentProduct] = useState<ProductDetail | null>(
    null,
  );
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    slug: "",
    content_html: "",
    specs_html: "",
    category_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );
  const [deleteProductError, setDeleteProductError] = useState<string | null>(
    null,
  );

  const [deletingDoc, setDeletingDoc] = useState(false);
  const [docActionError, setDocActionError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const [jsonSnippet, setJsonSnippet] = useState("");
  const [jsonSnippetError, setJsonSnippetError] = useState<string | null>(null);
  const [slugDirty, setSlugDirty] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const productEditorRef = useRef<ProductEditorHandle | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === selectedCategorySlug) ?? null,
    [categories, selectedCategorySlug],
  );

  useEffect(() => {
    if (externalCategorySlug) {
      setSelectedCategorySlug(externalCategorySlug);
      setPage(1);
    }
  }, [externalCategorySlug]);

  // авто‑генерация slug из name, пока пользователь сам не менял slug
  useEffect(() => {
    if (!slugDirty) {
      setForm((prev) => {
        const auto = slugify(prev.name || "");
        if (!auto || prev.slug === auto) return prev;
        return { ...prev, slug: auto };
      });
    }
  }, [form.name, slugDirty]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const { data } = await api.get<CategoryOption[]>("/categories/");
      setCategories(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Не удалось загрузить список категорий.";
      setCategoriesError(message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProducts = async (
    slug: string,
    nextPage: number = page,
    nextLimit: number = limit,
  ) => {
    if (!slug) {
      setProducts([]);
      setPagination({
        page: 1,
        limit: nextLimit,
        total: 0,
        pages: 0,
      });
      return;
    }

    setProductsLoading(true);
    setProductsError(null);

    try {
      const { data } = await api.get<ProductsResponse>("/products", {
        params: {
          category: slug,
          page: nextPage,
          limit: nextLimit,
        },
      });

      if (data.pagination.total === 0 && nextPage !== 1) {
        setPage(1);
        return;
      }

      if (data.pagination.pages > 0 && nextPage > data.pagination.pages) {
        setPage(data.pagination.pages);
        return;
      }

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось загрузить товары для выбранной категории.";
      setProductsError(message);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategorySlug) {
      loadProducts(selectedCategorySlug, page, limit);
    } else {
      setProducts([]);
      setPagination({
        page: 1,
        limit,
        total: 0,
        pages: 0,
      });
    }
  }, [selectedCategorySlug, page, limit]);

  const handleChangeCategory = (event: any) => {
    setSelectedCategorySlug(event.target.value);
    setPage(1);
  };

  const handleChangeLimit = (event: any) => {
    setLimit(Number(event.target.value) || 50);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setCurrentProduct(null);
    setForm({
      name: "",
      slug: "",
      content_html: "",
      specs_html: "",
      category_id: selectedCategory?.id ?? "",
    });
    setJsonSnippet("");
    setJsonSnippetError(null);
    setSlugDirty(false);
    setEditorKey((k) => k + 1);
    setSaveError(null);
    setDocActionError(null);
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (product: ProductListItem) => {
    const confirmed = window.confirm(`Удалить товар "${product.name}"?`);
    if (!confirmed) return;

    setDeletingProductId(product.id);
    setDeleteProductError(null);

    try {
      await api.delete(`/admin/products/${product.id}`);

      if (dialogMode === "edit" && currentProduct?.id === product.id) {
        setDialogOpen(false);
        setCurrentProduct(null);
      }

      if (selectedCategorySlug) {
        await loadProducts(selectedCategorySlug, page, limit);
      }

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось удалить товар.";

      setDeleteProductError(message);
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOpenEdit = async (product: ProductListItem) => {
    setDialogMode("edit");
    setSaveError(null);

    try {
      const { data } = await api.get<ProductDetail>(
        `/products/${product.slug}`,
      );
      setCurrentProduct(data);
      setForm({
        name: data.name,
        slug: data.slug,
        content_html: data.content_html ?? "",
        specs_html: data.specs_html ?? "",
        category_id: data.category_id,
      });
      const snippet = JSON.stringify(
        {
          name: data.name,
          slug: data.slug,
          category_id: data.category_id,
          content_html: data.content_html ?? "",
          specs_html: data.specs_html ?? "",
        },
        null,
        2,
      );
      setJsonSnippet(snippet);
      setJsonSnippetError(null);
      setSlugDirty(true);
      setEditorKey((k) => k + 1);
      setDialogOpen(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось загрузить данные товара.";
      setSaveError(message);
    }
  };

  const handleFormChange =
    (field: keyof ProductFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "category_id"
          ? Number(event.target.value) || ""
          : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === "slug") {
        setSlugDirty(true);
      }
    };

  const applyJsonToProductForm = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as Partial<{
        name: string;
        slug: string;
        category_id: number;
        content_html: string;
        specs_html: string;
      }>;

      setJsonSnippet(raw);
      setJsonSnippetError(null);

      setForm((prev) => ({
        ...prev,
        name: parsed.name ?? prev.name,
        slug: parsed.slug ?? prev.slug,
        content_html:
          typeof parsed.content_html === "string"
            ? parsed.content_html
            : prev.content_html,
        specs_html:
          typeof parsed.specs_html === "string"
            ? parsed.specs_html
            : prev.specs_html,
        category_id:
          typeof parsed.category_id === "number"
            ? parsed.category_id
            : prev.category_id,
      }));
      if (typeof parsed.slug === "string" && parsed.slug) {
        setSlugDirty(true);
      }
    } catch (err) {
      setJsonSnippetError("Не удалось разобрать JSON. Проверь формат.");
    }
  };

  const handlePasteJsonFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setJsonSnippetError("В буфере обмена нет текста.");
        return;
      }
      applyJsonToProductForm(text);
    } catch (err) {
      setJsonSnippetError("Нет доступа к буферу обмена.");
    }
  };

  const handleApplyJsonFromInput = () => {
    if (!jsonSnippet.trim()) {
      setJsonSnippetError("Поле с JSON пустое.");
      return;
    }
    applyJsonToProductForm(jsonSnippet);
  };

  const handleDeleteDoc = async () => {
    if (!currentProduct) return;

    const confirmed = window.confirm(
      "Удалить прикреплённый файл у этого товара?",
    );
    if (!confirmed) return;

    setDeletingDoc(true);
    setDocActionError(null);

    try {
      await api.delete(`/admin/products/${currentProduct.id}/doc`);

      setCurrentProduct((prev) =>
        prev
          ? {
              ...prev,
              doc_url: null,
            }
          : prev,
      );

      if (selectedCategorySlug) {
        await loadProducts(selectedCategorySlug, page, limit);
      }

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (err: any) {
      const code = err?.response?.data?.error;

      const message =
        code === "NOT_FOUND"
          ? "Товар не найден."
          : err?.response?.data?.message || "Не удалось удалить файл товара.";

      setDocActionError(message);
    } finally {
      setDeletingDoc(false);
    }
  };

  const handleUploadDoc = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!currentProduct || files.length === 0) return;

    if (files.length > 20) {
      setDocActionError("За один раз можно загрузить не более 20 PDF-файлов.");
      return;
    }

    setUploadingDoc(true);
    setDocActionError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const { data } = await api.post(
        `/admin/products/${currentProduct.id}/docs`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setCurrentProduct((prev) =>
        prev
          ? {
              ...prev,
              doc_url: data?.doc_url ?? null,
            }
          : prev,
      );

      if (selectedCategorySlug) {
        await loadProducts(selectedCategorySlug, page, limit);
      }

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (err: any) {
      const code = err?.response?.data?.error;

      const message =
        code === "PDF_REQUIRED"
          ? "Можно загрузить только PDF-файл."
          : code === "FILE_REQUIRED"
            ? "Файл не был передан."
            : code === "PRODUCT_NOT_FOUND"
              ? "Товар не найден."
              : err?.response?.data?.message ||
                "Не удалось загрузить файл товара.";

      setDocActionError(message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleImagesChanged = async () => {
    if (selectedCategorySlug) {
      await loadProducts(selectedCategorySlug, page, limit);
    }

    if (onProductsChanged) {
      onProductsChanged();
    }
  };

  const handleSave = async () => {
    if (
      !form.name ||
      !form.slug ||
      !form.category_id ||
      typeof form.category_id !== "number"
    ) {
      setSaveError("Название, slug и категория обязательны.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      let contentHtml = form.content_html;
      let specsHtml = form.specs_html;

      if (productEditorRef.current) {
        const value = productEditorRef.current.getValue();
        contentHtml = value.content_html;
        specsHtml = value.specs_html;
      }

      const payload: ProductPayload = {
        name: form.name || undefined,
        slug: form.slug || undefined,
        price: 0,
        category_id:
          typeof form.category_id === "number" ? form.category_id : undefined,
        content_html: contentHtml || undefined,
        specs_html: specsHtml || undefined,
      };

      if (dialogMode === "create") {
        await api.post("/admin/products", payload);
      } else if (dialogMode === "edit" && currentProduct) {
        await api.patch(`/admin/products/${currentProduct.id}`, payload);
      }

      setDialogOpen(false);

      if (selectedCategorySlug) {
        await loadProducts(selectedCategorySlug, page, limit);
      }

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось сохранить товар.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle =
    dialogMode === "create" ? "Новый товар" : "Редактирование товара";

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Товары
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите категорию, чтобы увидеть товары. Можно добавлять и
            редактировать описание.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() =>
              selectedCategorySlug &&
              loadProducts(selectedCategorySlug, page, limit)
            }
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

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
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

        <FormControl
          sx={{ width: 180 }}
          size="small"
          disabled={!selectedCategorySlug}
        >
          <InputLabel id="products-limit-label">Товаров на странице</InputLabel>
          <Select
            labelId="products-limit-label"
            label="Товаров на странице"
            value={String(limit)}
            onChange={handleChangeLimit}
          >
            {[50, 100, 150].map((value) => (
              <MenuItem key={value} value={value}>
                {value} / стр.
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedCategorySlug && (
          <Typography variant="body2" color="text.secondary">
            Всего товаров: {pagination.total}
          </Typography>
        )}
      </Stack>

      {categoriesLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {categoriesError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {categoriesError}
        </Alert>
      )}

      {selectedCategorySlug && productsLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {productsError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {productsError}
        </Alert>
      )}

      {deleteProductError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {deleteProductError}
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
            <>
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Фото</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Slug</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        {product.image ? (
                          <Box
                            component="img"
                            src={resolveAssetUrl(product.image)}
                            alt={product.name}
                            sx={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              display: "block",
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.slug}</TableCell>
                      <TableCell align="right">{product.price}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleOpenEdit(product)}
                            disabled={deletingProductId === product.id}
                          >
                            Редактировать
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutline />}
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId === product.id}
                          >
                            {deletingProductId === product.id
                              ? "Удаление..."
                              : "Удалить"}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Страница {pagination.page} из {pagination.pages}. Показано{" "}
                    {products.length} из {pagination.total} товаров.
                  </Typography>

                  <Pagination
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={(_, value) => setPage(value)}
                  />
                </Stack>
              )}
            </>
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack spacing={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  Вставь в меня JSON, чтобы заполнить описание и характеристики
                  товара.
                </Typography>
                <Button size="small" onClick={handlePasteJsonFromClipboard}>
                  Вставить из буфера
                </Button>
              </Stack>
              <TextField
                placeholder="Вставь в меня"
                value={jsonSnippet}
                onChange={(e) => setJsonSnippet(e.target.value)}
                multiline
                minRows={3}
                maxRows={3}
                fullWidth
              />
              <Box>
                <Button size="small" onClick={handleApplyJsonFromInput}>
                  Применить JSON
                </Button>
              </Box>
              {jsonSnippetError && (
                <Alert severity="error">{jsonSnippetError}</Alert>
              )}
            </Stack>

            <FormControl fullWidth size="small">
              <InputLabel id="product-category-select-label">
                Категория
              </InputLabel>
              <Select
                labelId="product-category-select-label"
                label="Категория"
                value={form.category_id === "" ? "" : String(form.category_id)}
                onChange={(event) =>
                  handleFormChange("category_id")(
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
              onChange={handleFormChange("name")}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={handleFormChange("slug")}
              fullWidth
              required
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Файл товара
              </Typography>

              <input
                ref={docInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                hidden
                onChange={handleUploadDoc}
              />

              {dialogMode === "create" ? (
                <Alert severity="info">
                  Сначала сохрани товар, потом можно загрузить PDF-файл.
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<UploadFile />}
                      onClick={() => docInputRef.current?.click()}
                      disabled={uploadingDoc || deletingDoc}
                    >
                      {uploadingDoc ? "Загрузка..." : "Добавить файлы"}
                    </Button>

                    {currentProduct?.doc_url ? (
                      <>
                        <Button
                          component="a"
                          href={resolveDocUrl(currentProduct.doc_url)}
                          target="_blank"
                          rel="noreferrer"
                          variant="outlined"
                          disabled={uploadingDoc || deletingDoc}
                        >
                          Открыть файл
                        </Button>

                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutline />}
                          onClick={handleDeleteDoc}
                          disabled={uploadingDoc || deletingDoc}
                        >
                          {deletingDoc ? "Удаление..." : "Удалить файл"}
                        </Button>
                      </>
                    ) : null}
                  </Stack>

                  {!currentProduct?.doc_url && (
                    <Typography variant="body2" color="text.secondary">
                      У товара пока нет прикреплённого PDF-файла.
                    </Typography>
                  )}

                  {docActionError && (
                    <Alert severity="error">{docActionError}</Alert>
                  )}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Описание и характеристики (визуальный редактор)
              </Typography>
              <ProductEditor
                key={editorKey}
                ref={productEditorRef}
                mode="product"
                initialContentHtml={form.content_html}
                initialSpecsHtml={form.specs_html}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Фотографии товара
              </Typography>

              <ProductImagesManager
                productId={dialogMode === "edit" ? currentProduct?.id : null}
                onImagesChanged={handleImagesChanged}
              />
            </Box>

            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
