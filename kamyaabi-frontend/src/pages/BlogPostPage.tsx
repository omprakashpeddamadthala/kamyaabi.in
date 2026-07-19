import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Grid,
} from '@mui/material';
import {
  AccessTime,
  Visibility,
  CalendarToday,
  Share,
  ContentCopy,
  Facebook,
} from '@mui/icons-material';
import { blogApi } from '../api/blogApi';
import { BlogPost } from '../types';
import { config } from '../config';
import Seo from '../components/common/Seo';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    blogApi
      .getPostBySlug(slug)
      .then((res) => {
        const p = res.data.data;
        setPost(p);
        blogApi.incrementViewCount(p.id).catch(() => {});
        blogApi.getRelatedPosts(p.id, 3).then((r) => setRelatedPosts(r.data.data)).catch(() => {});
      })
      .catch(() => setError('Post not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const postUrl = `${config.brandSiteUrl}/blog/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).catch(() => {});
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${post?.title} - ${postUrl}`)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || '')}&url=${encodeURIComponent(postUrl)}`,
      '_blank',
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton width="40%" height={32} />
        <Skeleton width="80%" height={48} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2, borderRadius: 2 }} />
        <Skeleton sx={{ mt: 2 }} />
        <Skeleton />
        <Skeleton width="60%" />
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        {/* GSC FIX: noindex the 404 error state — a missing blog post must not
            be presented to Google as a real indexable page.                   */}
        <Seo
          title="Post Not Found"
          description="The blog post you are looking for does not exist on Kamyaabi."
          canonicalPath={`/blog/${slug}`}
          noindex
        />
        <Typography variant="h4" component="h1" gutterBottom>Post Not Found</Typography>
        <Typography color="text.secondary">The blog post you are looking for does not exist.</Typography>
        <Link component={RouterLink} to="/blog" sx={{ mt: 2, display: 'inline-block' }}>
          Back to Blog
        </Link>
      </Container>
    );
  }

  const seoTitle = post.seoTitle || post.title;
  const seoDescription = post.seoDescription || post.excerpt || '';
  const ogImage = post.ogImageUrl || post.coverImageUrl || '';
  const canonical = post.canonicalUrl || postUrl;

  // ── Schema.org JSON-LD blocks ──────────────────────────────────────────────

  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: ogImage ? [ogImage] : undefined,
    author: {
      '@type': 'Person',
      name: post.authorName || 'Kamyaabi',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kamyaabi',
      logo: {
        '@type': 'ImageObject',
        url: `${config.brandSiteUrl}/pwa-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    description: seoDescription,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
    ...(post.readingTimeMinutes
      ? { timeRequired: `PT${post.readingTimeMinutes}M` }
      : {}),
    ...(post.categories?.length
      ? { articleSection: post.categories[0].name }
      : {}),
    ...(post.tags?.length
      ? { keywords: post.tags.map((t) => t.name).join(', ') }
      : {}),
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${config.brandSiteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${config.brandSiteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      {/* GSC FIX: unified <Seo> handles all required meta, OG, Twitter,
          canonical, robots, hreflang and JSON-LD in one component.      */}
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonical}
        image={ogImage || undefined}
        keywords={post.seoKeywords || undefined}
        publishedTime={post.publishedAt || undefined}
        modifiedTime={post.updatedAt || undefined}
        authorName={post.authorName || undefined}
        jsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
          <Link component={RouterLink} to="/blog" underline="hover" color="inherit">Blog</Link>
          <Typography color="text.primary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.title}
          </Typography>
        </Breadcrumbs>

        {/* Categories */}
        {post.categories.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {post.categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                size="small"
                color="primary"
                component={RouterLink}
                to={`/blog/category/${c.slug}`}
                clickable
              />
            ))}
          </Stack>
        )}

        {/* Title */}
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.2 }}>
          {post.title}
        </Typography>

        {/* Author & Meta */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={post.authorAvatarUrl || undefined} sx={{ width: 40, height: 40 }}>
            {post.authorName?.[0] || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{post.authorName}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarToday sx={{ fontSize: 14 }} />
                <Typography variant="caption">{formatDate(post.publishedAt)}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AccessTime sx={{ fontSize: 14 }} />
                <Typography variant="caption">{post.readingTimeMinutes} min read</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Visibility sx={{ fontSize: 14 }} />
                <Typography variant="caption">{post.viewCount} views</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        {/* Cover Image */}
        {post.coverImageUrl && (
          <Box
            component="img"
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            sx={{ width: '100%', borderRadius: 2, mb: 4, maxHeight: 500, objectFit: 'cover' }}
          />
        )}

        {/* Content */}
        <Box
          sx={{
            '& h1, & h2, & h3, & h4': { mt: 3, mb: 1.5, fontWeight: 600 },
            '& p': { mb: 2, lineHeight: 1.8 },
            '& img': { maxWidth: '100%', borderRadius: 1 },
            '& blockquote': { borderLeft: 4, borderColor: 'primary.main', pl: 2, ml: 0, fontStyle: 'italic' },
            '& pre': { bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto' },
            '& code': { bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5, fontSize: '0.9em' },
            '& a': { color: 'primary.main' },
            '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
            '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1 },
          }}
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {post.tags.map((t) => (
                <Chip
                  key={t.id}
                  label={`#${t.name}`}
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/blog/tag/${t.slug}`}
                  clickable
                />
              ))}
            </Stack>
          </>
        )}

        {/* Social Share */}
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ mr: 1 }}>Share:</Typography>
          <Tooltip title="Share on WhatsApp">
            <IconButton size="small" onClick={handleShareWhatsApp} color="success">
              <Share fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share on Facebook">
            <IconButton size="small" onClick={handleShareFacebook} color="primary">
              <Facebook fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share on Twitter">
            <IconButton size="small" onClick={handleShareTwitter}>
              <Share fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy link">
            <IconButton size="small" onClick={handleCopyLink}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Related Posts</Typography>
            <Grid container spacing={3}>
              {relatedPosts.map((rp) => (
                <Grid item xs={12} sm={4} key={rp.id}>
                  <Card>
                    <CardActionArea component={RouterLink} to={`/blog/${rp.slug}`}>
                      {rp.coverImageUrl && (
                        <CardMedia component="img" height="160" image={rp.coverImageUrl} alt={rp.title} loading="lazy" />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {rp.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(rp.publishedAt)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default BlogPostPage;
