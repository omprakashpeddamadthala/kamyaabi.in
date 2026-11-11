import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

interface ReviewImageLightboxDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ReviewImageLightboxDialog: React.FC<ReviewImageLightboxDialogProps> = ({ imageUrl, onClose }) => (
  <Lightbox
    open={!!imageUrl}
    close={onClose}
    slides={imageUrl ? [{ src: imageUrl, alt: 'Review image' }] : []}
    plugins={[Zoom]}
    carousel={{ finite: true }}
    controller={{ closeOnBackdropClick: true }}
    zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2, scrollToZoom: true }}
    render={{ buttonPrev: () => null, buttonNext: () => null }}
    styles={{ container: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
  />
);

export default ReviewImageLightboxDialog;
