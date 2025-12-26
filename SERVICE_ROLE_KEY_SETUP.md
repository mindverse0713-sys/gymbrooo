# Service Role Key Setup

## ✅ .env.local дээр нэмэгдлээ

Service Role Key нь `.env.local` файлд нэмэгдсэн. Энэ нь **server-side код** дээр ашиглагдана (API routes).

## ⚠️ АНХААР: Service Role Key нь маш хүчтэй!

- ✅ Server-side код дээр ашиглах боломжтой (API routes)
- ❌ Client-side код дээр хэзээ ч ашиглахгүй
- ❌ `NEXT_PUBLIC_` prefix ашиглахгүй (энэ нь client-side-д илэрнэ)
- ✅ RLS-ийг bypass хийдэг, бүх operation зөвшөөрнө

## Vercel дээр нэмэх

1. Vercel Dashboard → Settings → Environment Variables
2. Дараах хувьсагчийг нэмнэ:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnd0bGt3YmR1dm93bnpmZ3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5NDU3NSwiZXhwIjoyMDgyMDcwNTc1fQ.bZtJbzii_rqHEpWVXiZWd7mE7hiGDfLfl8f8VMuumpI
   ```
3. **Production, Preview, Development** бүгд дээр нэмнэ
4. **ВАЖНО:** `NEXT_PUBLIC_` prefix ашиглахгүй!

## Ашиглах

Service Role Key-ийг ашигласнаар:
- ✅ RLS policy-г disable хийх шаардлагагүй
- ✅ API routes-д ашиглах боломжтой
- ✅ Бүх database operation зөвшөөрнө

## Безопасность

- Service Role Key-ийг хэзээ ч GitHub-д push хийхгүй (аль хэдийн .gitignore дотор)
- Client-side код руу хэзээ ч илгээхгүй
- Зөвхөн server-side (API routes) дээр ашиглана


