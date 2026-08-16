const cron = require('node-cron');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const { Task, Goal, Event, User } = require('./models');

// Initialize Firebase Admin SDK
const firebaseAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
if (firebaseAccountVar) {
  try {
    const serviceAccount = JSON.parse(firebaseAccountVar);
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    console.log('[Scheduler] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[Scheduler] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
  }
} else {
  console.warn('[Scheduler] Warning: FIREBASE_SERVICE_ACCOUNT environment variable is not defined. Push notifications will be disabled.');
}

// Helper function to send push notifications
async function sendPushNotification(user, title, body, clickActionUrl) {
  const fcmToken = user.fcmToken;
  if (!admin.getApps().length || !fcmToken) return;
  
  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      click_action: clickActionUrl || '/'
    },
    webpush: {
      notification: {
        icon: '/pwa-192x192.png',
        badge: '/logo.png',
        tag: 'lifeflow-reminder'
      }
    },
    token: fcmToken
  };

  try {
    await getMessaging().send(message);
    console.log(`[Scheduler] Push notification sent successfully to user ${user.username} (token prefix: ${fcmToken.substring(0, 8)}...)`);
  } catch (err) {
    console.error(`[Scheduler] Failed to send push notification to user ${user.username}:`, err.message);
    
    // Check if token is invalid or expired
    const isCleanupError = 
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/invalid-argument' ||
      err.message.includes('not-registered') ||
      err.message.includes('registration token') ||
      err.message.includes('Requested entity was not found');
      
    if (isCleanupError) {
      console.log(`[Scheduler] Cleaning up invalid FCM token for user ${user.username}`);
      user.fcmToken = '';
      await user.save();
    }
  }
}

