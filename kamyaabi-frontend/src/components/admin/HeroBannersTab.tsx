import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, Delete, Edit } from '@mui/icons-material';
import { heroBannerApi, HeroBanner } from '../../api/heroBannerApi';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../common/ToastProvider';
import InlineConfirmBar from './InlineConfirmBar';

interface HeroBannersTabProps {
  active: boolean;
}

const HeroBannersTab: React.FC<HeroBannersTabProps> = ({ active }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(false);
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

  const toggleActive = async (banner: HeroBanner) => {
    try {
      await heroBannerApi.setStatus(banner.id, !banner.active);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
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
    <Card sx={{ '&:hover': { transform: 'none' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6">Homepage Hero Banners</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the rotating hero images on the homepage. Reorder with the arrows, toggle
              visibility, and edit captions or link targets.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/hero-banners/new')}>
            Add Banner
          </Button>
        </Box>

        <InlineConfirmBar
          open={confirmId != null}
          title="Delete hero banner?"
          message="This will permanently remove the banner from the homepage."
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : banners.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No hero banners yet. Add one to control the homepage hero.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
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
                        <IconButton size="small" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                          <ArrowUpward fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Move down"
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
                        sx={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 1, bgcolor: 'var(--color-surface-bg)' }}
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
                      <Switch
                        checked={banner.active}
                        onChange={() => toggleActive(banner)}
                        size="small"
                        inputProps={{ 'aria-label': `Toggle visibility for ${banner.title || 'banner'}` }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label="Edit banner"
                          onClick={() => navigate(`/admin/hero-banners/edit/${banner.id}`, { state: { banner } })}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" aria-label="Delete banner" onClick={() => setConfirmId(banner.id)}>
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
    </Card>
  );
};

export default HeroBannersTab;
