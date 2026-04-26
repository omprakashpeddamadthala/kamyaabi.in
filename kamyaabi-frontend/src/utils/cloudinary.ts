export const CLOUDINARY_THUMBNAIL_TRANSFORM = 'w_300,h_300,c_fill,q_auto,f_auto';

const UPLOAD_SEGMENT = '/upload/';

/**
 * Append Cloudinary transformations to a secure_url so we serve optimized thumbnails
 * on list cards. If the URL is not a Cloudinary upload URL it is returned unchanged.
 */
export const withCloudinaryTransform = (
  url: string | null | undefined,
  transform: string = CLOUDINARY_THUMBNAIL_TRANSFORM,
): string => {
  if (!url) return '';
  const idx = url.indexOf(UPLOAD_SEGMENT);
  if (idx === -1) return url;
  return url.slice(0, idx + UPLOAD_SEGMENT.length) + transform + '/' + url.slice(idx + UPLOAD_SEGMENT.length);
};
