/* ------------------------------------------------------------------ */
/*  Seed script: varsayılan hesapları Supabase'e yazar                */
/*  Kullanım: SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL   */
/*  ortam değişkenleri tanımlıyken: npm run seed                       */
/* ------------------------------------------------------------------ */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  process.exit(1);
}

const admin = createClient(url, key);

const accounts = [
  { id: "demo-admin-001", username: "Sucuk9977", role: "admin", password: "SigmaAkif2013" },
  { id: "demo-user-001", username: "Pirensine", role: "user", password: "2.0.2.7.F.Z.3102" },
];

async function main() {
  for (const acc of accounts) {
    const { data, error } = await admin
      .from("profiles")
      .upsert({ id: acc.id, username: acc.username, role: acc.role }, { onConflict: "username" })
      .select();
    if (error) {
      console.error(`${acc.username}: hata -`, error.message);
    } else {
      console.log(`${acc.username} (${acc.role}) profili hazır.`);
    }
  }
  console.log("Seed tamamlandı.");
  console.log("Giriş bilgileri:");
  console.log("  Yönetici: Sucuk9977 / SigmaAkif2013");
  console.log("  Kullanıcı: Pirensine / 2.0.2.7.F.Z.3102");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
