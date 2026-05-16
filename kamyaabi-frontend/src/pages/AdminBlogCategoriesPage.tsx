import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Typography, Box, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminBlogApi, BlogCategoryRequest } from '../api/blogApi';
import { BlogCategory } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminBlogCategoriesPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlogCategoryRequest>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminBlogApi.getCategories();
      setCategories(res.data.data);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load categories').message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '' });
    setDialogOpen(true);
  };

  const openEdit = (cat: BlogCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminBlogApi.updateCategory(editingId, form);
        showSuccess('Category updated');
      } else {
        await adminBlogApi.createCategory(form);
        showSuccess('Category created');
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      showError(parseApiError(err, 'Failed to save category').message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setConfirmLoading(true);
    try {
      await adminBlogApi.deleteCategory(deleteTarget.id);
      showSuccess('Category deleted');
      loadCategories();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete category').message);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const parentOptions = categories.filter((c) => c.id !== editingId && !c.parentId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Blog Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Category</Button>
      </Stack>

      <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Posts</TableCell>
              <TableCell sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No blog categories yet</Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.parentName || '—'}</TableCell>
                  <TableCell>{cat.postCount}</TableCell>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Slug" fullWidth value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} helperText="Leave empty to auto-generate" />
            <TextField label="Description" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField
              select
              label="Parent Category"
              fullWidth
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

export default AdminBlogCategoriesPage;
