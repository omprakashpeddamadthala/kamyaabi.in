import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Paper,
  InputAdornment,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete, Search as SearchIcon } from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { PackageDimensionSetting, PackageDimensionSettingRequest } from '../../types';
import { useToast } from '../../components/common/useToast';
import { parseApiError } from '../../utils/apiError';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/common/TableSkeleton';

const DEFAULT_DIMENSION = 10;

const initialRequest: PackageDimensionSettingRequest = {
  packageWeightGram: 100,
  length: DEFAULT_DIMENSION,
  breadth: DEFAULT_DIMENSION,
  height: DEFAULT_DIMENSION,
  active: true,
};

const PackageDimensionSettingsPage: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<PackageDimensionSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageDimensionSettingRequest>(initialRequest);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingWeight, setDeletingWeight] = useState<number>(0);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPackageDimensionSettings();
      setSettings(res.data.data ?? []);
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to load package settings').message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleOpenAdd = () => {
    setForm(initialRequest);
    setFormErrors({});
    setEditingId(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (setting: PackageDimensionSetting) => {
    setForm({
      packageWeightGram: setting.packageWeightGram,
      length: setting.length,
      breadth: setting.breadth,
      height: setting.height,
      active: setting.active,
    });
    setFormErrors({});
    setEditingId(setting.id);
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.packageWeightGram || form.packageWeightGram <= 0) {
      errors.packageWeightGram = 'Weight limit must be greater than 0';
    }
    if (!form.length || form.length <= 0) {
      errors.length = 'Length must be greater than 0';
    }
    if (!form.breadth || form.breadth <= 0) {
      errors.breadth = 'Breadth must be greater than 0';
    }
    if (!form.height || form.height <= 0) {
      errors.height = 'Height must be greater than 0';
    }

    // Check for duplicate weight slabs (excluding the currently edited setting)
    const isDuplicate = settings.some(
      (s) => s.packageWeightGram === form.packageWeightGram && s.id !== editingId
    );
    if (isDuplicate) {
      errors.packageWeightGram = `A slab for ${form.packageWeightGram}g already exists`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updatePackageDimensionSetting(editingId, form);
        toast.showSuccess('Package dimension setting updated successfully');
      } else {
        await adminApi.createPackageDimensionSetting(form);
        toast.showSuccess('Package dimension setting created successfully');
      }
      setFormOpen(false);
      loadSettings();
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.message.toLowerCase().includes('already exists') || parsed.message.toLowerCase().includes('duplicate')) {
        setFormErrors((prev) => ({ ...prev, packageWeightGram: parsed.message }));
      } else {
        toast.showError(parsed.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (setting: PackageDimensionSetting) => {
    const nextStatus = !setting.active;
    try {
      // Optimistic update
      setSettings((prev) =>
        prev.map((s) => (s.id === setting.id ? { ...s, active: nextStatus } : s))
      );
      await adminApi.updatePackageDimensionSettingStatus(setting.id, nextStatus);
      toast.showSuccess(`Weight slab status ${nextStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      // Revert status
      setSettings((prev) =>
        prev.map((s) => (s.id === setting.id ? { ...s, active: setting.active } : s))
      );
      toast.showError(parseApiError(err, 'Failed to update status').message);
    }
  };

  const handleOpenDelete = (setting: PackageDimensionSetting) => {
    setDeletingId(setting.id);
    setDeletingWeight(setting.packageWeightGram);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);
    try {
      await adminApi.deletePackageDimensionSetting(deletingId);
      toast.showSuccess('Package dimension setting deleted successfully');
      setDeleteConfirmOpen(false);
      loadSettings();
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to delete package setting').message);
    } finally {
      setDeletingLoading(false);
      setDeletingId(null);
    }
  };

  // Search filter
  const filteredSettings = settings.filter((s) =>
    s.packageWeightGram.toString().includes(searchQuery.trim())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Package Dimension & Weight
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure shipping package dimensions based on order weight limits.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Weight Slab
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          label="Search by Weight"
          placeholder="Enter weight in grams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Package Weight Limit (grams)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Length (cm)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Breadth (cm)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Height (cm)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {settings.length === 0
                        ? 'No configurations found. Falling back to application property defaults.'
                        : 'No matching weight slabs found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettings.map((setting) => (
                  <TableRow key={setting.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{setting.packageWeightGram}g</TableCell>
                    <TableCell>{setting.length} cm</TableCell>
                    <TableCell>{setting.breadth} cm</TableCell>
                    <TableCell>{setting.height} cm</TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.active}
                        onChange={() => handleToggleStatus(setting)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(setting)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleOpenDelete(setting)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Package Slab' : 'Add Package Weight Slab'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Package Weight Limit (grams)"
                type="number"
                fullWidth
                value={form.packageWeightGram}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, packageWeightGram: parseInt(e.target.value) || 0 }))
                }
                error={!!formErrors.packageWeightGram}
                helperText={formErrors.packageWeightGram}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Length"
                type="number"
                fullWidth
                value={form.length}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, length: parseInt(e.target.value) || 0 }))
                }
                error={!!formErrors.length}
                helperText={formErrors.length}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Breadth"
                type="number"
                fullWidth
                value={form.breadth}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))
                }
                error={!!formErrors.breadth}
                helperText={formErrors.breadth}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Height"
                type="number"
                fullWidth
                value={form.height}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, height: parseInt(e.target.value) || 0 }))
                }
                error={!!formErrors.height}
                helperText={formErrors.height}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Package Slab?"
        message={`Are you sure you want to permanently delete the weight slab setting for ${deletingWeight}g?`}
        confirmLabel="Delete"
        destructive
        loading={deletingLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Container>
  );
};

export default PackageDimensionSettingsPage;
