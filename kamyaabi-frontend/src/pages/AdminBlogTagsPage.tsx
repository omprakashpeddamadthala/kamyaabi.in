import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminBlogApi, BlogTagRequest } from '../api/blogApi';
import { BlogTag } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminBlogTagsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlogTagRequest>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogTag | null>(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminBlogApi.getTags();
      setTags(res.data.data);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load tags').message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadTags(); }, [loadTags]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '' });
    setDialogOpen(true);
  };

  const openEdit = (tag: BlogTag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, slug: tag.slug, description: tag.description || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminBlogApi.updateTag(editingId, form);
        showSuccess('Tag updated');
      } else {
        await adminBlogApi.createTag(form);
        showSuccess('Tag created');
      }
      setDialogOpen(false);
      loadTags();
    } catch (err) {
      showError(parseApiError(err, 'Failed to save tag').message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setConfirmLoading(true);
    try {
      await adminBlogApi.deleteTag(deleteTarget.id);
      showSuccess('Tag deleted');
      loadTags();
    } catch (err) {
      showError(parseApiError(err, 'Failed to delete tag').message);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Blog Tags</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Tag</Button>
      </Stack>

      <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Posts</TableCell>
              <TableCell sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No blog tags yet</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{tag.name}</TableCell>
                  <TableCell>{tag.slug}</TableCell>
                  <TableCell>{tag.postCount}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(tag)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => { setDeleteTarget(tag); setConfirmOpen(true); }}>
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
        <DialogTitle>{editingId ? 'Edit Tag' : 'New Tag'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Slug" fullWidth value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} helperText="Leave empty to auto-generate" />
            <TextField label="Description" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
        title="Delete tag?"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={confirmLoading}
        destructive
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </Container>
  );
};

export default AdminBlogTagsPage;
