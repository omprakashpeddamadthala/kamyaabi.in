import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip, Collapse,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, MergeType, Close } from '@mui/icons-material';
import { adminProductTagApi } from '../api/productTagApi';
import { ProductTag } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/useToast';
import InlineConfirmBar from '../components/admin/InlineConfirmBar';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminProductTagsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProductTag | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
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
      setDeleteTarget(null);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    setMerging(true);
    try {
      await adminProductTagApi.merge(mergeSource.id, Number(mergeTargetId));
      showSuccess(`Merged "${mergeSource.name}" into target tag`);
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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Product Tags</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/products/tags/new')}>Add Tag</Button>
      </Stack>

      <InlineConfirmBar
        open={!!deleteTarget}
        title="Delete tag?"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Collapse in={!!mergeSource} unmountOnExit>
        <Card sx={{ p: 2, mb: 2, '&:hover': { transform: 'none' } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Merge &ldquo;{mergeSource?.name}&rdquo; into another tag
            </Typography>
            <IconButton size="small" aria-label="Cancel merge" onClick={() => { setMergeSource(null); setMergeTargetId(''); }}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All products with this tag will be reassigned to the selected target tag.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <FormControl fullWidth sx={{ maxWidth: { sm: 360 } }}>
              <InputLabel id="merge-target-label">Target tag</InputLabel>
              <Select
                labelId="merge-target-label"
                label="Target tag"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value as number)}
              >
                {tags.filter((t) => t.id !== mergeSource?.id).map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name} ({t.productCount ?? 0} products)</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleMerge} disabled={merging || !mergeTargetId}>
                {merging ? 'Merging…' : 'Merge'}
              </Button>
              <Button onClick={() => { setMergeSource(null); setMergeTargetId(''); }}>Cancel</Button>
            </Stack>
          </Stack>
        </Card>
      </Collapse>

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
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
                        <IconButton size="small" aria-label={`Edit ${tag.name}`} onClick={() => navigate(`/admin/products/tags/edit/${tag.id}`, { state: { tag } })}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Merge into another tag">
                        <IconButton size="small" aria-label={`Merge ${tag.name}`} onClick={() => { setMergeSource(tag); setMergeTargetId(''); }}>
                          <MergeType fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" aria-label={`Delete ${tag.name}`} onClick={() => setDeleteTarget(tag)}>
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
    </Container>
  );
};

export default AdminProductTagsPage;