// Run scheduler checks every minute
cron.schedule('* * * * *', async () => {
  console.log('[Scheduler] Running minute-based reminder checks...');
  const now = new Date();

  try {
    const users = await User.find({});
    for (const user of users) {
      if (!user.fcmToken) continue;

      const userTz = user.timezone || 'UTC';
      let localDate, localTime, dayOfWeek, dayOfMonth;

      try {
        const dateParts = new Intl.DateTimeFormat('en-US', { 
          timeZone: userTz, 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23'
        }).formatToParts(now);

        const year = dateParts.find(p => p.type === 'year').value;
        const month = dateParts.find(p => p.type === 'month').value;
        const day = dateParts.find(p => p.type === 'day').value;
        const hour = dateParts.find(p => p.type === 'hour').value;
        const minute = dateParts.find(p => p.type === 'minute').value;

        localDate = `${year}-${month}-${day}`; // YYYY-MM-DD
        localTime = `${hour}:${minute}`; // HH:MM

        // Calculate local day of week & day of month for recurring event checks
        const options = { timeZone: userTz, year: 'numeric', month: 'numeric', day: 'numeric' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const localYear = parseInt(parts.find(p => p.type === 'year').value);
        const localMonth = parseInt(parts.find(p => p.type === 'month').value) - 1; // 0-indexed
        const localDay = parseInt(parts.find(p => p.type === 'day').value);

        const localDateObj = new Date(localYear, localMonth, localDay);
        dayOfWeek = localDateObj.getDay(); // 0 = Sunday, etc.
        dayOfMonth = localDateObj.getDate(); // 1-31
      } catch (err) {
        console.error(`[Scheduler] Failed to calculate localized time for user ${user._id} (Tz: ${userTz}):`, err.message);
        continue;
      }

      // --- 1. Daily Planner Tasks Reminders ---
      try {
        const tasks = await Task.find({ 
          userId: user._id, 
          isCompleted: false, 
          reminderSent: false 
        });

        for (const task of tasks) {
          if (task.dueDate === localDate && task.reminderTime && task.reminderTime <= localTime) {
            let formattedDue = task.dueDate;
            try {
              const dObj = new Date(task.dueDate);
              if (!isNaN(dObj.getTime())) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                formattedDue = `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;
              }
            } catch (e) {}

            let formattedTime = '';
            if (task.reminderTime) {
              try {
                const [hStr, mStr] = task.reminderTime.split(':');
                const h = parseInt(hStr);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const dispH = h % 12 === 0 ? 12 : h % 12;
                formattedTime = `, ${dispH}:${mStr} ${ampm}`;
              } catch (e) {}
            }

            const title = '🔔 LifeFlow';
            const body = `${task.title}\nDue: ${formattedDue}${formattedTime}\nTap to open.`;
            const clickAction = '/?page=planner';

            await sendPushNotification(user, title, body, clickAction);
            task.reminderSent = true;
            await task.save();
          }
        }
      } catch (err) {
        console.error(`[Scheduler] Error checking tasks for user ${user._id}:`, err.message);
      }

      // --- 2. Goals & Milestones Reminders ---
      try {
        const goals = await Goal.find({ userId: user._id });
        for (const goal of goals) {
          if (goal.status === 'completed' || !goal.targetDate) continue;

          // Target Finished Date notification
          if (goal.targetDate === localDate && !goal.targetReminderSent) {
            let formattedTarget = goal.targetDate;
            try {
              const dObj = new Date(goal.targetDate);
              if (!isNaN(dObj.getTime())) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                formattedTarget = `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;
              }
            } catch (e) {}

            const title = '🔔 LifeFlow';
            const body = `${goal.title}\nTarget Finish Date:\n${formattedTarget}\nTap to open.`;
            const clickAction = '/?page=goals';

            await sendPushNotification(user, title, body, clickAction);
            goal.targetReminderSent = true;
            await goal.save();
          }
          // Configuration reminder before target finish date
          else if (!goal.preReminderSent && goal.reminderDaysBefore > 0) {
            try {
              const targetDateParts = goal.targetDate.split('-');
              const y = parseInt(targetDateParts[0]);
              const m = parseInt(targetDateParts[1]) - 1;
              const d = parseInt(targetDateParts[2]);

              const targetDateObj = new Date(y, m, d);
              const preDateObj = new Date(targetDateObj.getTime() - goal.reminderDaysBefore * 24 * 60 * 60 * 1000);

              const preYear = preDateObj.getFullYear();
              const preMonth = String(preDateObj.getMonth() + 1).padStart(2, '0');
              const preDay = String(preDateObj.getDate()).padStart(2, '0');
              const preDateStr = `${preYear}-${preMonth}-${preDay}`;

              if (preDateStr === localDate) {
                let formattedTarget = goal.targetDate;
                try {
                  const dObj = new Date(goal.targetDate);
                  if (!isNaN(dObj.getTime())) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    formattedTarget = `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;
                  }
                } catch (e) {}

                const title = '🔔 LifeFlow';
                const body = `${goal.title}\nTarget Finish Date:\n${formattedTarget}\nTap to open.`;
                const clickAction = '/?page=goals';

                await sendPushNotification(user, title, body, clickAction);
                goal.preReminderSent = true;
                await goal.save();
              }
            } catch (e) {
              console.error(`[Scheduler] Error calculating goal pre-reminder for goal ${goal._id}:`, e.message);
            }
          }
        }
      } catch (err) {
        console.error(`[Scheduler] Error checking goals for user ${user._id}:`, err.message);
      }

      // --- 3. Calendar Events Reminders ---
      try {
        const events = await Event.find({ userId: user._id, reminder: true });
        for (const event of events) {
          if (!event.date || !event.time) continue;

          let isDueToday = false;
          if (event.isRecurring === 'none') {
            isDueToday = (event.date === localDate);
          } else if (event.isRecurring === 'daily') {
            isDueToday = true;
          } else if (event.isRecurring === 'weekly') {
            try {
              const eventDateParts = event.date.split('-');
              const evDateObj = new Date(parseInt(eventDateParts[0]), parseInt(eventDateParts[1]) - 1, parseInt(eventDateParts[2]));
              isDueToday = (evDateObj.getDay() === dayOfWeek);
            } catch (e) {}
          } else if (event.isRecurring === 'monthly') {
            try {
              const eventDateParts = event.date.split('-');
              isDueToday = (parseInt(eventDateParts[2]) === dayOfMonth);
            } catch (e) {}
          }

          if (isDueToday && event.time && event.time <= localTime && event.lastReminderSentAt !== localDate) {
            let formattedTime = event.time;
            try {
              const [hStr, mStr] = event.time.split(':');
              const h = parseInt(hStr);
              const ampm = h >= 12 ? 'PM' : 'AM';
              const dispH = h % 12 === 0 ? 12 : h % 12;
              formattedTime = `${dispH}:${mStr} ${ampm}`;
            } catch (e) {}

            const title = '🔔 LifeFlow';
            const body = `${event.title}\nToday at ${formattedTime}\nTap to open.`;
            const clickAction = '/?page=calendar';

            await sendPushNotification(user, title, body, clickAction);
            event.lastReminderSentAt = localDate;
            await event.save();
          }
        }
      } catch (err) {
        console.error(`[Scheduler] Error checking events for user ${user._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error reading users database:', err.message);
  }
});
