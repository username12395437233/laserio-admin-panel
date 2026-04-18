import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  DeleteOutline,
  Refresh,
  Star,
  StarBorder,
  UploadFile,
} from "@mui/icons-material";
import api from "../api/client";
import { resolveAssetUrl } from "../utils/resolveAssetUrl";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sort?: number;
  mime?: string;
  size?: number;
  filename?: string;
  is_primary?: boolean;
}

interface ProductImagesResponse {
  product_id: number;
  primary_image_url: string | null;
  images: ProductImage[];
  total: number;
}

interface ProductImagesManagerProps {
  productId: number | null | undefined;
  onImagesChanged?: () => void | Promise<void>;
}

export function ProductImagesManager({
  productId,
  onImagesChanged,
}: ProductImagesManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  const loadImages = async () => {
    if (!productId) {
      setImages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<ProductImagesResponse>(
        `/admin/products/${productId}/images`,
      );

      const sorted = [...(data.images || [])].sort((a, b) => {
        const primaryDiff =
          Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary));
        if (primaryDiff !== 0) return primaryDiff;

        return Number(a.sort ?? 0) - Number(b.sort ?? 0);
      });

      setImages(sorted);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось загрузить фотографии товара.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [productId]);

  const notifyChanged = async () => {
    await loadImages();

    if (onImagesChanged) {
      await onImagesChanged();
    }
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!productId || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const baseSort = images.length;

      for (const [index, file] of files.entries()) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", file.name.replace(/\.[^.]+$/, ""));
        formData.append("sort", String(baseSort + index));

        await api.post(`/admin/products/${productId}/images`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await notifyChanged();
    } catch (err: any) {
      const code = err?.response?.data?.error;

      const message =
        code === "PRODUCT_NOT_FOUND"
          ? "Товар не найден."
          : code === "FILE_REQUIRED"
            ? "Файл не был передан."
            : err?.response?.data?.message ||
              "Не удалось загрузить фотографию.";

      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleMakePrimary = async (imageId: string) => {
    if (!productId) return;

    setBusyImageId(imageId);
    setError(null);

    try {
      await api.patch(`/admin/products/${productId}/images/${imageId}/primary`);
      await notifyChanged();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось сделать фото главным.";

      setError(message);
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!productId) return;

    const ok = window.confirm("Удалить это фото?");
    if (!ok) return;

    setBusyImageId(imageId);
    setError(null);

    try {
      await api.delete(`/admin/products/${productId}/images/${imageId}`);
      await notifyChanged();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось удалить фото.";

      setError(message);
    } finally {
      setBusyImageId(null);
    }
  };

  if (!productId) {
    return (
      <Alert severity="info">
        Сначала сохрани товар, потом можно загрузить фотографии.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFilesSelected}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Button
          variant="outlined"
          startIcon={
            uploading ? <CircularProgress size={16} /> : <UploadFile />
          }
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Загрузка..." : "Загрузить фото"}
        </Button>

        <Button
          variant="text"
          startIcon={<Refresh />}
          onClick={loadImages}
          disabled={loading || uploading}
        >
          Обновить
        </Button>

        <Typography variant="body2" color="text.secondary">
          Можно выбрать несколько файлов сразу.
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack direction="row" justifyContent="center" sx={{ py: 3 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : images.length === 0 ? (
        <Alert severity="info">У товара пока нет фотографий.</Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {images.map((image) => (
            <Paper key={image.id} variant="outlined" sx={{ p: 1.5 }}>
              <Box
                component="img"
                src={resolveAssetUrl(image.url)}
                alt={image.alt || image.filename || "Фото товара"}
                sx={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ mt: 1 }}
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {image.filename || image.id}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {image.is_primary ? "Главное фото" : "Дополнительное фото"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    color={image.is_primary ? "warning" : "default"}
                    onClick={() => handleMakePrimary(image.id)}
                    disabled={busyImageId === image.id || uploading}
                  >
                    {image.is_primary ? (
                      <Star fontSize="small" />
                    ) : (
                      <StarBorder fontSize="small" />
                    )}
                  </IconButton>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(image.id)}
                    disabled={busyImageId === image.id || uploading}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              {image.alt ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {image.alt}
                </Typography>
              ) : null}
            </Paper>
          ))}
        </Box>
      )}
    </Stack>
  );
}
