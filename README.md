# Sucuk-Agent

Uçtan uca çalışan, çoklu API sağlayıcılı yapay zekâ agent platformu.  
Mimari gereksinimlerine uygun olarak orchestrator yönlendirici, API anahtarı döndürme, düz sohbet modu, web arama/gezinme, görsel üretim, arkadaşlık ve mesajlaşma, yönetim paneli ile geliştirilmiştir.

## Mimari Özeti

| Bileşen | Seçim |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Veritabanı / Arka plan | Supabase (PostgreSQL) |
| Barındırma / Yayın | Vercel |
| Oturum | Çerez tabanlı demo oturumu (Supabase yoksa) / Supabase Auth hazırlığı |
| API sağlayıcıları | Google Gemini, OpenAI, Groq, Grok (xAI), OpenRouter, DeepSeek, KIMI, Nvidia, Hugging Face |

## Temel Özellikler

1. **API Sağlayıcı Yönetimi** — Her sağlayıcıdan 3'er API anahtarı (ortam değişkeni olarak). Kotasının dolduğu anahtar otomatik olarak atlanır ve sıradaki anahtarla denenir.
2. **Limit Uyarısı** — Bir sağlayıcının tüm anahtarları bittiğinde: *"Üzgünüm, limit doldu."*
3. **Düz Sohbet Modu** — Tüm anahtarlar tükendiğinde sistem diğer sağlayıcıları dener; hiçbiri çalışmıyorsa düz sohbet moduna geçer ve arayüzde aktif sağlayıcı/model belirtilir (örn. Grok çatısı altındaki bir model).
4. **Orkestratör Yönlendirici** — Gelen istek analiz edilir ve kod/görsel/arama/düşünme/metin görevinin türüne göre uygun sağlayıcıya model'e yönlendirilir.
5. **Web Arama & Gezinme** — Canlı web araması (DuckDuckGo, sunucu tarafı, anahtar gerektirmez) ve URL içeriği okuma.
6. **Görsel Üretimi** — Hugging Face (Stable Diffusion XL) üzerinden metinden görsel.
7. **Sohbet Sistemi** — Tüm sohbet geçmişi veritabanına kaydedilir; başlık, sağlayıcı ve model bilgisiyle birlikte saklanır.
8. **Arkadaşlık & Mesajlaşma** — Kullanıcılar arası arkadaş ekleme ve doğrudan mesajlaşma.
9. **Yönetim Paneli** — Sistem duyuruları yayımlama, dinamik araç ekleme/çıkarma (yalnızca `Sucuk9977` yönetici hesabı).
10. **Güvenlik** — Kayıt (Sign Up) paneli yok; sadece var olan hesaplarla giriş.

## Varsayılan Hesaplar

| Rol | Kullanıcı Adı | Şifre |
|---|---|---|
| Yönetici | `Sucuk9977` | `SigmaAkif2013` |
| Kullanıcı | `Pirensine` | `2.0.2.7.F.Z.3102` |

Kayıt panneauxu yoktur; sadece yukarıdaki hesaplarla giriş yapılabilir.

## API Anahtarları (Ortam Değişkenleri)

Gerçek API anahtarları repoya işlenmez. `Vercel > Project Settings > Environment Variables` ve `GitHub Secrets` alanlarına aşağıdaki değişkenleri ekleyin (her sağlayıcı için en fazla 3 anahtar):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google (Gemini) - 3 anahtar
GOOGLE_API_KEY_1=...
GOOGLE_API_KEY_2=...
GOOGLE_API_KEY_3=...

# OpenAI - 3 anahtar
OPENAI_API_KEY_1=...
OPENAI_API_KEY_2=...
OPENAI_API_KEY_3=...

# Groq - 3 anahtar
GROQ_API_KEY_1=...
GROQ_API_KEY_2=...
GROQ_API_KEY_3=...

# Grok (xAI) - 3 anahtar
GROK_API_KEY_1=...
GROK_API_KEY_2=...
GROK_API_KEY_3=...

# OpenRouter - 3 anahtar
OPENROUTER_API_KEY_1=...
OPENROUTER_API_KEY_2=...
OPENROUTER_API_KEY_3=...

# DeepSeek - 3 anahtar
DEEPSEEK_API_KEY_1=...
DEEPSEEK_API_KEY_2=...
DEEPSEEK_API_KEY_3=...

# KIMI (Moonshot) - 3 anahtar
KIMI_API_KEY_1=...
KIMI_API_KEY_2=...
KIMI_API_KEY_3=...

