import { useEffect, useState } from 'react';
import { reviewApi } from '../api/reviewApi';
import type { Faq, Product, Review, ReviewSummary, User } from '../types';

export function useProductReviews(product: Product | null, user: User | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const [reviewFormRating, setReviewFormRating] = useState<number | null>(null);
  const [reviewFormTitle, setReviewFormTitle] = useState('');
  const [reviewFormText, setReviewFormText] = useState('');
  const [reviewFormImages, setReviewFormImages] = useState<File[]>([]);
  const [reviewFormSubmitting, setReviewFormSubmitting] = useState(false);
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewFormSuccess, setReviewFormSuccess] = useState('');

  const productId = product?.id;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setReviewsLoading(true);
    Promise.all([reviewApi.list(productId, 0, 50), reviewApi.summary(productId)])
      .then(([listRes, sumRes]) => {
        if (cancelled) return;
        setReviews(listRes.data.data?.content ?? []);
        setReviewSummary(sumRes.data.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setReviews([]);
        setReviewSummary(null);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    reviewApi.getFaqs(productId)
      .then((res) => { if (!cancelled) setFaqs(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setFaqs([]); });
    return () => { cancelled = true; };
  }, [productId]);

  const userAlreadyReviewed = !!user && reviews.some((r) => r.userId === user.id);

  const handleReviewSubmit = async () => {
    if (!product || !user) return;
    if (!reviewFormRating) { setReviewFormError('Please select a rating'); return; }
    if (reviewFormText.length < 20) { setReviewFormError('Review text must be at least 20 characters'); return; }
    setReviewFormError('');
    setReviewFormSubmitting(true);
    try {
      const res = await reviewApi.create(product.id, {
        rating: reviewFormRating,
        title: reviewFormTitle || undefined,
        text: reviewFormText,
      }, reviewFormImages.length > 0 ? reviewFormImages : undefined);
      setReviews((prev) => [res.data.data, ...prev]);
      setReviewSummary((prev) => prev ? {
        ...prev,
        totalReviews: prev.totalReviews + 1,
        averageRating: Math.round(((prev.averageRating * prev.totalReviews + reviewFormRating) / (prev.totalReviews + 1)) * 10) / 10,
      } : prev);
      setReviewFormRating(null);
      setReviewFormTitle('');
      setReviewFormText('');
      setReviewFormImages([]);
      setReviewFormSuccess('Review submitted successfully!');
      setTimeout(() => setReviewFormSuccess(''), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      setReviewFormError(msg);
    } finally {
      setReviewFormSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await reviewApi.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewSummary((prev) => prev && prev.totalReviews > 1 ? {
        ...prev,
        totalReviews: prev.totalReviews - 1,
      } : prev);
    } catch { /* silently handle */ }
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024 && /image\/(jpeg|png|webp)/.test(f.type));
    setReviewFormImages((prev) => [...prev, ...valid].slice(0, 5));
  };

  return {
    reviews,
    reviewSummary,
    reviewsLoading,
    faqs,
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
  };
}
