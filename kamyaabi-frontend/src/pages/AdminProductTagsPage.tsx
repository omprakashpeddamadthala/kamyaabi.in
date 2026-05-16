import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, MergeType } from '@mui/icons-material';
import { adminProductTagApi, ProductTagRequest } from '../api/productTagApi';
import { ProductTag } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminProductTagsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductTagRequest>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductTag | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState<ProductTag | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<number | ''>('');
  const [merging, setMerging] = useState(false);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminProductTagApi.getAll();
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

  const openEdit = (tag: ProductTag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, slug: tag.slug });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminProductTagApi.update(editingId, form);
        showSuccess('Tag updated');
      } else {
        await adminProductTagApi.create(form);
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
      await adminProductTagApi.delete(deleteTarget.id);
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

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    setMerging(true);
    try {
      await adminProductTagApi.merge(mergeSource.id, Number(mergeTargetId));
      showSuccess(`Merged "${mergeSource.name}" into target tag`);
      setMergeOpen(false);
      setMergeSource(null);
      setMergeTargetId('');
      loadTags();
    } catch (err) {
      showError(parseApiError(err, 'Failed to merge tags').message);
    } finally {
      setMerging(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Product Tags</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Tag</Button>
      </Stack>

      <TableContainer component={Card} sx={{ '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Products</TableCell>
              <TableCell sx={{ width: 160 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No product tags yet</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{tag.name}</TableCell>
                  <TableCell>{tag.slug}</TableCell>
                  <TableCell>{tag.productCount ?? 0}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(tag)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Merge into another tag">
                        <IconButton size="small" onClick={() => { setMergeSource(tag); setMergeTargetId(''); setMergeOpen(true); }}>
                          <MergeType fontSize="small" />
                        </IconButton>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Tag' : 'New Tag'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Slug" fullWidth value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} helperText="Leave empty to auto-generate" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeOpen} onClose={() => setMergeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Merge Tag</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Merge &ldquo;{mergeSource?.name}&rdquo; into another tag. All products with this tag will be reassigned.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Target Tag</InputLabel>
            <Select
              label="Target Tag"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value as number)}
            >
              {tags.filter((t) => t.id !== mergeSource?.id).map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name} ({t.productCount ?? 0} products)</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMerge} disabled={merging || !mergeTargetId}>
            {merging ? 'Merging...' : 'Merge'}
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

export default AdminProductTagsPage;
