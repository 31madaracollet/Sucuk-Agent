# Claude Arayüzü — Araştırmacı Notları
*Tarih: 2026-10-24 | Araştırmacı: Sucuk-Agent Dev+Sanatçı Modu*

## 1. Kaynak Taraması (15+ makale)
- Claude.com pazarlama yüzeyi vs. claude.ai ürün yüzeyi farklı: pazarlama = editorial cream, ürün = minimal sohbet.
- Ana referanslar: support.claude.com, open-design.ai, designmd.co/claude, shadcn.io/design/anthropic, awesome-design-md

## 2. Temel İlke: “Warm Editorial, Not Tech”
> Anthropic’in bilinçli kararı: cool blue/slate kullanan OpenAI/Google/Microsoft’a karşı **ılık** duruş.

- **Canvas:** #faf9f5 (cream, parchment), #f5f4ed (ikinci cream), asla saf beyaz #fff değil
- **Ink:** #141413 (near-black), #3d3d3a (body), #6c6a64 (muted)
- **Accent:** #cc785c (coral/terracotta), active #a9583e, disabled #e6dfd8 — sadece CTA’da, her yerde değil
- **Hairline:** #e6dfd8 / #f0eee6 — 1px border ile derinlik, gölge yok
- **Dark surface:** #141413 — code editor, model kartları, footer (cream ↔ dark ritmi)

Çıkarım: Sucuk-Agent’ın siyah/beyaz “cihaz” dili korunacak ama **Claude sıcaklığı** eklenecek: gündüz cream, gece ink.

## 3. Tipografi — İki Aile, Keskin Rol Ayrımı
- **Display / Headline:** Copernicus / Tiempos Headline (serif), weight 400, letter-spacing -1.5px → -0.3px, line-height 1.05-1.15. Open-source yedek: Cormorant Garamond 500.
- **UI / Body:** StyreneB / Anthropic Sans, fallback Inter, weight 400-500, 12-20px arası. Claude’da Sans 1,493 kullanım, Serif 65 kullanım — Sans işçi, Serif star.
- **Code:** JetBrains Mono / Anthropic Mono 15px, -0.32px tracking.

Kural: Başlıklar serif, tüm UI sans. Asla tek fontla her şeyi yapma (AI slop’un #1 hatası).

## 4. Boşluk & Radius — Disiplin
- Base unit: 8px
- Spacing: 8, 12, 16, 24, 32, 48
- Radius: 8px (button), 12px (card), 16px (large card), 32px (marketing card) — Sucuk için 12/16 ideal
- Padding: button 12×20, card 24-48, input 12×16

## 5. Bileşen İmzaları
- **Top Nav:** 64px, cream bg, sol spike+wordmark, orta menu text-only 14px/500, sağ coral CTA. No icons in nav (text-only).
- **Button Primary:** bg #cc785c, text white, 40px height, 8px radius, 12×20 padding. Hover → #a9583e.
- **Button Secondary (white):** bg white, text #141413, hairline border, 12px radius
- **Button Dark:** bg #141413, text #faf9f5
- **Card:** bg white, border 1px #f0eee6, radius 12-16, padding 24. Dark variant: bg #141413, text #faf9f5
- **Input:** bg white, 1px #e6dfd8, focus ring coral, 8px radius, 14px sans
- **Sidebar:** sola yaslı (NNGroup: kullanıcı %69 daha fazla sola bakar), 280-300px, cream, hairline sağ border, history + new chat üstte

## 6. En Ayırt Edici Özellik: Artifacts Split
- **Sohbet sol, artifact sağ.** Haziran 2024’te Claude’un en büyük UI değişimi. Artık herkes taklit ediyor.
- Artifact = canvas’ta yaşayan React/HTML/Tailwind, tek dosya, interaktif, storage API’li.
- Tasarım sistemi → canvas’lar: önce token’lar, sonra ekranlar. Sistem kaynak gerçek.

Sucuk için çeviri: Mesajda kod/görsel varsa sağ panelde canlı preview (CodeBlock zaten var, Artifact’e evrilmeli).

## 7. AI Slop’u Önleme (Anthropic frontend-design skill)
- Inter/Roboto/Arial/Space Grotesk yasak — fazla kullanıldı
- Purple gradient beyaz zemin yasak — Claude’da yok
- Centered hero + 3 kart + footer iskeleti yasak — asimetri, grid kırma teşvik
- Her AI üretimi “iyi yeterli”dir: loading state yok, klavye yok, color-only status, rastgele spacing. Bunları bilerek ekle.

## 8. Do/Don’t (Claude ekibinden)
- DO: Parchment #f5f4ed’i ana bg yap, terracotta’yı sadece primary CTA’da kullan, tüm gri’leri sıcak tut
- DON’T: Saf beyaz bg, generic Inter, animated green dot (canlı sinyali), container soup (card içinde card içinde card)

## 9. Uygulama Planı — Sucuk-Agent × Claude
- **Tema:** cream (light) / ink (dark) toggle, varsayılan system. Eski siyah/beyaz “cihaz” dark modda korunacak.
- **Font:** Cormorant Garamond (serif display) + Inter (sans UI) + JetBrains Mono (code) — Google Fonts, lisans özgür.
- **Renk token’ları:** CSS var’lar ile --canvas, --surface, --ink, --coral, --hairline, --success
- **Layout:** 280px sol Sidebar (history + new chat), ortada sohbet (max-w-3xl editorial), sağda Artifact drawer (kod/görsel varsa)
- **Mesaj:** user = white bubble sağ, assistant = paper card sol + avatar spike, typing = daktilo değil, fade-in
- **Boşluk:** 8px ızgara, hairline border, gölge yok, sadece ring/whisper seviye

## 10. Sanatçı Notu
Claude “düşünen partner” — sıcak kağıt, serif başlık, sessiz. Sucuk-Agent “siyah beyaz cihaz” — OLED, keskin. İkisini birleştirince: **gece cihaz, gündüz kağıt**. Aynı token seti iki modda farklı hikaye anlatıyor. İşte kalite.

---
*Sonraki adım: DESIGN_TOKENS + yeni globals.css + layout.tsx + Sidebar/Navbar’ı bu sisteme göre sıfırdan yaz.*
