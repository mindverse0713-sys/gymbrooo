# Vercel Environment Variables - Зөв тохиргоо

## ❌ Одоогийн (буруу) нэрс:
- `SUPABASE_URL` 
- `SUPABASE_ANON_KEY`
- `SERVICE_ROLE_KEY`

## ✅ Зөв нэрс (энэ зүйлсийг ашиглах):

### 1. `NEXT_PUBLIC_SUPABASE_URL`
```
https://mxnwtlkwbduvownzfgrb.supabase.co
```

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnd0bGt3YmR1dm93bnpmZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1NzUsImV4cCI6MjA4MjA3MDU3NX0.VcZElAgo0TPDWmmpkxtq08Dw5opDZySJI90wZsVg_1g
```

### 3. `SUPABASE_SERVICE_ROLE_KEY` (важливо: `NEXT_PUBLIC_` prefix байхгүй!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnd0bGt3YmR1dm93bnpmZ3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5NDU3NSwiZXhwIjoyMDgyMDcwNTc1fQ.bZtJbzii_rqHEpWVXiZWd7mE7hiGDfLfl8f8VMuumpI
```

## 🔧 Хэрхэн засах:

1. Vercel Dashboard → Settings → Environment Variables руу орно уу
2. **Хуучин** variable-уудыг устгана уу:
   - `SUPABASE_URL` (устгах)
   - `SUPABASE_ANON_KEY` (устгах)
   - `SERVICE_ROLE_KEY` (устгах)
3. **Шинэ** variable-уудыг нэмнэ уу (дээрх зөв нэрсээр)
4. **Production, Preview, Development** бүгд дээр нэмнэ
5. **Redeploy** хийж байна

## ⚠️ Яагаад энэ нэрс вэ?

- `NEXT_PUBLIC_` prefix-тэй variable-ууд нь **client-side** код дээр харагдана
- `NEXT_PUBLIC_` prefix-гүй variable-ууд нь зөвхөн **server-side** код дээр харагдана (илүү аюулгүй)
- `SUPABASE_SERVICE_ROLE_KEY` нь маш хүчтэй key тул зөвхөн server-side дээр ашиглах ёстой

