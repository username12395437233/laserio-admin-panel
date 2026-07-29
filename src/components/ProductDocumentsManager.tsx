import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Alert, Box, Button, CircularProgress, IconButton, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { DeleteOutline, OpenInNew, UploadFile } from "@mui/icons-material";
import api from "../api/client";
import { resolveAssetUrl } from "../utils/resolveAssetUrl";

interface ProductDocument { id: string; url: string; filename?: string; size?: number }
interface ProductDocumentsResponse { docs: ProductDocument[] }

interface ProductDocumentsManagerProps {
  productId: number | null | undefined;
  onDocumentsChanged?: () => void | Promise<void>;
}

function formatSize(size?: number) {
  if (!size) return undefined;
  return `${(size / 1024 / 1024).toFixed(size >= 1024 * 1024 ? 1 : 2)} МБ`;
}

export function ProductDocumentsManager({ productId, onDocumentsChanged }: ProductDocumentsManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!productId) { setDocuments([]); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<ProductDocumentsResponse>(`/admin/products/${productId}/docs`);
      setDocuments(data.docs || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Не удалось загрузить файлы товара.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadDocuments(); }, [productId]);

  const changed = async () => { await loadDocuments(); await onDocumentsChanged?.(); };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!productId || files.length === 0) return;
    if (files.length > 20) { setError("За один раз можно загрузить не более 20 PDF-файлов."); return; }
    setUploading(true); setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await api.post(`/admin/products/${productId}/docs`, formData);
      await changed();
    } catch (err: any) {
      setError(err?.response?.data?.error === "PDF_REQUIRED" ? "Можно загрузить только PDF-файлы." : err?.response?.data?.message || "Не удалось загрузить файлы товара.");
    } finally { setUploading(false); }
  };

  const handleDelete = async (document: ProductDocument) => {
    if (!productId || !window.confirm(`Удалить файл «${document.filename || "без названия"}»?`)) return;
    setDeletingId(document.id); setError(null);
    try {
      await api.delete(`/admin/products/${productId}/docs/${document.id}`);
      await changed();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Не удалось удалить файл товара.");
    } finally { setDeletingId(null); }
  };

  if (!productId) return <Alert severity="info">Сначала сохраните товар, затем можно прикрепить PDF-файлы.</Alert>;

  return <Stack spacing={1.5}>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={handleUpload} />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
      <Button variant="outlined" startIcon={uploading ? <CircularProgress size={16} /> : <UploadFile />} onClick={() => inputRef.current?.click()} disabled={uploading || Boolean(deletingId)}>
        {uploading ? "Загрузка..." : "Добавить файлы"}
      </Button>
      <Typography variant="body2" color="text.secondary">До 20 PDF-файлов за один раз.</Typography>
    </Stack>
    {error && <Alert severity="error">{error}</Alert>}
    {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={28} /></Box>
      : documents.length === 0 ? <Typography variant="body2" color="text.secondary">Прикреплённых PDF-файлов пока нет.</Typography>
      : <List disablePadding>{documents.map((document) => <ListItem key={document.id} disableGutters divider secondaryAction={<Stack direction="row" spacing={0.5}>
        <IconButton component="a" href={resolveAssetUrl(document.url)} target="_blank" rel="noreferrer" size="small" aria-label="Открыть файл"><OpenInNew fontSize="small" /></IconButton>
        <IconButton color="error" size="small" aria-label="Удалить файл" disabled={uploading || deletingId === document.id} onClick={() => handleDelete(document)}>{deletingId === document.id ? <CircularProgress size={16} /> : <DeleteOutline fontSize="small" />}</IconButton>
      </Stack>}><ListItemText primary={document.filename || "PDF-файл"} secondary={formatSize(document.size)} /></ListItem>)}</List>}
  </Stack>;
}
