import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, TextField, MenuItem, Skeleton } from '@mui/material';
import { adminBlogApi, BlogCategoryRequest } from '../../api/blogApi';
import { BlogCategory } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/useToast';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

const LIST_PATH = '/admin/blog/categories';

const AdminBlogCategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const prefill = (location.state as { category?: BlogCategory } | null)?.category ?? null;

  const [loading, setLoading] = useState<boolean>(Boolean(editingId) && !prefill);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<BlogCategory[]>([]);
  const [form, setForm] = useState<BlogCategoryRequest>(
    prefill
      ? { name: prefill.name, slug: prefill.slug, description: prefill.description || '', parentId: prefill.parentId }
      : { name: '' },
  );
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminBlogApi
      .getCategories()
      .then((res) => {
        if (!active) return;
        const all = res.data.data;
        setAllCategories(all);
        if (editingId && !prefill) {
          const found = all.find((c) => c.id === editingId);
          if (found) {
            setForm({ name: found.name, slug: found.slug, description: found.description || '', parentId: found.parentId });
          } else {
            setLoadError('Category not found. It may have been removed.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!active) return;
        if (editingId && !prefill) {
          setLoadError(parseApiError(err, 'Failed to load category').message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [editingId, prefill]);

  const parentOptions = useMemo(
    () => allCategories.filter((c) => c.id !== editingId && !c.parentId),
    [allCategories, editingId],
  );

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      if (editingId) {
        await adminBlogApi.updateCategory(editingId, form);
        showSuccess('Category updated');
      } else {
        await adminBlogApi.createCategory(form);
        showSuccess('Category created');
      }
      navigate(LIST_PATH);
    } catch (err) {
      showError(parseApiError(err, 'Failed to save category').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingId ? 'Edit Category' : 'New Category'}
      subtitle="Blog categories organise posts on the storefront blog."
      onSubmit={handleSave}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingId ? 'Update category' : 'Create category'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load category"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Name"
          fullWidth
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={!!nameError}
          helperText={nameError}
        />
        <TextField
          label="Slug"
          fullWidth
          value={form.slug || ''}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          helperText="Leave empty to auto-generate"
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={2}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <TextField
          select
          label="Parent Category"
          fullWidth
          value={form.parentId ?? ''}
          onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
        >
          <MenuItem value="">None (Top-level)</MenuItem>
          {parentOptions.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>
      </Box>
    </AdminFormShell>
  );
};

export default AdminBlogCategoryFormPage;
