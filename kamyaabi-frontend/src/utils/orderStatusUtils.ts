export const ORDER_STEP_LABELS = ['Placed', 'Paid', 'Processing', 'Shipped', 'Delivered'] as const;

const PAID_STEP_INDEX = 1;

export const getActiveStep = (status: string, paymentStatus?: string): number => {
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

type StatusChipColor =
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

export const getPrimaryStatusLabel = (
  orderStatus?: string | null,
  shippingStatus?: string | null,
): string => {
  if (!orderStatus) return '';
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
  return formatStatus(orderStatus);
};

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

export const formatStatus = (status?: string | null): string => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
