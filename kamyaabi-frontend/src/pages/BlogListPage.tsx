import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Skeleton,
  Stack,
  IconButton,
  Button,
  Popover,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  AccessTime,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { blogApi } from '../api/blogApi';
import { BlogPost } from '../types';
import { parseApiError } from '../utils/apiError';

const BLOG_PAGE_SIZE = 9;

const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get('page') || '1') - 1);
  const searchQuery = searchParams.get('search') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [shareAnchor, setShareAnchor] = useState<HTMLElement | null>(null);
  const [sharePost, setSharePost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getPosts({
        page,
        size: BLOG_PAGE_SIZE,
        search: searchQuery || undefined,
      });
      const data = res.data.data;
      setPosts(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load blog posts');
      console.error(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  const updateParams = (patch: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      if (patch.page === undefined || !patch.page) next.delete('page');
      return next;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value.trim(), page: '' });
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateParams({ search: '', page: '' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = (e: React.MouseEvent<HTMLElement>, post: BlogPost) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = window.location.origin + '/blog/' + post.slug;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || '',
        url: shareUrl,
      }).catch(() => {});
    } else {
      setSharePost(post);
      setShareAnchor(e.currentTarget);
      setCopied(false);
    }
  };

  const handleCopyLink = () => {
    if (!sharePost) return;
    const url = window.location.origin + '/blog/' + sharePost.slug;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleShareClose = () => {
    setShareAnchor(null);
    setSharePost(null);
  };

  const getShareUrl = (post: BlogPost) =>
    window.location.origin + '/blog/' + post.slug;

  return (
    <>
      <Helmet>
        <title>Blog | Kamyaabi - Premium Dry Fruits</title>
        <meta name="description" content="Read the latest articles about premium dry fruits, health tips, recipes, and more from Kamyaabi." />
        <link rel="canonical" href="https://kamyaabi.in/blog" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kamyaabi.in/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kamyaabi.in/blog' },
            ],
          })}
        </script>
      </Helmet>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Blog
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Latest articles about premium dry fruits, health tips, and recipes
        </Typography>

        {/* Search only */}
        <Box sx={{ mb: 4 }}>
          <TextField
            size="small"
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch} edge="end">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ maxWidth: { md: 480 } }}
          />
        </Box>

        {/* Posts Grid */}
        <Box
          ref={gridRef}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(auto-fill, minmax(320px, 1fr))',
            },
            gap: 3,
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Skeleton variant="rectangular" sx={{ aspectRatio: '16/9', width: '100%' }} />
                  <CardContent sx={{ flex: 1 }}>
                    <Skeleton width="60%" />
                    <Skeleton />
                    <Skeleton width="80%" />
                  </CardContent>
                </Card>
              ))
            : posts.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', gridColumn: '1 / -1' }}>
                  <Typography variant="h6" color="text.secondary">
                    No articles found
                  </Typography>
                </Box>
              ) : posts.map((post) => (
                <Card
                  key={post.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/blog/${post.slug}`}
                    sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: 'grey.100', overflow: 'hidden' }}>
                      {post.coverImageUrl ? (
                        <CardMedia
                          component="img"
                          image={post.coverImageUrl}
                          alt={post.coverImageAlt || post.title}
                          loading="lazy"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 700, opacity: 0.5 }}>
                            K
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {post.categories.length > 0 && (
                        <Chip
                          label={post.categories[0].name}
                          size="small"
                          color="primary"
                          sx={{ mb: 1, alignSelf: 'flex-start' }}
                        />
                      )}
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {post.title}
                      </Typography>
                      {post.excerpt && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            flex: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {post.excerpt}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          {post.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(post.publishedAt)}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {post.readingTimeMinutes} min
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                  {/* Share button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pb: 1 }}>
                    <Tooltip title="Share">
                      <IconButton
                        size="small"
                        onClick={(e) => handleShare(e, post)}
                        aria-label={`Share ${post.title}`}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              ))}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 4,
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<NavigateBefore />}
              disabled={page === 0}
              onClick={() => updateParams({ page: page > 1 ? String(page) : '' })}
            >
              Previous
            </Button>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              Page {page + 1} of {totalPages}
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? 'contained' : 'text'}
                  size="small"
                  sx={{ minWidth: 36 }}
                  onClick={() => updateParams({ page: i > 0 ? String(i + 1) : '' })}
                >
                  {i + 1}
                </Button>
              ))}
            </Stack>
            <Button
              variant="outlined"
              size="small"
              endIcon={<NavigateNext />}
              disabled={page >= totalPages - 1}
              onClick={() => updateParams({ page: String(page + 2) })}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Share popover for desktop */}
        <Popover
          open={Boolean(shareAnchor)}
          anchorEl={shareAnchor}
          onClose={handleShareClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {sharePost && (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Typography variant="subtitle2">Share this article</Typography>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={handleCopyLink}
                variant="outlined"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(sharePost.title + ' ' + getShareUrl(sharePost))}`,
                    '_blank',
                  );
                  handleShareClose();
                }}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                WhatsApp
              </Button>
              <Button
                size="small"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePost.title)}&url=${encodeURIComponent(getShareUrl(sharePost))}`,
                    '_blank',
                  );
                  handleShareClose();
                }}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                X (Twitter)
              </Button>
            </Box>
          )}
        </Popover>
      </Container>
    </>
  );
};

export default BlogListPage;
