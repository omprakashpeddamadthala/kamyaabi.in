import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings,
  Block,
  CheckCircle,
  LockOpen,
  PersonOutline,
  Search as SearchIcon,
} from '@mui/icons-material';
import { adminApi } from '../../api/adminApi';
import { AdminUser, PageResponse } from '../../types';
import { parseApiError } from '../../utils/apiError';
import { useToast } from '../common/ToastProvider';
import ConfirmDialog from '../common/ConfirmDialog';
import TableSkeleton from '../common/TableSkeleton';

interface UsersTabProps {
  /** Whether the tab is the active one. Avoids fetches while hidden. */
  active: boolean;
  /** Currently logged-in admin id. Used to disable self-modification. */
  currentUserId: number | undefined;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onConfirm: (() => Promise<void>) | (() => void);
}

const PAGE_SIZE = 20;

const closedConfirm: ConfirmState = {
  open: false,
  title: '',
  message: '',
  loading: false,
  onConfirm: () => undefined,
};

const formatDate = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
};

const initial = (name?: string, email?: string): string => {
  const source = (name || email || '?').trim();
  return source.length > 0 ? source.charAt(0).toUpperCase() : '?';
};

/**
 * Admin user-management table. Allows promoting/demoting users between USER
 * and ADMIN, and blocking/unblocking accounts. Self-modification is disabled
 * client-side (the backend also enforces this).
 */
const UsersTab: React.FC<UsersTabProps> = ({ active, currentUserId }) => {
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(closedConfirm);

  const loadUsers = useCallback(
    async (nextPage: number, q: string) => {
      setLoading(true);
      try {
        const response = await adminApi.getUsers(nextPage, PAGE_SIZE, q || undefined);
        const data: PageResponse<AdminUser> = response.data.data;
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (error) {
        showError(parseApiError(error, 'Failed to load users').message);
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  // Debounce search-input → search query so each keystroke doesn't fire a request.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (active) loadUsers(page, search);
  }, [active, page, search, loadUsers]);

  const closeConfirm = useCallback(() => setConfirm(closedConfirm), []);

  const handleToggleRole = useCallback(
    (user: AdminUser) => {
      if (user.id === currentUserId) return;
      const nextRole: 'USER' | 'ADMIN' = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const verb = nextRole === 'ADMIN' ? 'promote' : 'demote';
      setConfirm({
        open: true,
        loading: false,
        title: `${verb === 'promote' ? 'Make Admin' : 'Remove Admin'}?`,
        message: `Are you sure you want to ${verb} ${user.name || user.email}?`,
        onConfirm: async () => {
          setConfirm((prev) => ({ ...prev, loading: true }));
          setRowLoadingId(user.id);
          try {
            const response = await adminApi.updateUserRole(user.id, nextRole);
            const updated = response.data.data;
            setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
            showSuccess(`Updated ${user.email} to ${nextRole}`);
            closeConfirm();
          } catch (error) {
            showError(parseApiError(error, 'Failed to update role').message);
            setConfirm((prev) => ({ ...prev, loading: false }));
          } finally {
            setRowLoadingId(null);
          }
        },
      });
    },
    [closeConfirm, currentUserId, showError, showSuccess],
  );

  const handleToggleStatus = useCallback(
    (user: AdminUser) => {
      if (user.id === currentUserId) return;
      const nextStatus: 'ACTIVE' | 'BLOCKED' = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      const verb = nextStatus === 'BLOCKED' ? 'block' : 'unblock';
      setConfirm({
        open: true,
        loading: false,
        title: `${verb === 'block' ? 'Block account' : 'Unblock account'}?`,
        message: `Are you sure you want to ${verb} ${user.name || user.email}? `
          + `${verb === 'block' ? 'They will be signed out and unable to access the site.' : 'They will regain access immediately.'}`,
        onConfirm: async () => {
          setConfirm((prev) => ({ ...prev, loading: true }));
          setRowLoadingId(user.id);
          try {
            const response = await adminApi.updateUserStatus(user.id, nextStatus);
            const updated = response.data.data;
            setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
            showSuccess(`${user.email} is now ${nextStatus.toLowerCase()}`);
            closeConfirm();
          } catch (error) {
            showError(parseApiError(error, 'Failed to update status').message);
            setConfirm((prev) => ({ ...prev, loading: false }));
          } finally {
            setRowLoadingId(null);
          }
        },
      });
    },
    [closeConfirm, currentUserId, showError, showSuccess],
  );

  const summary = useMemo(() => {
    if (loading && users.length === 0) return 'Loading users…';
    if (totalElements === 0) return 'No users found';
    const start = page * PAGE_SIZE + 1;
    const end = Math.min((page + 1) * PAGE_SIZE, totalElements);
    return `Showing ${start}–${end} of ${totalElements} users`;
  }, [loading, page, totalElements, users.length]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {summary}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: { sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="users-table">
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableSkeleton rows={6} columns={7} />
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No users match the current filter.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId;
                const rowBusy = rowLoadingId === user.id;
                return (
                  <TableRow key={user.id} hover>
                    <TableCell>#{user.id}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={user.avatarUrl ?? undefined}
                          alt={user.name}
                          sx={{ width: 32, height: 32, fontSize: 14 }}
                        >
                          {initial(user.name, user.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name || '—'}
                          </Typography>
                          {isSelf && (
                            <Typography variant="caption" color="primary">
                              You
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={user.role === 'ADMIN' ? <AdminPanelSettings /> : <PersonOutline />}
                        label={user.role === 'ADMIN' ? 'Admin' : 'User'}
                        color={user.role === 'ADMIN' ? 'primary' : 'default'}
                        variant={user.role === 'ADMIN' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={user.status === 'BLOCKED' ? <Block /> : <CheckCircle />}
                        label={user.status === 'BLOCKED' ? 'Blocked' : 'Active'}
                        color={user.status === 'BLOCKED' ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip
                          title={isSelf ? 'You cannot change your own role' : ''}
                          disableHoverListener={!isSelf}
                        >
                          <span>
                            <Button
                              size="small"
                              variant={user.role === 'ADMIN' ? 'outlined' : 'contained'}
                              color="primary"
                              disabled={isSelf || rowBusy}
                              onClick={() => handleToggleRole(user)}
                              startIcon={<AdminPanelSettings />}
                            >
                              {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={isSelf ? 'You cannot block your own account' : ''}
                          disableHoverListener={!isSelf}
                        >
                          <span>
                            <IconButton
                              size="small"
                              color={user.status === 'BLOCKED' ? 'success' : 'error'}
                              disabled={isSelf || rowBusy}
                              onClick={() => handleToggleStatus(user)}
                              aria-label={user.status === 'BLOCKED' ? 'Unblock user' : 'Block user'}
                            >
                              {user.status === 'BLOCKED' ? <LockOpen /> : <Block />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            color="primary"
            onChange={(_, value) => setPage(value - 1)}
          />
        </Stack>
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        loading={confirm.loading}
        onCancel={closeConfirm}
        onConfirm={confirm.onConfirm}
      />
    </Box>
  );
};

export default UsersTab;
