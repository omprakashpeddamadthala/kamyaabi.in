import React from 'react';
// TASK 2: review images use the same zoomable lightbox (pinch / double-tap /
// scroll zoom, swipe + ESC to dismiss, keyboard nav, ARIA labels) for parity
// with the product gallery.
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
