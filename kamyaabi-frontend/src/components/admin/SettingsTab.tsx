import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { adminApi, SettingMetadata } from '../../api/adminApi';
import { useToast } from '../common/useToast';
import { parseApiError } from '../../utils/apiError';

interface SettingsTabProps {
  active: boolean;
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

const validateSetting = (meta: SettingMetadata, raw: string): string | null => {
  const value = raw.trim();
  if (meta.required && value === '') {
    return 'This field is required';
  }
  switch (meta.dataType) {
    case 'NUMBER': {
      if (value === '' && !meta.required) return null;
      const n = Number(value);
      if (!Number.isInteger(n)) return 'Must be a whole number';
      if (meta.min != null && n < meta.min) return `Must be \u2265 ${meta.min}`;
      if (meta.max != null && n > meta.max) return `Must be \u2264 ${meta.max}`;
      return null;
    }
    case 'URL': {
      if (value !== '' && !isHttpUrl(value)) {
        return 'Must start with http:// or https://';
      }
      return null;
    }
    case 'JSON': {
      if (value === '') return null;
      try {
        JSON.parse(value);
        return null;
      } catch {
        return 'Must be valid JSON';
      }
    }
    default:
      return null;
  }
};

interface SettingRowProps {
  meta: SettingMetadata;
  value: string;
  error?: string;
  showSecret: boolean;
  onToggleSecret: () => void;
  onChange: (value: string) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  meta,
  value,
  error,
  showSecret,
  onToggleSecret,
  onChange,
}) => {
  const helper = error ?? meta.helperText ?? undefined;
  const disabled = !meta.editable;

  const renderControl = () => {
    switch (meta.dataType) {
      case 'BOOLEAN': {
        const checked = value.toLowerCase() === 'true';
        return (
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Switch
                checked={checked}
                disabled={disabled}
                onChange={(_, c) => onChange(c ? 'true' : 'false')}
              />
            }
            label={checked ? 'Enabled' : 'Disabled'}
          />
        );
      }
      case 'NUMBER':
        return (
          <TextField
            type="number"
            size="small"
            fullWidth
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            error={!!error}
            helperText={helper}
            inputProps={{ min: meta.min ?? undefined, max: meta.max ?? undefined, step: 1 }}
          />
        );
      case 'SECRET':
        return (
          <TextField
            type={showSecret ? 'text' : 'password'}
            size="small"
            fullWidth
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            error={!!error}
            helperText={helper}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showSecret ? 'Hide value' : 'Show value'}
                    onClick={onToggleSecret}
                    edge="end"
                    size="small"
                  >
                    {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        );
      case 'JSON':
        return (
          <TextField
            multiline
            minRows={3}
            size="small"
            fullWidth
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            error={!!error}
            helperText={helper}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
          />
        );
      case 'URL':
      case 'STRING':
      default:
        return (
          <TextField
            type={meta.dataType === 'URL' ? 'url' : 'text'}
            size="small"
            fullWidth
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            error={!!error}
            helperText={helper}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-start' },
        gap: { xs: 1, md: 3 },
        py: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {meta.label}
        </Typography>
        {meta.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {meta.description}
          </Typography>
        )}
        {meta.defaultValue !== '' && meta.dataType !== 'BOOLEAN' && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
            Default: {meta.defaultValue}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: { xs: '100%', md: 320 },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {renderControl()}
      </Box>
    </Box>
  );
};

const SettingsTab: React.FC<SettingsTabProps> = ({ active }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<SettingMetadata[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    adminApi
      .getSettingsMetadata()
      .then((res) => {
        if (cancelled) return;
        const list = res.data.data ?? [];
        const initial: Record<string, string> = {};
        list.forEach((m) => {
          initial[m.key] = m.value ?? '';
        });
        setMetadata(list);
        setValues(initial);
        setBaseline(initial);
        setErrors({});
      })
      .catch((err) => {
        if (cancelled) return;
        toast.showError(parseApiError(err, 'Failed to load settings').message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [active, toast]);

  const dirtyKeys = useMemo(
    () => metadata.filter((m) => (values[m.key] ?? '') !== (baseline[m.key] ?? '')).map((m) => m.key),
    [metadata, values, baseline],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return metadata;
    return metadata.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q),
    );
  }, [metadata, search]);

  const grouped = useMemo(() => {
    const groups: { category: string; items: SettingMetadata[] }[] = [];
    filtered.forEach((m) => {
      let group = groups.find((g) => g.category === m.category);
      if (!group) {
        group = { category: m.category, items: [] };
        groups.push(group);
      }
      group.items.push(m);
    });
    return groups;
  }, [filtered]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSave = async () => {
    if (dirtyKeys.length === 0) {
      toast.showToast('No changes to save', 'info');
      return;
    }
    const nextErrors: Record<string, string> = {};
    dirtyKeys.forEach((key) => {
      const meta = metadata.find((m) => m.key === key);
      if (!meta) return;
      const err = validateSetting(meta, values[key] ?? '');
      if (err) nextErrors[key] = err;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.showToast('Please fix the highlighted fields before saving', 'warning');
      return;
    }

    const payload: Record<string, string> = {};
    dirtyKeys.forEach((key) => {
      payload[key] = (values[key] ?? '').trim();
    });

    setSaving(true);
    try {
      const res = await adminApi.updateSettings(payload);
      const saved = res.data.data ?? {};
      setBaseline((prev) => {
        const next = { ...prev };
        dirtyKeys.forEach((key) => {
          next[key] = saved[key] ?? payload[key];
        });
        return next;
      });
      setValues((prev) => {
        const next = { ...prev };
        dirtyKeys.forEach((key) => {
          next[key] = saved[key] ?? payload[key];
        });
        return next;
      });
      toast.showSuccess('Settings updated');
    } catch (err) {
      toast.showError(parseApiError(err, 'Failed to update settings').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Platform Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tune storefront behavior without redeploying. Changes apply immediately.
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search settings\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {grouped.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No settings match &quot;{search}&quot;.
          </Typography>
        ) : (
          <Stack spacing={3}>
            {grouped.map((group) => (
              <Box key={group.category}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {group.category}
                  </Typography>
                  <Chip label={group.items.length} size="small" />
                </Stack>
                <Divider />
                <Stack divider={<Divider />}>
                  {group.items.map((meta) => (
                    <SettingRow
                      key={meta.key}
                      meta={meta}
                      value={values[meta.key] ?? ''}
                      error={errors[meta.key]}
                      showSecret={!!showSecret[meta.key]}
                      onToggleSecret={() =>
                        setShowSecret((prev) => ({ ...prev, [meta.key]: !prev[meta.key] }))
                      }
                      onChange={(v) => handleChange(meta.key, v)}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>

      {dirtyKeys.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 2,
            px: 3,
            py: 1.5,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
            {dirtyKeys.length} unsaved change{dirtyKeys.length > 1 ? 's' : ''}
          </Typography>
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => {
              setValues(baseline);
              setErrors({});
            }}
          >
            Discard
          </Button>
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {saving ? 'Saving\u2026' : 'Save Changes'}
          </Button>
        </Paper>
      )}
    </Card>
  );
};

export default SettingsTab;
