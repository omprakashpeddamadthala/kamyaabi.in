import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminBlogApi } from '../api/blogApi';
import { BlogTag } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/ToastProvider';
import InlineConfirmBar from '../components/admin/InlineConfirmBar';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminBlogTagsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
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
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Blog Tags</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/blog/tags/new')}>Add Tag</Button>
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

      <TableContainer component={Card} sx={{ overflowX: 'auto', '&:hover': { transform: 'none' } }}>
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
                        <IconButton size="small" aria-label={`Edit ${tag.name}`} onClick={() => navigate(`/admin/blog/tags/edit/${tag.id}`, { state: { tag } })}>
                          <Edit fontSize="small" />
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

export default AdminBlogTagsPage;
