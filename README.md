# Dik dur ve su iç

Seperra’nın duruş + su hatırlatma uygulaması. MVP yalnız iOS ve Android.

## Ne yapar

- Kullanıcının seçtiği aralıkla bildirim gönderir.
- Yalnız **11:00–21:00** arasında çalışır.
- Bildirim onaylanmadan yenisi gelmez; bildirim tepside kalır.
- 3 saat tıklanmazsa tek bir nazik tekrar gider: *“Sağlıklı olman için uğraşıyorum, şu suyu içer misin?”*
- Saatlerde kısa başlık + **İçtim** / **Dik durdum** aksiyonları.

Sunucu yok. Bildirimler cihazda yerel planlanır.

## Çalıştır

```bash
npm install
npx expo start
```

Fiziksel cihaz veya simülatör gerekir. Expo Go’da yerel bildirimler çalışır; mağaza sürümü için development build / EAS gerekir.

## Expo

SDK 57. Doküman: https://docs.expo.dev/versions/v57.0.0/
