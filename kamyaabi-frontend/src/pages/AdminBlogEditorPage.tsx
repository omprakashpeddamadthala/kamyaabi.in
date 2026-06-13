import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Stack, Chip,
  FormControl, InputLabel, Select, MenuItem, Autocomplete, Switch,
  FormControlLabel, Paper, IconButton, Tooltip, Collapse,
  LinearProgress,
} from '@mui/material';
import {
  Save, Publish, Visibility, ExpandMore, ExpandLess, CloudUpload, AutoFixHigh,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { adminBlogApi, BlogPostRequest } from '../api/blogApi';
import { BlogCategory, BlogTag, BlogPostStatus } from '../types';
import { parseApiError } from '../utils/apiError';
import { useToast } from '../components/common/useToast';
import { config } from '../config';

const slugify = (raw: string): string =>
  raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const countWords = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

const AdminBlogEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('DRAFT');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const postIdRef = useRef<number | null>(id ? Number(id) : null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({ inline: false }),
      Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
    ],
    content: '',
  });

  useEffect(() => {
    adminBlogApi.getCategories().then((r) => setCategories(r.data.data)).catch(() => {});
    adminBlogApi.getTags().then((r) => setTags(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    adminBlogApi.getPostById(Number(id))
      .then((res) => {
        const p = res.data.data;
        setTitle(p.title);
        setSlug(p.slug);
        setSlugManual(true);
        setExcerpt(p.excerpt || '');
        setCoverImageUrl(p.coverImageUrl || '');
        setCoverImageAlt(p.coverImageAlt || '');
        setStatus(p.status);
        setScheduledAt(p.scheduledAt || '');
        setSelectedCategoryIds(p.categories.map((c) => c.id));
        setSelectedTagIds(p.tags.map((t) => t.id));
        setSeoTitle(p.seoTitle || '');
        setSeoDescription(p.seoDescription || '');
        setSeoKeywords(p.seoKeywords || '');
        setOgImageUrl(p.ogImageUrl || '');
        setCanonicalUrl(p.canonicalUrl || '');
        setIsFeatured(p.isFeatured);
        if (editor && p.content) editor.commands.setContent(p.content);
        postIdRef.current = p.id;
      })
      .catch((err) => showError(parseApiError(err, 'Failed to load post').message))
      .finally(() => setLoading(false));
  }, [isEdit, id, editor, showError]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const buildRequest = useCallback((): BlogPostRequest => ({
    title,
    slug,
    excerpt,
    content: editor?.getHTML() || '',
    coverImageUrl: coverImageUrl || undefined,
    coverImageAlt: coverImageAlt || undefined,
    status,
    scheduledAt: status === 'SCHEDULED' && scheduledAt ? scheduledAt : undefined,
    categoryIds: selectedCategoryIds,
    tagIds: selectedTagIds,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    seoKeywords: seoKeywords || undefined,
    ogImageUrl: ogImageUrl || undefined,
    canonicalUrl: canonicalUrl || undefined,
    isFeatured,
  }), [title, slug, excerpt, editor, coverImageUrl, coverImageAlt, status, scheduledAt,
    selectedCategoryIds, selectedTagIds, seoTitle, seoDescription, seoKeywords, ogImageUrl,
    canonicalUrl, isFeatured]);

  const handleSave = async (publishNow = false) => {
    if (!title.trim()) { showError('Title is required'); return; }
    setSaving(true);
    try {
      const req = buildRequest();
      if (publishNow) req.status = 'PUBLISHED';
      let savedPost;
      if (postIdRef.current) {
        savedPost = (await adminBlogApi.updatePost(postIdRef.current, req)).data.data;
        showSuccess('Post saved');
      } else {
        savedPost = (await adminBlogApi.createPost(req)).data.data;
        postIdRef.current = savedPost.id;
        showSuccess('Post created');
        navigate(`/admin/blog/edit/${savedPost.id}`, { replace: true });
      }
      setLastSaved(new Date().toLocaleTimeString());
      if (publishNow) setStatus('PUBLISHED');
    } catch (err) {
      showError(parseApiError(err, 'Failed to save post').message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save every 60s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (postIdRef.current && title.trim() && !saving) {
        const req = buildRequest();
        adminBlogApi.updatePost(postIdRef.current, req)
          .then(() => setLastSaved(new Date().toLocaleTimeString()))
          .catch(() => {});
      }
    }, 60000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [buildRequest, title, saving]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await adminBlogApi.uploadMedia(file);
      setCoverImageUrl(res.data.data.url);
    } catch (err) {
      showError(parseApiError(err, 'Failed to upload image').message);
    }
  };

  const handleEditorImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const res = await adminBlogApi.uploadMedia(file);
        editor?.chain().focus().setImage({ src: res.data.data.url }).run();
      } catch (err) {
        showError(parseApiError(err, 'Failed to upload image').message);
      }
    };
    input.click();
  };

  const handleAddYouTube = () => {
    const url = prompt('Enter YouTube URL:');
    if (url) editor?.commands.setYoutubeVideo({ src: url });
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return;
    try {
      const res = await adminBlogApi.createTag({ name: newTagInput.trim() });
      const newTag = res.data.data;
      setTags((prev) => [...prev, newTag]);
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagInput('');
    } catch (err) {
      showError(parseApiError(err, 'Failed to create tag').message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatInput.trim()) return;
    try {
      const res = await adminBlogApi.createCategory({ name: newCatInput.trim() });
      const newCat = res.data.data;
      setCategories((prev) => [...prev, newCat]);
      setSelectedCategoryIds((prev) => [...prev, newCat.id]);
      setNewCatInput('');
    } catch (err) {
      showError(parseApiError(err, 'Failed to create category').message);
    }
  };

  const handleAutoExcerpt = () => {
    if (!editor) return;
    const text = editor.getText().substring(0, 250).trim();
    setExcerpt(text);
  };

  const wordCount = editor ? countWords(editor.getHTML()) : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading post...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit ? 'Edit Post' : 'New Post'}
        </Typography>
        <Stack direction="row" spacing={1}>
          {lastSaved && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Last saved: {lastSaved}
            </Typography>
          )}
          <Button variant="outlined" startIcon={<Save />} onClick={() => handleSave(false)} disabled={saving}>
            Save Draft
          </Button>
          <Button variant="contained" startIcon={<Publish />} onClick={() => handleSave(true)} disabled={saving}>
            {status === 'PUBLISHED' ? 'Update' : 'Publish Now'}
          </Button>
          {postIdRef.current && (
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              href={`/blog/${slug}?preview=true`}
              target="_blank"
            >
              Preview
            </Button>
          )}
        </Stack>
      </Stack>

      {saving && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Left: Editor */}
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Post Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { fontSize: '1.5rem', fontWeight: 600 } }}
          />

          {/* Toolbar */}
          {editor && (
            <Paper variant="outlined" sx={{ mb: 1, p: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { label: 'B', cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
                { label: 'I', cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
                { label: 'U', cmd: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
                { label: 'S', cmd: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
                { label: 'H1', cmd: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
                { label: 'H2', cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
                { label: 'H3', cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
                { label: 'H4', cmd: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive('heading', { level: 4 }) },
                { label: 'UL', cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
                { label: 'OL', cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
                { label: '""', cmd: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
                { label: '<>', cmd: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
                { label: '—', cmd: () => editor.chain().focus().setHorizontalRule().run(), active: false },
                { label: 'Link', cmd: () => { const url = prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run(); }, active: editor.isActive('link') },
                { label: 'Img', cmd: handleEditorImageUpload, active: false },
                { label: 'YT', cmd: handleAddYouTube, active: false },
                { label: 'Table', cmd: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(), active: false },
                { label: 'AL', cmd: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
                { label: 'AC', cmd: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
                { label: 'AR', cmd: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
              ].map((btn) => (
                <Button
                  key={btn.label}
                  size="small"
                  variant={btn.active ? 'contained' : 'outlined'}
                  onClick={btn.cmd}
                  sx={{ minWidth: 36, px: 1, fontSize: 'var(--text-sm)' }}
                >
                  {btn.label}
                </Button>
              ))}
            </Paper>
          )}

          <Paper
            variant="outlined"
            sx={{
              minHeight: 400,
              p: 2,
              '& .tiptap': { outline: 'none', minHeight: 360 },
              '& .tiptap p.is-editor-empty:first-child::before': {
                color: 'text.secondary',
                content: 'attr(data-placeholder)',
                float: 'left',
                height: 0,
                pointerEvents: 'none',
              },
              '& .tiptap h1, & .tiptap h2, & .tiptap h3, & .tiptap h4': { mt: 2, mb: 1 },
              '& .tiptap img': { maxWidth: '100%', borderRadius: 1 },
              '& .tiptap blockquote': { borderLeft: 4, borderColor: 'primary.main', pl: 2, ml: 0 },
              '& .tiptap pre': { bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto' },
              '& .tiptap table': { borderCollapse: 'collapse', width: '100%' },
              '& .tiptap th, & .tiptap td': { border: '1px solid', borderColor: 'divider', p: 1 },
            }}
          >
            <EditorContent editor={editor} />
          </Paper>

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {wordCount} words
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ~{readingTime} min read
            </Typography>
          </Stack>
        </Grid>

        {/* Right: Settings Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Status */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Publish Settings</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as BlogPostStatus)}>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                </Select>
              </FormControl>
              {status === 'SCHEDULED' && (
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Schedule Date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Paper>

            {/* Cover Image */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Featured Image</Typography>
              {coverImageUrl && (
                <Box component="img" src={coverImageUrl} alt={coverImageAlt} sx={{ width: '100%', borderRadius: 1, mb: 1, maxHeight: 160, objectFit: 'cover' }} />
              )}
              <Button variant="outlined" component="label" startIcon={<CloudUpload />} size="small" fullWidth>
                Upload Image
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
              <TextField fullWidth size="small" label="Or paste URL" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} sx={{ mt: 1 }} />
              <TextField fullWidth size="small" label="Alt text" value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} sx={{ mt: 1 }} />
            </Paper>

            {/* Slug */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Slug</Typography>
              <TextField
                fullWidth
                size="small"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                helperText={`${config.brandDomain}/blog/${slug}`}
              />
            </Paper>

            {/* Excerpt */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Excerpt</Typography>
                <Tooltip title="Auto-generate from content">
                  <IconButton size="small" onClick={handleAutoExcerpt}><AutoFixHigh fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.substring(0, 300))}
                helperText={`${excerpt.length}/300`}
              />
            </Paper>

            {/* Categories */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Categories</Typography>
              <Autocomplete
                multiple
                size="small"
                options={categories}
                getOptionLabel={(o) => o.name}
                value={categories.filter((c) => selectedCategoryIds.includes(c.id))}
                onChange={(_, vals) => setSelectedCategoryIds(vals.map((v) => v.id))}
                renderInput={(params) => <TextField {...params} placeholder="Select categories" />}
                renderTags={(vals, getTagProps) =>
                  vals.map((v, i) => <Chip {...getTagProps({ index: i })} key={v.id} label={v.name} size="small" />)
                }
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField size="small" placeholder="New category" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
                <Button size="small" onClick={handleCreateCategory}>Add</Button>
              </Stack>
            </Paper>

            {/* Tags */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Autocomplete
                multiple
                size="small"
                options={tags}
                getOptionLabel={(o) => o.name}
                value={tags.filter((t) => selectedTagIds.includes(t.id))}
                onChange={(_, vals) => setSelectedTagIds(vals.map((v) => v.id))}
                renderInput={(params) => <TextField {...params} placeholder="Select tags" />}
                renderTags={(vals, getTagProps) =>
                  vals.map((v, i) => <Chip {...getTagProps({ index: i })} key={v.id} label={v.name} size="small" />)
                }
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField size="small" placeholder="New tag" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()} />
                <Button size="small" onClick={handleCreateTag}>Add</Button>
              </Stack>
            </Paper>

            {/* Featured */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={<Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />}
                label="Featured Post"
              />
            </Paper>

            {/* SEO */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={() => setSeoOpen(!seoOpen)} sx={{ cursor: 'pointer' }}>
                <Typography variant="subtitle2">SEO Settings</Typography>
                {seoOpen ? <ExpandLess /> : <ExpandMore />}
              </Stack>
              <Collapse in={seoOpen}>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth size="small" label="SEO Title" value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    helperText={<span style={{ color: seoTitle.length >= 50 && seoTitle.length <= 60 ? 'green' : undefined }}>{seoTitle.length}/60</span>}
                  />
                  <TextField
                    fullWidth size="small" label="Meta Description" value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)} multiline rows={2}
                    helperText={<span style={{ color: seoDescription.length >= 150 && seoDescription.length <= 160 ? 'green' : undefined }}>{seoDescription.length}/160</span>}
                  />
                  <TextField fullWidth size="small" label="Keywords" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} helperText="Comma-separated" />
                  <TextField fullWidth size="small" label="OG Image URL" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} />
                  <TextField fullWidth size="small" label="Canonical URL" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />

                  {/* SEO Preview */}
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>Google Preview</Typography>
                    <Typography variant="body2" sx={{ color: '#1a0dab', fontWeight: 500, fontSize: '1rem' }}>
                      {seoTitle || title || 'Post Title'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#006621' }}>
                      {config.brandDomain}/blog/{slug}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 'var(--text-sm)' }}>
                      {seoDescription || excerpt || 'Post description will appear here...'}
                    </Typography>
                  </Paper>
                </Stack>
              </Collapse>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminBlogEditorPage;
