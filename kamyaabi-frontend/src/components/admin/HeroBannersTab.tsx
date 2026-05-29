import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  CloudUpload,
  Delete,
  Edit,
} from '@mui/icons-material';
import { heroBannerApi, HeroBanner, HeroBannerRequest } from '../../api/heroBannerApi';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../common/ToastProvider';
import ConfirmDialog from '../common/ConfirmDialog';

interface HeroBannersTabProps {
  active: boolean;
}

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

const HeroBannersTab: React.FC<HeroBannersTabProps> = ({ active }) => {
  const toast = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    heroBannerApi
      .list()
      .then((res) => setBanners(res.data.data ?? []))
      .catch((err) => toast.showError(parseApiError(err, 'Failed to load hero banners').message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, displayOrder: String(banners.length) });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: HeroBanner) => {
    setEditing(banner);
    setForm({
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      altText: banner.altText ?? '',
      linkUrl: banner.linkUrl ?? '',
      displayOrder: String(banner.displayOrder),
      active: banner.active,
    });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    if (!editing && !imageFile) {
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
      if (editing) {
        await heroBannerApi.update(editing.id, payload, imageFile);
        toast.showSuccess('Hero banner updated');
      } else {
        await heroBannerApi.create(payload, imageFile as File);
        toast.showSuccess('Hero banner created');
      }
      setDialogOpen(false);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      load();
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to save hero banner').message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: HeroBanner) => {
    try {
      await heroBannerApi.setStatus(banner.id, !banner.active);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)),
      );
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to update status').message);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const reordered = [...banners];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    setBanners(reordered);
    try {
      await heroBannerApi.reorder(reordered.map((b) => b.id));
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to reorder').message);
      load();
    }
  };

  const handleDelete = async () => {
    if (confirmId == null) return;
    setDeleting(true);
    try {
      await heroBannerApi.remove(confirmId);
      toast.showSuccess('Hero banner deleted');
      setConfirmId(null);
      load();
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to delete hero banner').message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6">Homepage Hero Banners</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the rotating hero images on the homepage. Drag order with the arrows, toggle
              visibility, and edit captions or link targets.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Banner
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : banners.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No hero banners yet. Add one to control the homepage hero.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {banners.map((banner, index) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}>
                          <ArrowUpward fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === banners.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDownward fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="img"
                        src={withCloudinaryTransform(banner.imageUrl) || banner.imageUrl}
                        alt={banner.altText ?? banner.title ?? 'Hero banner'}
                        sx={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 1, bgcolor: '#f0ede6' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {banner.title || <em>(no title)</em>}
                      </Typography>
                      {banner.subtitle && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                          {banner.subtitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={banner.active} onChange={() => toggleActive(banner)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(banner)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setConfirmId(banner.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Hero Banner' : 'Add Hero Banner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                {imageFile ? 'Change Image' : editing ? 'Replace Image (optional)' : 'Upload Image'}
                <input hidden accept="image/*" type="file" onChange={onPickImage} />
              </Button>
              {(imagePreview || editing) && (
                <Box
                  component="img"
                  src={imagePreview || withCloudinaryTransform(editing!.imageUrl) || editing!.imageUrl}
                  alt="Preview"
                  sx={{ display: 'block', mt: 1.5, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
                />
              )}
            </Box>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Subtitle / Description"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <TextField
              label="Alt Text (accessibility)"
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Link URL (optional)"
              placeholder="/products or https://..."
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Display Order"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
              size="small"
              sx={{ maxWidth: 160 }}
            />
            <FormControlLabel
              control={
                <Switch checked={form.active} onChange={(_, v) => setForm({ ...form, active: v })} />
              }
              label={form.active ? 'Active' : 'Hidden'}
            />
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {editing ? 'Save Changes' : 'Create Banner'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId != null}
        title="Delete Hero Banner"
        message="This will permanently remove the banner from the homepage. Continue?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </Card>
  );
};

export default HeroBannersTab;
