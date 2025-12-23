# Environment Variables Setup

## .env.local файлд нэмэх

`.env.local` файл үүсгээд (эсвэл байгаа файлд) доорх мэдээлэл оруулна уу:

```env
# Supabase Configuration
# Эдгээр утгуудыг Supabase dashboard-аас авна: Settings > API

# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon/Public Key (client-side дээр ашиглах боломжтой)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Supabase credentials хэрхэн олох:

1. https://supabase.com дээр нэвтрэх
2. Project-оо сонгох (эсвэл шинэ project үүсгэх)
3. **Settings** (тохиргоо) → **API** сонгох
4. Дараах утгуудыг хуулна:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` гэж нэмнэ
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` гэж нэмнэ

## Жишээ:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example-key-here
```

## Анхаарах зүйлс:

- `.env.local` файл нь `.gitignore` дотор байдаг тул git-д commit хийгдэхгүй
- `NEXT_PUBLIC_` prefix-тэй хувьсагчийг client-side код ашиглах боломжтой
- Development болон production дээр ижил форматтай байна

## Vercel дээр нэмэх:

1. Vercel dashboard → Project → Settings → Environment Variables
2. Дээрх 2 хувьсагчийг нэмнэ
3. Production, Preview, Development бүх environment дээр нэмнэ

