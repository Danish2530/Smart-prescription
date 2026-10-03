import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ReminderContext = createContext(null);

export const ReminderProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeReminder, setActiveReminder] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [snoozedDoseIds, setSnoozedDoseIds] = useState({});

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    return 'denied';
  };

  const triggerBrowserNotification = useCallback((dose) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`💊 Dose Reminder: ${dose.medicationName || 'Medication'}`, {
          body: `${dose.strength || ''} (${dose.doseAmount || 1} ${dose.doseUnit || 'tablet'})\nScheduled for: ${dose.scheduledTime}\n${dose.instructions || ''}`,
          icon: '/favicon.svg',
        });
      } catch (e) {
        console.warn('Could not launch system notification:', e);
      }
    }
  }, []);

  // Periodic check for upcoming/due doses
  const checkDueDoses = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await api.get('/doses/today');
      if (res.data.success && res.data.doses) {
        const pendingDoses = res.data.doses.filter((d) => d.status === 'pending');

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if any dose is due or within window
        for (const dose of pendingDoses) {
          // Check snooze expiration
          const snoozedUntil = snoozedDoseIds[dose._id];
          if (snoozedUntil && Date.now() < snoozedUntil) {
            continue;
          }

          // If there is an unsnoozed pending dose, display reminder banner/modal
          if (!activeReminder) {
            setActiveReminder(dose);
            triggerBrowserNotification(dose);
            break;
          }
        }
      }
    } catch (err) {
      // Background check failure is non-blocking
    }
  }, [isAuthenticated, activeReminder, snoozedDoseIds, triggerBrowserNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    checkDueDoses();
    const interval = setInterval(checkDueDoses, 45000); // Check every 45 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, checkDueDoses]);

  const markAsTaken = async (doseId) => {
    try {
      const res = await api.post(`/doses/${doseId}/taken`);
      if (res.data.success) {
        if (activeReminder && activeReminder._id === doseId) {
          setActiveReminder(null);
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to mark dose taken:', err);
      throw err;
    }
  };

  const markAsMissed = async (doseId) => {
    try {
      const res = await api.post(`/doses/${doseId}/missed`);
      if (res.data.success) {
        if (activeReminder && activeReminder._id === doseId) {
          setActiveReminder(null);
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to mark dose missed:', err);
      throw err;
    }
  };

  const snooze = (doseId, minutes = 15) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    setSnoozedDoseIds((prev) => ({ ...prev, [doseId]: snoozeUntil }));
    if (activeReminder && activeReminder._id === doseId) {
      setActiveReminder(null);
    }
  };

  const dismiss = () => {
    setActiveReminder(null);
  };

  return (
    <ReminderContext.Provider
      value={{
        activeReminder,
        notificationPermission,
        requestPermission,
        markAsTaken,
        markAsMissed,
        snooze,
        dismiss,
        checkDueDoses,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminder = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminder must be used within a ReminderProvider');
  }
  return context;
};
