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

/**
 * Build a responsive `srcSet` for a Cloudinary upload URL across the given
 * pixel widths. Each variant uses `c_limit` so we never upscale beyond the
 * original asset. Returns an empty string when the URL isn't a Cloudinary
 * upload URL — call sites can omit `srcSet` in that case.
 */
export const cloudinarySrcSet = (
  url: string | null | undefined,
  widths: readonly number[] = [400, 600, 800, 1200],
): string => {
  if (!url) return '';
  if (url.indexOf(UPLOAD_SEGMENT) === -1) return '';
  return widths
    .map((w) => `${withCloudinaryTransform(url, `w_${w},c_limit,q_auto,f_auto`)} ${w}w`)
    .join(', ');
};
