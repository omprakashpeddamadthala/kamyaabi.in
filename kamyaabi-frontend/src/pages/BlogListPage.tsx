import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  Skeleton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search as SearchIcon, AccessTime, Visibility } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { blogApi } from '../api/blogApi';
import { BlogPost, BlogCategory, BlogTag } from '../types';
import { parseApiError } from '../utils/apiError';

const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get('page') || '1') - 1);
  const categorySlug = searchParams.get('category') || '';
  const tagSlug = searchParams.get('tag') || '';
  const searchQuery = searchParams.get('search') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getPosts({
        page,
        size: 10,
        category: categorySlug || undefined,
        tag: tagSlug || undefined,
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
  }, [page, categorySlug, tagSlug, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    blogApi.getCategories().then((res) => setCategories(res.data.data)).catch(() => {});
    blogApi.getTags().then((res) => setTags(res.data.data)).catch(() => {});
  }, []);

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

  const handleSearch = () => {
    updateParams({ search: searchInput.trim(), page: '' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

        {/* Filters */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <TextField
            size="small"
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={categorySlug}
              onChange={(e) => updateParams({ category: e.target.value, page: '', tag: '' })}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.slug}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Tag pills */}
        {tags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {tags.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                size="small"
                color={tagSlug === t.slug ? 'primary' : 'default'}
                onClick={() =>
                  updateParams({
                    tag: tagSlug === t.slug ? '' : t.slug,
                    page: '',
                    category: '',
                  })
                }
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        )}

        {/* Posts Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ height: '100%' }}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton width="60%" />
                      <Skeleton />
                      <Skeleton width="80%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : posts.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      No articles found
                    </Typography>
                  </Box>
                </Grid>
              ) : posts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardActionArea component={RouterLink} to={`/blog/${post.slug}`}>
                      {post.coverImageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.coverImageUrl}
                          alt={post.coverImageAlt || post.title}
                          loading="lazy"
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        {post.categories.length > 0 && (
                          <Chip
                            label={post.categories[0].name}
                            size="small"
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                        )}
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {post.title}
                        </Typography>
                        {post.excerpt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {post.excerpt.length > 120
                              ? `${post.excerpt.substring(0, 120)}...`
                              : post.excerpt}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} alignItems="center">
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
                  </Card>
                </Grid>
              ))}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, v) => updateParams({ page: v > 1 ? String(v) : '' })}
              color="primary"
            />
          </Box>
        )}
      </Container>
    </>
  );
};

export default BlogListPage;
