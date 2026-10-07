روائع إسلامية — مشروع Android

هذا المشروع يحوّل نسخة الموقع الحالية إلى تطبيق Android باستخدام WebViewAssetLoader.
المحتوى الحالي للموقع موجود داخل app/src/main/assets.
زر تنزيل الصوت داخل صفحة قصص الأطفال يتم اعتراضه من التطبيق وتنزيل الملف عبر DownloadManager.

للبناء:
1) افتح المجلد في Android Studio حديث.
2) انتظر مزامنة Gradle.
3) Build > Build APK(s).
4) ملف APK سيظهر داخل app/build/outputs/apk/.

ملاحظة: هذه الحزمة مشروع بناء وليست APK جاهزًا؛ بيئة التنفيذ الحالية لا تحتوي على Android SDK/Gradle لإخراج APK موثوق.
