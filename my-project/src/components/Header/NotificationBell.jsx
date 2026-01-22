import React, { useMemo, useState } from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    top: 13,
    border: `2px solid ${(theme.vars ?? theme).palette.background.paper}`,
    padding: "0 4px",
  },
  [theme.breakpoints.down('sm')]: {
    "& .MuiBadge-badge": {
      right: -2,
      top: 10,
      padding: "0 3px",
      fontSize: 10,
      minWidth: 16,
      height: 16,
      lineHeight: '16px',
    },
  },
}));

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const items = useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).slice(0, 10);
  }, [notifications]);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClickNotification = async (n) => {
    const id = String(n?.id || '');
    if (id && !n?.isRead) {
      await markRead(id);
    }
    handleClose();
    navigate('/orders');
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  return (
    <>
      <Tooltip title="Notifications" arrow>
        <IconButton
          aria-label="notifications"
          onClick={handleOpen}
          className="!w-10 !h-10 sm:!w-11 sm:!h-11 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors rounded-xl"
        >
          <StyledBadge badgeContent={unreadCount} color="secondary">
            <FiBell className="text-lg sm:text-xl md:text-2xl text-text-700 dark:text-text-300" />
          </StyledBadge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: '90vw',
            mt: 1,
          },
        }}
      >
        <MenuItem disabled>
          <div className="w-full flex items-center justify-between">
            <div className="font-semibold">Notifications</div>
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          </div>
        </MenuItem>
        <Divider />

        {items.length === 0 ? (
          <MenuItem disabled>No notifications</MenuItem>
        ) : (
          items.map((n) => (
            <MenuItem
              key={String(n?.id || Math.random())}
              onClick={() => handleClickNotification(n)}
              sx={{
                whiteSpace: 'normal',
                alignItems: 'flex-start',
                gap: 1,
                opacity: n?.isRead ? 0.7 : 1,
              }}
            >
              <div className="w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{String(n?.title || 'Notification')}</div>
                  <div className="text-xs text-gray-500">{n?.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{String(n?.message || '')}</div>
              </div>
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/orders');
          }}
        >
          View Orders
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;
