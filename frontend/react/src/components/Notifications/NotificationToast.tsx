import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { websocketService, Notification } from '../../services/websocket';

const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Add listener for notifications
    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, 5000);
    };

    websocketService.addListener(handleNotification);

    // Cleanup
    return () => {
      websocketService.removeListener(handleNotification);
    };
  }, []);

  const handleClose = (notification: Notification) => {
    setNotifications(prev => prev.filter(n => n !== notification));
  };

  const getNotificationSeverity = (type: string): 'success' | 'info' | 'warning' | 'error' => {
    if (type.includes('error')) return 'error';
    if (type.includes('warning')) return 'warning';
    if (type.includes('created') || type.includes('returned')) return 'success';
    return 'info';
  };

  const getNotificationTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'book.created': 'Nouveau livre',
      'book.borrowed': 'Emprunt',
      'book.returned': 'Retour',
      'review.added': 'Nouvel avis',
      'import.completed': 'Import terminé',
    };
    return titles[type] || 'Notification';
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={`${notification.timestamp}-${index}`}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          style={{ top: 24 + (index * 80) }}
        >
          <Alert
            onClose={() => handleClose(notification)}
            severity={getNotificationSeverity(notification.type)}
            variant="filled"
            sx={{ width: '100%' }}
          >
            <AlertTitle>{getNotificationTitle(notification.type)}</AlertTitle>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationToast;

