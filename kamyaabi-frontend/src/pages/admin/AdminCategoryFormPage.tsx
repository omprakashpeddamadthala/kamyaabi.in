import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from '@mui/material';
import { adminApi, CategoryRequest } from '../../api/adminApi';
import { categoryApi } from '../../api/categoryApi';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../../components/common/ToastProvider';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchCategories } from '../../features/product/productSlice';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';

interface CategoryFormErrors {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

const slugify = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const LIST_PATH = '/admin/categories';

const AdminCategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingCategoryId = id ? Number(id) : null;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { categories } = useAppSelector((state) => state.products);

  const [loading, setLoading] = useState<boolean>(Boolean(editingCategoryId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState<boolean>(Boolean(editingCategoryId));
  const [form, setForm] = useState<CategoryRequest>({ name: '', slug: '', description: '', imageUrl: '', parentId: null });
  const [errors, setErrors] = useState<CategoryFormErrors>({});

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!editingCategoryId) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    categoryApi
      .getById(editingCategoryId)
      .then((res) => {
        if (!active) return;
        const c = res.data.data;
        setForm({
          name: c.name,
          slug: c.slug || '',
          description: c.description || '',
          imageUrl: c.imageUrl || '',
          parentId: c.parentId,
        });
      })
      .catch((err) => {
        if (active) setLoadError(parseApiError(err, 'Failed to load category').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editingCategoryId]);

  const parentOptions = useMemo(
    () => categories.filter((c) => c.id !== editingCategoryId && !c.parentId),
    [categories, editingCategoryId],
  );

  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value, slug: slugManual ? prev.slug : slugify(value) }));
  };

  const validate = (): boolean => {
    const errs: CategoryFormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errs.slug = 'Slug must be lowercase letters/numbers separated by hyphens';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CategoryRequest = {
        ...form,
        slug: form.slug ? form.slug : undefined,
        parentId: form.parentId || null,
      };
      if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, payload);
        showSuccess('Category updated');
      } else {
        await adminApi.createCategory(payload);
        showSuccess('Category created');
      }
      dispatch(fetchCategories());
      navigate(LIST_PATH);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save category');
      if (Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: CategoryFormErrors = {};
        for (const [key, value] of Object.entries(parsed.fieldErrors)) {
          (mapped as Record<string, string>)[key] = value;
        }
        setErrors(mapped);
      }
      showError(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={360} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingCategoryId ? 'Edit Category' : 'Add Category'}
      subtitle="Product categories organise the storefront catalog and navigation."
      onSubmit={handleSave}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingCategoryId ? 'Save changes' : 'Create category'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load category"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugManual(true);
            setForm({ ...form, slug: e.target.value });
          }}
          fullWidth
          error={!!errors.slug}
          helperText={errors.slug ?? 'Auto-generated from name. Override to customize the URL slug.'}
        />
        <FormControl fullWidth>
          <InputLabel>Parent category</InputLabel>
          <Select
            label="Parent category"
            value={form.parentId ?? ''}
            onChange={(e) => setForm({ ...form, parentId: e.target.value === '' ? null : Number(e.target.value) })}
          >
            <MenuItem value="">No parent (top-level)</MenuItem>
            {parentOptions.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.parentId ?? 'Optional. Only top-level categories can be parents.'}</FormHelperText>
        </FormControl>
        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          fullWidth
          multiline
          rows={2}
          error={!!errors.description}
          helperText={errors.description}
        />
        <TextField
          label="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          fullWidth
          helperText="Optional. Category banner/thumbnail image URL."
        />
      </Box>
    </AdminFormShell>
  );
};

export default AdminCategoryFormPage;
