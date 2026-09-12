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

## Mağaza

```bash
npx eas-cli build --platform ios --profile production --non-interactive
npx eas-cli build --platform android --profile production --non-interactive
npx eas-cli submit --platform ios --profile production --latest --non-interactive
```

Gizlilik: https://erenuysal.github.io/dik-dur-ve-su-ic/gizlilik.html
Repo: https://github.com/erenuysal/dik-dur-ve-su-ic
