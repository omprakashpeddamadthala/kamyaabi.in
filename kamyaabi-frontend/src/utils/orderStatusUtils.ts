/**
 * Order Status Utilities — Single Source of Truth
 *
 * All order status display logic lives here.
 * Import from this file in every page/component that displays order status.
 * Do NOT duplicate these constants or functions elsewhere.
 */

// ── Step labels for the order progress stepper ──────────────────────────────

export const ORDER_STEP_LABELS = ['Placed', 'Paid', 'Processing', 'Shipped', 'Delivered'] as const;

export const PAID_STEP_INDEX = 1;

/**
 * Returns the active stepper index (0-based) for the given order status.
 * Returns -1 for terminal negative states (CANCELLED, PAYMENT_FAILED).
 */
export const getActiveStep = (status: string, paymentStatus?: string): number => {
  // Edge case: payment completed but order still PENDING (payment webhook race)
  if (paymentStatus === 'COMPLETED' && status === 'PENDING') {
    return PAID_STEP_INDEX + 1;
  }
  switch (status) {
    case 'PENDING':       return 0;
    case 'PAID':          return PAID_STEP_INDEX + 1;
    case 'CONFIRMED':
    case 'PROCESSING':    return 2;
    case 'SHIPPED':       return 3;
    case 'DELIVERED':     return ORDER_STEP_LABELS.length;
    default:              return -1;
  }
};

// ── MUI chip colour mapping ───────────────────────────────────────────────────

export type StatusChipColor =
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'default';

export const STATUS_COLORS: Record<string, StatusChipColor> = {
  PENDING:         'warning',
  PAID:            'info',
  CONFIRMED:       'info',
  PROCESSING:      'primary',
  SHIPPED:         'secondary',
  IN_TRANSIT:      'secondary',
  OUT_FOR_DELIVERY:'secondary',
  DELIVERED:       'success',
  CANCELLED:       'error',
  PAYMENT_FAILED:  'error',
  RTO:             'error',
  RETURN_INITIATED:'error',
};

/**
 * Maps order status + shipping status into the most descriptive human-readable
 * label to show as the primary chip on the order detail page.
 *
 * Priority: shippingStatus (when it carries more detail) > orderStatus.
 *
 * Examples:
 *   orderStatus=SHIPPED, shippingStatus=OUT_FOR_DELIVERY → "Out for Delivery"
 *   orderStatus=SHIPPED, shippingStatus=IN_TRANSIT        → "In Transit"
 *   orderStatus=DELIVERED, shippingStatus=DELIVERED        → "Delivered"
 *   orderStatus=CONFIRMED, shippingStatus=null             → "Confirmed"
 */
export const getPrimaryStatusLabel = (
  orderStatus?: string | null,
  shippingStatus?: string | null,
): string => {
  if (!orderStatus) return '';
  // When shippingStatus carries finer-grained info than orderStatus, prefer it
  if (shippingStatus) {
    const normalised = shippingStatus.toUpperCase().replace(/ /g, '_');
    const shippingOverrides: Record<string, string> = {
      OUT_FOR_DELIVERY:  'Out for Delivery',
      IN_TRANSIT:        'In Transit',
      RETURN_INITIATED:  'Return Initiated',
      RTO:               'Return to Origin',
      AWB_ASSIGNED:      'Shipment Assigned',
      PICKUP_SCHEDULED:  'Pickup Scheduled',
    };
    if (shippingOverrides[normalised]) {
      return shippingOverrides[normalised];
    }
  }
  // Fall back to orderStatus with title-case formatting
  return formatStatus(orderStatus);
};

/**
 * Returns the MUI chip colour for the primary display status.
 */
export const getPrimaryStatusColor = (
  orderStatus?: string | null,
  shippingStatus?: string | null,
): StatusChipColor => {
  if (!orderStatus) return 'default';
  if (shippingStatus) {
    const normalised = shippingStatus.toUpperCase().replace(/ /g, '_');
    if (STATUS_COLORS[normalised]) return STATUS_COLORS[normalised];
  }
  return STATUS_COLORS[orderStatus] ?? 'default';
};

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Converts a SCREAMING_SNAKE_CASE or "SPACED" status string to Title Case.
 * e.g. "PAYMENT_FAILED" → "Payment Failed", "IN TRANSIT" → "In Transit"
 */
export const formatStatus = (status?: string | null): string => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
