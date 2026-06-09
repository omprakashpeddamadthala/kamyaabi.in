import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { usePublicSettings } from '../../hooks/usePublicSettings';

interface AmazonBannerProps {
  /** `product` renders a compact ribbon for PDPs; `home` renders a full-width hero section. */
  variant?: 'product' | 'home';
}

const AMAZON_ORANGE = '#FF9900';

/** Stylised "amazon" wordmark + smile arrow (no external asset needed). */
const AmazonWordmark: React.FC<{ light?: boolean }> = ({ light }) => (
  <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
    <Typography
      component="span"
      sx={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 'var(--text-3xl)',
        letterSpacing: '-0.02em',
        color: light ? '#fff' : '#131921',
      }}
    >
      amazon
    </Typography>
    <Box
      component="svg"
      viewBox="0 0 100 24"
      sx={{ width: { xs: 60, sm: 74 }, height: 'auto', mt: '-4px' }}
      aria-hidden="true"
    >
      <path
        d="M5 6 C30 22, 70 22, 95 6"
        fill="none"
        stroke={AMAZON_ORANGE}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M93 2 L99 6 L92 11 Z" fill={AMAZON_ORANGE} />
    </Box>
  </Box>
);

const AmazonBanner: React.FC<AmazonBannerProps> = ({ variant = 'product' }) => {
  const settings = usePublicSettings();
  const url = settings?.amazon_store_url?.trim();

  if (!url) return null;

  if (variant === 'home') {
    return (
      <Box sx={{ py: { xs: 5, md: 8 }, px: 2, bgcolor: '#131921' }}>
        <Box
          sx={{
            maxWidth: 1100,
            mx: 'auto',
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(135deg, #232f3e 0%, #131921 100%)',
            border: '1px solid rgba(255,153,0,0.35)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 3, md: 4 },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: AMAZON_ORANGE, fontWeight: 700, letterSpacing: 2 }}
            >
              Shop With Confidence
            </Typography>
            <Typography
              variant="h4"
              sx={{ color: '#fff', fontWeight: 700, mb: 1, fontFamily: 'var(--font-display)' }}
            >
              Find Us on Amazon
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 520 }}>
              Prefer to shop on Amazon? Our premium dry fruits are available there too — with fast,
              reliable Amazon delivery and secure checkout.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
            }}
          >
            <AmazonWordmark light />
            <Button
              variant="contained"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon />}
              sx={{
                bgcolor: AMAZON_ORANGE,
                color: '#131921',
                fontWeight: 700,
                px: 4,
                py: 1.25,
                borderRadius: 2,
                '&:hover': { bgcolor: '#e88a00' },
              }}
            >
              Shop on Amazon
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Compact product-page ribbon.
  return (
    <Box
      sx={{
        mt: 3,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'rgba(255,153,0,0.5)',
        background: 'linear-gradient(135deg, #fff7ea 0%, #fffdf8 100%)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        textAlign: { xs: 'center', sm: 'left' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AmazonWordmark />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#131921' }}>
            Also Available on Amazon
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Buy this product on Amazon with fast, secure delivery.
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewIcon />}
        sx={{
          bgcolor: AMAZON_ORANGE,
          color: '#131921',
          fontWeight: 700,
          px: 3,
          borderRadius: 2,
          flexShrink: 0,
          '&:hover': { bgcolor: '#e88a00' },
        }}
      >
        View on Amazon
      </Button>
    </Box>
  );
};

export default AmazonBanner;
