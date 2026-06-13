import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Rating,
  Pagination,
  Paper,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { reviewApi } from '../../api/reviewApi';
import type { Review } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';
import { useToast } from '../common/useToast';

interface AdminReviewsPanelProps {
  active: boolean;
}

const AdminReviewsPanel: React.FC<AdminReviewsPanelProps> = ({ active }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    reviewApi.listAll(page, 20)
      .then((res) => {
        setReviews(res.data.data?.content ?? []);
        setTotalPages(res.data.data?.totalPages ?? 0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [active, page]);

  const handleDelete = async () => {
    if (deleteTarget == null) return;
    setConfirmLoading(true);
    try {
      await reviewApi.deleteReview(deleteTarget);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget));
      showSuccess('Review deleted');
    } catch {
      showError('Failed to delete review');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>All Reviews</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reviewer</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Text</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No reviews found</Typography>
                </TableCell>
              </TableRow>
            ) : reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.authorName}</TableCell>
                <TableCell><Rating value={review.rating} readOnly size="small" /></TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {review.text}
                </TableCell>
                <TableCell>{formatDate(review.createdAt)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => { setDeleteTarget(review.id); setConfirmOpen(true); }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="primary"
          />
        </Box>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Review"
        message="Delete this review? This cannot be undone."
        loading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </Box>
  );
};

export default AdminReviewsPanel;
