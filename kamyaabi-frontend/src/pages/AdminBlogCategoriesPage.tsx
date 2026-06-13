import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminBlogApi } from '../api/blogApi';
import { BlogCategory } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/useToast';
import InlineConfirmBar from '../components/admin/InlineConfirmBar';
import TableSkeleton from '../components/common/TableSkeleton';

const AdminBlogCategoriesPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
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
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Blog Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/blog/categories/new')}>Add Category</Button>
      </Stack>

      <InlineConfirmBar
        open={!!deleteTarget}
        title="Delete category?"
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
                        <IconButton size="small" aria-label={`Edit ${cat.name}`} onClick={() => navigate(`/admin/blog/categories/edit/${cat.id}`, { state: { category: cat } })}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" aria-label={`Delete ${cat.name}`} onClick={() => setDeleteTarget(cat)}>
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

export default AdminBlogCategoriesPage;
