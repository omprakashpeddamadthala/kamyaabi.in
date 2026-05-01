export const CLOUDINARY_THUMBNAIL_TRANSFORM = 'w_300,h_300,c_fill,q_auto,f_auto';

const UPLOAD_SEGMENT = '/upload/';

export const withCloudinaryTransform = (
  url: string | null | undefined,
  transform: string = CLOUDINARY_THUMBNAIL_TRANSFORM,
): string => {
  if (!url) return '';
  const idx = url.indexOf(UPLOAD_SEGMENT);
  if (idx === -1) return url;
  return url.slice(0, idx + UPLOAD_SEGMENT.length) + transform + '/' + url.slice(idx + UPLOAD_SEGMENT.length);
};

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
