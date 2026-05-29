import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Skeleton,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { heroBannerApi, HeroBanner, HeroBannerRequest } from '../../api/heroBannerApi';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

interface BannerForm {
  title: string;
  subtitle: string;
  altText: string;
  linkUrl: string;
  displayOrder: string;
  active: boolean;
}

const emptyForm: BannerForm = {
  title: '',
  subtitle: '',
  altText: '',
  linkUrl: '',
  displayOrder: '0',
  active: true,
};

const toForm = (b: HeroBanner): BannerForm => ({
  title: b.title ?? '',
  subtitle: b.subtitle ?? '',
  altText: b.altText ?? '',
  linkUrl: b.linkUrl ?? '',
  displayOrder: String(b.displayOrder),
  active: b.active,
});

const LIST_PATH = '/admin/hero-banners';

const AdminHeroBannerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const prefill = (location.state as { banner?: HeroBanner } | null)?.banner ?? null;

  const [loading, setLoading] = useState<boolean>(Boolean(editingId) && !prefill);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<HeroBanner | null>(prefill);
  const [form, setForm] = useState<BannerForm>(prefill ? toForm(prefill) : emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (prefill) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    heroBannerApi
      .list()
      .then((res) => {
        if (!active) return;
        const all = res.data.data ?? [];
        if (editingId) {
          const found = all.find((b) => b.id === editingId);
          if (found) {
            setExisting(found);
            setForm(toForm(found));
          } else {
            setLoadError('Hero banner not found. It may have been removed.');
          }
        } else {
          // creating: default the display order to the end of the list
          setForm((f) => ({ ...f, displayOrder: String(all.length) }));
        }
      })
      .catch((err) => {
        if (active) setLoadError(parseApiError(err, 'Failed to load hero banners').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editingId, prefill]);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!editingId && !imageFile) {
      setFormError('Please choose an image for the banner.');
      return;
    }
    const link = form.linkUrl.trim();
    if (link && !/^https?:\/\//i.test(link) && !link.startsWith('/')) {
      setFormError('Link URL must start with http://, https:// or /');
      return;
    }
    const payload: HeroBannerRequest = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      altText: form.altText.trim(),
      linkUrl: link,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
    };
    setSaving(true);
    try {
      if (editingId) {
        await heroBannerApi.update(editingId, payload, imageFile);
        toast.showSuccess('Hero banner updated');
      } else {
        await heroBannerApi.create(payload, imageFile as File);
        toast.showSuccess('Hero banner created');
      }
      navigate(LIST_PATH);
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to save hero banner').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="rounded" height={420} sx={{ mt: 2 }} />
      </Box>
    );
  }

  const previewSrc = imagePreview || (existing ? withCloudinaryTransform(existing.imageUrl) || existing.imageUrl : null);

  return (
    <AdminFormShell
      title={editingId ? 'Edit Hero Banner' : 'Add Hero Banner'}
      subtitle="Rotating hero images shown at the top of the homepage."
      onSubmit={handleSave}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingId ? 'Save changes' : 'Create banner'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load hero banner"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
            {imageFile ? 'Change Image' : editingId ? 'Replace Image (optional)' : 'Upload Image'}
            <input hidden accept="image/*" type="file" onChange={onPickImage} />
          </Button>
          {previewSrc && (
            <Box
              component="img"
              src={previewSrc}
              alt="Banner preview"
              sx={{ display: 'block', mt: 1.5, width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 1, bgcolor: '#f0ede6' }}
            />
          )}
        </Box>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField
          label="Subtitle / Description"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="Alt Text (accessibility)"
          value={form.altText}
          onChange={(e) => setForm({ ...form, altText: e.target.value })}
          fullWidth
          helperText="Describe the image for screen readers."
        />
        <TextField
          label="Link URL (optional)"
          placeholder="/products or https://..."
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          fullWidth
          helperText="Where the banner links when clicked."
        />
        <TextField
          label="Display Order"
          type="number"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
          sx={{ maxWidth: 200 }}
        />
        <FormControlLabel
          control={<Switch checked={form.active} onChange={(_, v) => setForm({ ...form, active: v })} />}
          label={form.active ? 'Active' : 'Hidden'}
        />
        {formError && (
          <Typography color="error" variant="body2" role="alert">
            {formError}
          </Typography>
        )}
      </Box>
    </AdminFormShell>
  );
};

export default AdminHeroBannerFormPage;
