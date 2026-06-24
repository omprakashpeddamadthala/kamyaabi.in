import React from 'react';
// GSC FIX / TASK 2: replace the bespoke MUI dialog with yet-another-react-lightbox
// so product images get proper zoom on every device — pinch-to-zoom + double-tap
// on touch screens, scroll / double-click / button zoom on desktop (>=2x), swipe
// to navigate, swipe/ESC to dismiss, keyboard arrow navigation and built-in ARIA
// labelling on all controls. Lazy loading + alt text on the gallery thumbnails are
// untouched.
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { withCloudinaryTransform } from '../../utils/cloudinary';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../config/images';
import type { ProductImage } from '../../types';

interface ImageLightboxDialogProps {
  open: boolean;
  onClose: () => void;
  galleryImages: ProductImage[];
  safeIdx: number;
  productName: string;
  onSelectIdx: (idx: number) => void;
}

const ImageLightboxDialog: React.FC<ImageLightboxDialogProps> = ({
  open,
  onClose,
  galleryImages,
  safeIdx,
  productName,
  onSelectIdx,
}) => {
  const slides = (galleryImages.length > 0 ? galleryImages : [{ imageUrl: '' } as ProductImage]).map(
    (img, idx) => ({
      src: withCloudinaryTransform(img.imageUrl, 'w_1600,c_limit,q_auto,f_auto') || PRODUCT_PLACEHOLDER_IMAGE,
      alt: galleryImages.length > 1 ? `${productName} image ${idx + 1}` : productName,
    }),
  );

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={safeIdx}
      slides={slides}
      plugins={[Zoom]}
      // Keep the external thumbnail strip in sync as the user swipes/navigates.
      on={{ view: ({ index }) => onSelectIdx(index) }}
      carousel={{ finite: slides.length <= 1 }}
      controller={{ closeOnBackdropClick: true }}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickMaxStops: 2,
        scrollToZoom: true,
      }}
      // Hide prev/next affordances when there is only a single image.
      render={
        slides.length <= 1
          ? { buttonPrev: () => null, buttonNext: () => null }
          : undefined
      }
      styles={{ container: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
    />
  );
};

export default ImageLightboxDialog;
