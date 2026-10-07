package com.rawai.islamia;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import java.util.Calendar;

public final class NotificationScheduler {
    private static final String PREFS = "rawai_settings";
    private static final String KEY_ENABLED = "notifications_enabled";
    private static final String KEY_TIMES = "notification_times";
    private static final long INTERVAL = 3L * 60L * 60L * 1000L;

    private NotificationScheduler() {}

    public static boolean isEnabled(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getBoolean(KEY_ENABLED, true);
    }

    public static String getTimes(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TIMES, "");
    }

    public static void setEnabled(Context context, boolean enabled) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_ENABLED, enabled).apply();
        if (enabled) schedule(context); else cancel(context);
    }

    public static void setTimes(Context context, String csv) {
        String safe = csv == null ? "" : csv.trim();
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_TIMES, safe).apply();
        if (isEnabled(context)) schedule(context);
    }

    public static void schedule(Context context) {
        if (!isEnabled(context)) return;
        cancel(context);
        String csv = getTimes(context);
        if (csv != null && !csv.trim().isEmpty()) {
            String[] parts = csv.split(",");
            for (int i = 0; i < parts.length && i < 5; i++) {
                String[] hm = parts[i].trim().split(":");
                if (hm.length != 2) continue;
                try {
                    int hour = Integer.parseInt(hm[0]);
                    int minute = Integer.parseInt(hm[1]);
                    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
                    Calendar now = Calendar.getInstance();
                    Calendar next = Calendar.getInstance();
                    next.set(Calendar.HOUR_OF_DAY, hour);
                    next.set(Calendar.MINUTE, minute);
                    next.set(Calendar.SECOND, 0);
                    next.set(Calendar.MILLISECOND, 0);
                    if (!next.after(now)) next.add(Calendar.DAY_OF_YEAR, 1);
                    scheduleAt(context, 4000 + i, next.getTimeInMillis());
                } catch (Exception ignored) {}
            }
            return;
        }
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, 3003, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long first = SystemClock.elapsedRealtime() + INTERVAL;
        alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, first, INTERVAL, pi);
    }

    private static void scheduleAt(Context context, int requestCode, long when) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarmManager.setInexactRepeating(AlarmManager.RTC_WAKEUP, when, 24L * 60L * 60L * 1000L, pi);
    }

    public static void cancel(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        for (int code = 3003; code <= 4004; code++) {
            Intent intent = new Intent(context, NotificationReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(context, code, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            alarmManager.cancel(pi);
            pi.cancel();
        }
    }
}