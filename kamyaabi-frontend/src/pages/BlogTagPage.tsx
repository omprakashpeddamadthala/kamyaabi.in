import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardMedia, CardContent, CardActionArea,
  Box, Pagination, Skeleton, Stack, Breadcrumbs, Link,
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { blogApi } from '../api/blogApi';
import { BlogPost, BlogTag } from '../types';

const BlogTagPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get('page') || '1') - 1);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [tag, setTag] = useState<BlogTag | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [postsRes, tagRes] = await Promise.all([
        blogApi.getPosts({ page, size: 10, tag: slug }),
        blogApi.getTagBySlug(slug),
      ]);
      setPosts(postsRes.data.data.content);
      setTotalPages(postsRes.data.data.totalPages);
      setTag(tagRes.data.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const title = tag ? `Posts tagged "${tag.name}" | Kamyaabi Blog` : 'Tag | Kamyaabi Blog';
  const description = tag?.description || `Articles tagged with ${tag?.name || slug} from Kamyaabi`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
          <Link component={RouterLink} to="/blog" underline="hover" color="inherit">Blog</Link>
          <Typography color="text.primary">#{tag?.name || slug}</Typography>
        </Breadcrumbs>

        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>#{tag?.name || slug}</Typography>
        {tag?.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{tag.description}</Typography>
        )}

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card><Skeleton variant="rectangular" height={200} /><CardContent><Skeleton /><Skeleton width="60%" /></CardContent></Card>
                </Grid>
              ))
            : posts.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">No articles with this tag yet</Typography>
                  </Box>
                </Grid>
              ) : posts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardActionArea component={RouterLink} to={`/blog/${post.slug}`}>
                      {post.coverImageUrl && (
                        <CardMedia component="img" height="200" image={post.coverImageUrl} alt={post.coverImageAlt || post.title} loading="lazy" />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>{post.title}</Typography>
                        {post.excerpt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="caption" color="text.secondary">{formatDate(post.publishedAt)}</Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{post.readingTimeMinutes} min</Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setSearchParams(v > 1 ? { page: String(v) } : {})} color="primary" />
          </Box>
        )}
      </Container>
    </>
  );
};

export default BlogTagPage;
