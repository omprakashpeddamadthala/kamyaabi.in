import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, TextField, Skeleton } from '@mui/material';
import { adminBlogApi, BlogTagRequest } from '../../api/blogApi';
import { BlogTag } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

const LIST_PATH = '/admin/blog/tags';

const AdminBlogTagFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const prefill = (location.state as { tag?: BlogTag } | null)?.tag ?? null;

  const [loading, setLoading] = useState<boolean>(Boolean(editingId) && !prefill);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BlogTagRequest>(
    prefill ? { name: prefill.name, slug: prefill.slug, description: prefill.description || '' } : { name: '' },
  );
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId || prefill) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    adminBlogApi
      .getTags()
      .then((res) => {
        if (!active) return;
        const found = res.data.data.find((t) => t.id === editingId);
        if (found) {
          setForm({ name: found.name, slug: found.slug, description: found.description || '' });
        } else {
          setLoadError('Tag not found. It may have been removed.');
        }
      })
      .catch((err) => {
        if (active) setLoadError(parseApiError(err, 'Failed to load tag').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editingId, prefill]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      if (editingId) {
        await adminBlogApi.updateTag(editingId, form);
        showSuccess('Tag updated');
      } else {
        await adminBlogApi.createTag(form);
        showSuccess('Tag created');
      }
      navigate(LIST_PATH);
    } catch (err) {
      showError(parseApiError(err, 'Failed to save tag').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={180} height={40} />
        <Skeleton variant="rounded" height={280} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingId ? 'Edit Tag' : 'New Tag'}
      subtitle="Blog tags label posts for discovery on the storefront blog."
      onSubmit={handleSave}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingId ? 'Update tag' : 'Create tag'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load tag"
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
      </Box>
    </AdminFormShell>
  );
};

export default AdminBlogTagFormPage;
