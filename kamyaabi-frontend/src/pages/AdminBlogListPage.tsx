import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, Typography, Box, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Pagination, Stack, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import {
  Add, Edit, Delete, Publish, Unpublished, Search as SearchIcon, OpenInNew,
} from '@mui/icons-material';
import { adminBlogApi } from '../api/blogApi';
import { BlogPost, BlogPostStatus } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/useToast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TableSkeleton from '../components/common/TableSkeleton';

const statusColor: Record<BlogPostStatus, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success',
  SCHEDULED: 'warning',
  DRAFT: 'default',
};

const AdminBlogListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get('page') || '1') - 1);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminBlogApi.getPosts({
        page,
        size: 10,
        status: statusFilter || undefined,
        q: searchQuery || undefined,
      });
      setPosts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showError(parseApiError(err, 'Failed to load posts').message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, showError]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleSearch = () => setSearchQuery(searchInput.trim());

  const handlePublish = (post: BlogPost) => {
    setPendingAction({
      title: 'Publish post?',
      message: `Publish "${post.title}" immediately?`,
      action: async () => {
        await adminBlogApi.publishPost(post.id);
        showSuccess('Post published');
        loadPosts();
      },
    });
    setConfirmOpen(true);
  };

  const handleUnpublish = (post: BlogPost) => {
    setPendingAction({
      title: 'Unpublish post?',
      message: `Revert "${post.title}" to draft?`,
      action: async () => {
        await adminBlogApi.unpublishPost(post.id);
        showSuccess('Post unpublished');
        loadPosts();
      },
    });
    setConfirmOpen(true);
  };

  const handleDelete = (post: BlogPost) => {
    setPendingAction({
      title: 'Delete post?',
      message: `Are you sure you want to permanently delete "${post.title}"? This cannot be undone.`,
      action: async () => {
        await adminBlogApi.deletePost(post.id);
        showSuccess('Post deleted');
        loadPosts();
      },
    });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setConfirmLoading(true);
    try {
      await pendingAction.action();
    } catch (err) {
      showError(parseApiError(err, 'Action failed').message);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Blog Posts</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/blog/new')}>
          New Post
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="PUBLISHED">Published</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Card} className="responsive-table" sx={{ '&:hover': { transform: 'none' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Views</TableCell>
              <TableCell sx={{ width: 200 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No blog posts found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell data-label="Title">
                    <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </Typography>
                  </TableCell>
                  <TableCell data-label="Category">
                    {post.categories.map((c) => (
                      <Chip key={c.id} label={c.name} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell data-label="Status">
                    <Chip label={post.status} size="small" color={statusColor[post.status]} />
                  </TableCell>
                  <TableCell data-label="Published">{formatDate(post.publishedAt)}</TableCell>
                  <TableCell data-label="Views">{post.viewCount}</TableCell>
                  <TableCell data-label="Actions">
                    <Stack direction="row" spacing={0.5} justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Preview">
                        <IconButton size="small" component="a" href={`/blog/${post.slug}?preview=true`} target="_blank" rel="noopener noreferrer">
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {post.status !== 'PUBLISHED' ? (
                        <Tooltip title="Publish">
                          <IconButton size="small" color="success" onClick={() => handlePublish(post)}>
                            <Publish fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Unpublish">
                          <IconButton size="small" color="warning" onClick={() => handleUnpublish(post)}>
                            <Unpublished fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(post)}>
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setSearchParams(v > 1 ? { page: String(v) } : {})} color="primary" siblingCount={0} boundaryCount={1} size="small" />
        </Box>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmOpen(false); setPendingAction(null); }}
      />
    </Container>
  );
};

export default AdminBlogListPage;
