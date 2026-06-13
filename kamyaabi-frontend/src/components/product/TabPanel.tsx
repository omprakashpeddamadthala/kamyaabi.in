import React from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} id={`product-tabpanel-${index}`} aria-labelledby={`product-tab-${index}`}>
    {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
  </Box>
);

export default TabPanel;
