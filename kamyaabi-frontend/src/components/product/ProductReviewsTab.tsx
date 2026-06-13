import React from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  Rating,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, PhotoCamera, RateReview } from '@mui/icons-material';
import type { User } from '../../types';
import { formatRelativeDate } from '../../utils/productDetail';
import type { useProductReviews } from '../../hooks/useProductReviews';

interface ProductReviewsTabProps {
  data: ReturnType<typeof useProductReviews>;
  user: User | null;
  onSelectLightboxImage: (url: string) => void;
}

const ProductReviewsTab: React.FC<ProductReviewsTabProps> = ({ data, user, onSelectLightboxImage }) => {
  const {
    reviews,
    reviewSummary,
    reviewsLoading,
    userAlreadyReviewed,
    reviewFormRating,
    setReviewFormRating,
    reviewFormTitle,
    setReviewFormTitle,
    reviewFormText,
    setReviewFormText,
    reviewFormImages,
    setReviewFormImages,
    reviewFormSubmitting,
    reviewFormError,
    reviewFormSuccess,
    handleReviewSubmit,
    handleDeleteReview,
    handleReviewImageChange,
  } = data;

  const hasRating = !!reviewSummary && reviewSummary.totalReviews > 0;

  if (reviewsLoading) {
    return (
      <Grid container spacing={3}>
        {[0, 1, 2].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} animation="wave" />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <>
      {hasRating && reviewSummary && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h3" fontWeight={700} color="primary.main">
            {reviewSummary.averageRating.toFixed(1)}
          </Typography>
          <Box>
            <Rating value={reviewSummary.averageRating} precision={0.5} readOnly />
            <Typography variant="body2" color="text.secondary">
              Based on {reviewSummary.totalReviews}
              {' '}{reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
            </Typography>
          </Box>
        </Box>
      )}

      {reviews.length > 0 ? (
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} sm={6} md={4} key={review.id}>
              <Box sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                bgcolor: 'background.paper',
                transition: 'box-shadow 0.2s ease',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
                position: 'relative',
              }}>
                {user?.role === 'ADMIN' && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteReview(review.id)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                    aria-label="Delete review"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={review.rating} readOnly size="small" />
                  {review.title && (
                    <Typography variant="subtitle2" fontWeight={600}>{review.title}</Typography>
                  )}
                </Box>
                {review.text && (
                  <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, fontStyle: 'italic' }}>
                    &ldquo;{review.text}&rdquo;
                  </Typography>
                )}
                {review.images && review.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    {review.images.map((img, imgIdx) => (
                      <Box
                        key={imgIdx}
                        component="img"
                        src={img}
                        alt={`Review image ${imgIdx + 1}`}
                        onClick={() => onSelectLightboxImage(img)}
                        sx={{
                          width: 56, height: 56, objectFit: 'cover',
                          borderRadius: 1, cursor: 'pointer',
                          border: '1px solid', borderColor: 'divider',
                        }}
                      />
                    ))}
                  </Box>
                )}
                <Typography variant="caption" fontWeight={600}>{review.authorName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  · {formatRelativeDate(review.createdAt)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'var(--color-surface-bg)', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No reviews yet. Be the first to review!
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />
      {user ? (
        userAlreadyReviewed ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            You have already reviewed this product.
          </Alert>
        ) : (
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Write a Review</Typography>
            {reviewFormError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{reviewFormError}</Alert>}
            {reviewFormSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{reviewFormSuccess}</Alert>}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>Rating *</Typography>
              <Rating
                value={reviewFormRating}
                onChange={(_, v) => setReviewFormRating(v)}
                size="large"
              />
            </Box>
            <TextField
              label="Title (optional)"
              fullWidth
              size="small"
              value={reviewFormTitle}
              onChange={(e) => setReviewFormTitle(e.target.value.slice(0, 100))}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Your review *"
              fullWidth
              multiline
              rows={4}
              value={reviewFormText}
              onChange={(e) => setReviewFormText(e.target.value.slice(0, 1000))}
              sx={{ mb: 1 }}
              helperText={`${reviewFormText.length}/1000 (min 20)`}
              inputProps={{ maxLength: 1000 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<PhotoCamera />}
                disabled={reviewFormImages.length >= 5}
              >
                Add Images ({reviewFormImages.length}/5)
                <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={handleReviewImageChange} />
              </Button>
              {reviewFormImages.map((f, fi) => (
                <Chip
                  key={fi}
                  label={f.name.slice(0, 20)}
                  size="small"
                  onDelete={() => setReviewFormImages((prev) => prev.filter((_, i) => i !== fi))}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handleReviewSubmit}
              disabled={reviewFormSubmitting}
              startIcon={reviewFormSubmitting ? <CircularProgress size={18} color="inherit" /> : <RateReview />}
            >
              {reviewFormSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Box>
        )
      ) : (
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'var(--color-surface-bg)', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <MuiLink component={Link} to="/login" underline="hover" color="primary" fontWeight={600}>
              Login
            </MuiLink>{' '}to write a review
          </Typography>
        </Box>
      )}
    </>
  );
};

export default ProductReviewsTab;
