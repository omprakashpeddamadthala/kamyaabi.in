import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import { Delete, CloudUpload } from '@mui/icons-material';
import { galleryApi, GalleryImage } from '../../api/galleryApi';

const AdminGalleryPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(() => {
    setLoading(true);
    galleryApi.getAll()
      .then((res) => setImages(res.data.data ?? []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    try {
      await galleryApi.upload(file);
      setFeedback({ type: 'success', text: 'Image uploaded successfully' });
      loadImages();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this gallery image?')) return;
    setDeletingId(id);
    setFeedback(null);
    try {
      await galleryApi.delete(id);
      setFeedback({ type: 'success', text: 'Image deleted' });
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      setFeedback({ type: 'error', text: 'Failed to delete image' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Gallery</Typography>
        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={handleUpload}
        />
      </Box>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : images.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          No gallery images yet. Upload one to get started.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {images.map((img) => (
            <Grid item xs={6} sm={4} md={3} key={img.id}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  image={img.imageUrl}
                  alt={`Gallery ${img.id}`}
                  sx={{ height: 180, objectFit: 'cover' }}
                />
                <IconButton
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: '#fff', color: 'error.main' },
                  }}
                >
                  {deletingId === img.id ? <CircularProgress size={18} /> : <Delete fontSize="small" />}
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminGalleryPage;
