import React, { useEffect, useState, useRef } from 'react';
import { LinearProgress, Box, Fade } from '@mui/material';
import axiosInstance from '../../api/axiosInstance';

const GlobalLoadingBar: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeRequests > 0) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setVisible(true);
    } else {
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 300);
    }
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [activeRequests]);

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        setActiveRequests((prev) => prev + 1);
        return config;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return response;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <Fade in={visible} timeout={{ enter: 200, exit: 400 }}>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
        <LinearProgress
          color="primary"
          sx={{
            height: 3,
            '& .MuiLinearProgress-bar': {
              transition: 'transform 0.3s linear',
            },
          }}
        />
      </Box>
    </Fade>
  );
};

export default GlobalLoadingBar;
