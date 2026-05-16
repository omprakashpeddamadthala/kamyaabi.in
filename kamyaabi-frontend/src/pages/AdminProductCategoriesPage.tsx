import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminApi, CategoryRequest } from '../api/adminApi';
import { Category } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TableSkeleton from '../components/common/TableSkeleton';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCategories } from '../features/product/productSlice';

const slugify = (raw: string): string =>
  raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const AdminProductCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { categories: allCategories } = useAppSelector((state) => state.products);
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryRequest>({ name: '', slug: '', description: '', imageUrl: '', parentId: null });
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategoriesPaged(0, 100);
      setRows(res.data.data.content);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load categories').message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    dispatch(fetchCategories());
    loadRows();
  }, [dispatch, loadRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', imageUrl: '', parentId: null });
    setSlugManual(false);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId,
    });
    setSlugManual(true);
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      const payload: CategoryRequest = {
        ...form,
        slug: form.slug || undefined,
        parentId: form.parentId || null,
      };
      if (editingId) {
        await adminApi.updateCategory(editingId, payload);
        showSuccess('Category updated');
      } else {
        await adminApi.createCategory(payload);
        showSuccess('Category created');
      }
      setDialogOpen(false);
      dispatch(fetchCategories());
      loadRows();
    } catch (err) {
      showError(parseApiError(err, 'Failed to save category').message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.productCount > 0) {
      showError(`Cannot delete "${deleteTarget.name}" — ${deleteTarget.productCount} product(s) assigned.`);
      setConfirmOpen(false);
      return;
    }
    setConfirmLoading(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showSuccess('Category deleted');
      dispatch(fetchCategories());
      loadRows();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete category').message);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const parentOptions = allCategories.filter((c) => c.id !== editingId && !c.parentId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Product Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Category</Button>
      </Stack>

      <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Products</TableCell>
              <TableCell sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No categories yet</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.parentName || '—'}</TableCell>
                  <TableCell>{cat.productCount}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(cat)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => { setDeleteTarget(cat); setConfirmOpen(true); }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
            <TextField
              label="Slug" fullWidth value={form.slug || ''}
              onChange={(e) => { setForm({ ...form, slug: e.target.value }); setSlugManual(true); }}
              helperText="Leave empty to auto-generate"
            />
            <TextField label="Description" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="Image URL" fullWidth value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <TextField
              select label="Parent Category" fullWidth
              value={form.parentId ?? ''}
              onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
              SelectProps={{ native: true }}
            >
              <option value="">None (Top-level)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete category?"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={confirmLoading}
        destructive
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </Container>
  );
};

export default AdminProductCategoriesPage;
