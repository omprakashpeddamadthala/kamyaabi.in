import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { config } from '../../config';

const FACEBOOK_BLUE = '#1877F2';
const INSTAGRAM_GRADIENT = 'linear-gradient(45deg, #E1306C, #833AB4)';

interface SocialLinksProps {
  size?: number;
  color?: string;
  gap?: number;
  sx?: SxProps<Theme>;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ size = 24, color = 'inherit', gap = 1, sx }) => {
  const platforms = [
    {
      name: 'Facebook',
      href: config.facebookUrl,
      label: 'Follow us on Facebook',
      Icon: FacebookIcon,
      hover: { color: FACEBOOK_BLUE },
    },
    {
      name: 'Instagram',
      href: config.instagramUrl,
      label: 'Follow us on Instagram',
      Icon: InstagramIcon,
      hover: { background: INSTAGRAM_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap, ...sx }}>
      {platforms.map(({ name, href, label, Icon, hover }) => (
        <Tooltip key={name} title={label} arrow>
          <IconButton
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            sx={{
              color,
              p: 0.75,
              transition: 'transform 0.2s ease, color 0.2s ease',
              '&:hover': { transform: 'scale(1.15)', ...hover },
              '&:hover .MuiSvgIcon-root': hover,
            }}
          >
            <Icon sx={{ fontSize: size }} />
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export default SocialLinks;
