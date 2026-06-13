import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import { ProductRequest } from '../../../api/adminApi';

interface ProductSeoAccordionProps {
  form: ProductRequest;
  updateForm: (patch: Partial<ProductRequest>) => void;
}

const ProductSeoAccordion: React.FC<ProductSeoAccordionProps> = ({ form, updateForm }) => (
  <Accordion disableGutters sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle2">SEO Settings</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Meta Title"
          value={form.seoTitle || ''}
          onChange={(e) => updateForm({ seoTitle: e.target.value })}
          fullWidth
          helperText="Page title for search engines (50-60 chars recommended)"
        />
        <TextField
          label="Meta Description"
          value={form.seoDescription || ''}
          onChange={(e) => updateForm({ seoDescription: e.target.value })}
          fullWidth
          multiline
          rows={2}
          helperText="Page description for search engines (150-160 chars recommended)"
        />
        <TextField
          label="Meta Keywords"
          value={form.seoKeywords || ''}
          onChange={(e) => updateForm({ seoKeywords: e.target.value })}
          fullWidth
          helperText="Comma-separated keywords"
        />
        <TextField
          label="OG Image URL"
          value={form.ogImageUrl || ''}
          onChange={(e) => updateForm({ ogImageUrl: e.target.value })}
          fullWidth
          helperText="Image URL for social media sharing (1200x630px recommended)"
        />
        <TextField
          label="Canonical URL"
          value={form.canonicalUrl || ''}
          onChange={(e) => updateForm({ canonicalUrl: e.target.value })}
          fullWidth
          helperText="Canonical URL if different from the default product page URL"
        />
      </Box>
    </AccordionDetails>
  </Accordion>
);

export default ProductSeoAccordion;