# Nvidia - 3 anahtar
NVIDIA_API_KEY_1=...
NVIDIA_API_KEY_2=...
NVIDIA_API_KEY_3=...

# Hugging Face (görsel üretim)
HUGGINGFACE_API_TOKEN=

# Oturum güvenliği
SESSION_SECRET=mutlaka-degistirin

# Varsayılan hesaplar (opsiyonel, üzerine yazmak için)
ADMIN_USERNAME=Sucuk9977
ADMIN_PASSWORD=SigmaAkif2013
USER_USERNAME=Pirensine
USER_PASSWORD=2.0.2.7.F.Z.3102

NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

`HUGGINGFACE_API_TOKEN` belirtilmezse görsel üretim devre dışı kalır; diğer sağlayıcılar eksikse o sağlayıcı atlanır (esnek yapılandırma).

## Veritabanı (Supabase)

`supabase/schema.sql` dosyasındaki komutları Supabase SQL Editor'da çalıştırın. Tablolar: `profiles`, `chats`, `messages`, `friendships`, `direct_messages`, `system_announcements`, `dynamic_tools`.

Varsayılan hesapları veritabanına eklemek için:

```bash
npm run seed
```

## Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini oluştur
cp .env.example .env.local
# .env.local dosyasını düzenleyerek Supabase ve API anahtarlarını girin

# Geliştirme sunucusu
npm run dev

# Üretim derlemesi
npm run build

# Üretim sunucusu (yerel test)
npm start
```

Uygulama `http://localhost:3000` üzerinden açılır. Giriş yapmadan sadece landingsayfası erişilebilir; sohbet, ayarlar, yönetim ve arkadaş sayfaları oturum gerektirir.

## Deployment (Vercel + Supabase)

1. Depoyu GitHub'a (private repo) pushlayın.
2. Supabase projesi oluşturun, `supabase/schema.sql` komutlarını çalıştırın.
3. Vercel'e bağlayın; proje ayarlarında Environment Variables olarak `.env.example` içindeki değişkenleri ekleyin.
4. `vercel.json` zaten repoda bulunmakta; Next.js framework algılanır ve otomatik dağıtılır.
5. GitHub repository secrets olarak da aynı API anahtarlarını ekleyebilirsiniz (CI/CD akışları için).

## API Rotaları

| Rota | Metod | Açıklama |
|---|---|---|
| `/api/auth/signin` | POST | Giriş (sadece tanımlı hesaplar) |
| `/api/auth/signout` | POST | Çıkış |
| `/api/auth/me` | GET | Oturum kontrolü |
| `/api/chat` | GET/POST | Sohbet listesi / yeni sohbet |
| `/api/chat/[chatId]` | GET/POST | Sohbet detayı / mesaj gönder |
| `/api/orchestrator` | POST | Görev yönlendirme kararı |
| `/api/search` | POST | Web araması |
| `/api/browse` | POST | URL içeriği okuma |
| `/api/image` | POST | Görsel üretimi (Hugging Face) |
| `/api/providers` | GET | Sağlayıcı/anahtar durumu |
| `/api/tools` | GET/POST/DELETE | Dinamik araçlar (yalnızca admin) |
| `/api/friends` | GET/POST/PATCH | Arkadaşlık işlemleri |
| `/api/messages` | GET/POST | Doğrudan mesajlar |
| `/api/announcements` | GET/POST | Sistem duyuruları (yalnızca admin) |

## Klasör Yapısı

```
src/
  app/               Next.js sayfaları ve API rotaları
  components/ui      Temel bileşenler (button, input, card, badge...)
  components/layout  Navbar
  lib/               supabase, storage, providers, auth, orchestrator, search, image
  types/             TypeScript tipleri
supabase/schema.sql  Veritabanı şeması
scripts/seed.mjs     Varsayılan hesap seed scripti
```

## Notlar

- Bu depodaki kodda **gerçek API anahtarları yer almıyor**; anahtarlar sadece ortam değişkeni / GitHub Secrets / Vercel Environment Variables üzerinden okunur.
- Supabase yapılandırılmamışsa sistem demo (bellek içi) modunda çalışır ve iki varsayılan hesabı otomatik olarak oluşturur — bu da geliştirme ve önizleme için yeterlidir.
- Gerçek dağıtımda Supabase veritabanı ve Vercel ortam değişkenleri zorunludur.

<!-- deploy trigger 2026-10-22T17:32:31Z -->
