import React from 'react';
import {
  Box,
  Button,
  Divider,
  FormHelperText,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { CloudUpload, Delete, Star, StarBorder } from '@mui/icons-material';

import { withCloudinaryTransform } from '../../../utils/cloudinary';
import { useProductForm } from '../../../hooks/useProductForm';
import InlineConfirmBar from '../InlineConfirmBar';

type ImagesState = ReturnType<typeof useProductForm>['images'];

interface ProductImagesFieldProps {
  editingProductId: number | null;
  saving: boolean;
  uploadProgress: number | null;
  imagesError?: string;
  images: ImagesState;
}

const ProductImagesField: React.FC<ProductImagesFieldProps> = ({
  editingProductId,
  saving,
  uploadProgress,
  imagesError,
  images,
}) => {
  const {
    pendingImages,
    pendingPreviews,
    pendingMainIndex,
    setPendingMainIndex,
    existingImages,
    selectedExistingMainId,
    setSelectedExistingMainId,
    deletingImageId,
    imageToRemove,
    setImageToRemove,
    handleImageFilesSelected,
    handleRemovePendingImage,
    confirmRemoveExistingImage,
  } = images;

  return (
    <>
      <Divider textAlign="left" sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
        <Typography variant="overline" color="text.secondary">Images</Typography>
      </Divider>
      <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Product Images ({existingImages.length + pendingImages.length})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          JPG, PNG, WEBP, GIF, or AVIF. No size limit. Click a thumbnail to make it the main image.
        </Typography>
        {existingImages.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {existingImages.map((img) => (
              <Box key={img.id} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={withCloudinaryTransform(img.imageUrl, 'w_120,h_120,c_fill,q_auto,f_auto')}
                  alt="product"
                  onClick={() => setSelectedExistingMainId(img.id)}
                  sx={{
                    width: 88,
                    height: 88,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedExistingMainId === img.id ? 'primary.main' : 'transparent',
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove image"
                  sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                  onClick={() => setImageToRemove(img)}
                  disabled={deletingImageId === img.id}
                >
                  <Delete fontSize="small" />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: 'background.paper', borderRadius: '50%' }}>
                  {selectedExistingMainId === img.id ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        {pendingImages.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {pendingPreviews.map((preview, idx) => (
              <Box key={preview} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={preview}
                  alt="preview"
                  onClick={() => {
                    if (!editingProductId) setPendingMainIndex(idx);
                  }}
                  sx={{
                    width: 88,
                    height: 88,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: editingProductId ? 'default' : 'pointer',
                    border: '2px solid',
                    borderColor: !editingProductId && pendingMainIndex === idx ? 'primary.main' : 'transparent',
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove pending image"
                  sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper' }}
                  onClick={() => handleRemovePendingImage(idx)}
                  disabled={saving}
                >
                  <Delete fontSize="small" />
                </IconButton>
                {!editingProductId && (
                  <Box sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: 'background.paper', borderRadius: '50%' }}>
                    {pendingMainIndex === idx ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
        <Button variant="outlined" component="label" size="small" startIcon={<CloudUpload />} disabled={saving}>
          Upload Images
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                handleImageFilesSelected(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </Button>
        {imagesError && <FormHelperText error sx={{ mt: 1 }}>{imagesError}</FormHelperText>}
        {uploadProgress != null && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Uploading… {Math.round(uploadProgress * 100)}%</Typography>
            <LinearProgress variant="determinate" value={Math.round(uploadProgress * 100)} sx={{ mt: 0.5, borderRadius: 1, height: 6 }} />
          </Box>
        )}
        {editingProductId && (
          <Box sx={{ mt: 1.5 }}>
            <InlineConfirmBar
              open={Boolean(imageToRemove)}
              title="Remove image?"
              message="This permanently removes the image from the product."
              confirmLabel="Remove"
              loading={deletingImageId != null}
              onConfirm={confirmRemoveExistingImage}
              onCancel={() => setImageToRemove(null)}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default ProductImagesField;
