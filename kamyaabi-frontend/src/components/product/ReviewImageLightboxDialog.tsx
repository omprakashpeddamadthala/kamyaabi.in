import React from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface ReviewImageLightboxDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ReviewImageLightboxDialog: React.FC<ReviewImageLightboxDialogProps> = ({ imageUrl, onClose }) => (
  <Dialog
    open={!!imageUrl}
    onClose={onClose}
    maxWidth="md"
    PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none' } }}
  >
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}
      >
        <Close />
      </IconButton>
      {imageUrl && (
        <Box component="img" src={imageUrl} alt="Review image" sx={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
      )}
    </Box>
  </Dialog>
);

export default ReviewImageLightboxDialog;
