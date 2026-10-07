package com.rawai.islamia;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class NotificationReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "rawai_religious_reminders";
    private static final String PREFS = "rawai_settings";
    private static final String INDEX = "notification_index";

    private static final String[] REMINDERS = {
        "سبحان الله وبحمده، سبحان الله العظيم.",
        "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
        "أستغفر الله وأتوب إليه.",
        "اللهم صل وسلم وبارك على نبينا محمد ﷺ.",
        "سبحان الله، والحمد لله، والله أكبر.",
        "اذكر الله في كل وقت، واجعل لسانك عامرًا بذكره."
    };

    @Override public void onReceive(Context context, Intent intent) {
        if (!NotificationScheduler.isEnabled(context)) return;
        createChannel(context);

        int index = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getInt(INDEX, 0);
        String message = REMINDERS[index % REMINDERS.length];
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putInt(INDEX, (index + 1) % REMINDERS.length).apply();

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context, 4004, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_rawai_islamia)
                .setContentTitle("تذكير من روائع إسلامية")
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        if (Build.VERSION.SDK_INT < 33 ||
                NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            NotificationManagerCompat.from(context)
                    .notify(5000 + index, builder.build());
        }
    }

    private void createChannel(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "التذكيرات الدينية",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("تذكيرات دينية كل ثلاث ساعات");
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
}
