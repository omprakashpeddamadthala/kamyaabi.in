import React from 'react';
import { Grid, TextField } from '@mui/material';

import { ProductRequest } from '../../../api/adminApi';
import { ProductFormErrors } from '../../../hooks/useProductForm';

interface ProductBasicFieldsProps {
  form: ProductRequest;
  errors: ProductFormErrors;
  updateForm: (patch: Partial<ProductRequest>) => void;
}

const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({ form, errors, updateForm }) => (
  <>
    <TextField
      label="Name"
      value={form.name}
      onChange={(e) => updateForm({ name: e.target.value })}
      fullWidth
      required
      error={!!errors.name}
      helperText={errors.name}
    />
    <TextField
      label="Description"
      value={form.description}
      onChange={(e) => updateForm({ description: e.target.value })}
      fullWidth
      multiline
      rows={3}
      error={!!errors.description}
      helperText={errors.description}
    />
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Price (MRP) ₹"
          type="number"
          value={form.price || ''}
          onChange={(e) => updateForm({ price: Number(e.target.value) })}
          fullWidth
          required
          error={!!errors.price}
          helperText={errors.price ?? 'Original price before any discount'}
          inputProps={{ min: 0, step: '0.01' }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Discount Price ₹"
          type="number"
          value={form.discountPrice || ''}
          onChange={(e) => updateForm({ discountPrice: Number(e.target.value) })}
          fullWidth
          error={!!errors.discountPrice}
          helperText={errors.discountPrice ?? 'Optional. Must be less than MRP.'}
          inputProps={{ min: 0, step: '0.01' }}
        />
      </Grid>
    </Grid>
  </>
);

export default ProductBasicFields;
