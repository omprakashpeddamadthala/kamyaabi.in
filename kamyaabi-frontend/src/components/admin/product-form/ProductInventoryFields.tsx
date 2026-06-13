import React from 'react';
import {
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { ProductRequest } from '../../../api/adminApi';
import { Category, ProductTag } from '../../../types';
import { ProductFormErrors } from '../../../hooks/useProductForm';

interface ProductInventoryFieldsProps {
  form: ProductRequest;
  errors: ProductFormErrors;
  updateForm: (patch: Partial<ProductRequest>) => void;
  categories: Category[];
  allProductTags: ProductTag[];
  selectedTagIds: number[];
  onTagsChange: (ids: number[]) => void;
}

const ProductInventoryFields: React.FC<ProductInventoryFieldsProps> = ({
  form,
  errors,
  updateForm,
  categories,
  allProductTags,
  selectedTagIds,
  onTagsChange,
}) => (
  <>
    <Divider textAlign="left" sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
      <Typography variant="overline" color="text.secondary">Inventory</Typography>
    </Divider>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <FormControl fullWidth required error={!!errors.categoryId}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={form.categoryId || ''}
            onChange={(e) => updateForm({ categoryId: Number(e.target.value) })}
          >
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
          {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <TextField
          label="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => updateForm({ stock: Number(e.target.value) })}
          fullWidth
          error={!!errors.stock}
          helperText={errors.stock}
        />
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <TextField
          label="Weight"
          value={form.weight}
          onChange={(e) => updateForm({ weight: e.target.value })}
          fullWidth
          error={!!errors.weight}
          helperText={errors.weight}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth>
          <InputLabel>Unit</InputLabel>
          <Select
            label="Unit"
            value={form.unit}
            onChange={(e) => updateForm({ unit: e.target.value })}
          >
            <MenuItem value="g">g</MenuItem>
            <MenuItem value="kg">kg</MenuItem>
            <MenuItem value="pcs">pcs</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
    {allProductTags.length > 0 && (
      <FormControl fullWidth>
        <InputLabel>Tags</InputLabel>
        <Select
          label="Tags"
          multiple
          value={selectedTagIds}
          onChange={(e) => {
            const val = e.target.value;
            onTagsChange(typeof val === 'string' ? val.split(',').map(Number) : (val as number[]));
          }}
          renderValue={(selected) =>
            (selected as number[]).map((tid) => allProductTags.find((t) => t.id === tid)?.name ?? tid).join(', ')
          }
        >
          {allProductTags.map((tag) => (
            <MenuItem key={tag.id} value={tag.id}>{tag.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>Optional. Select tags for this product.</FormHelperText>
      </FormControl>
    )}
  </>
);

export default ProductInventoryFields;
