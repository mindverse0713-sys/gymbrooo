# Дасгалуудыг Database-д оруулах

## Supabase дээр дасгалуудыг оруулах

Supabase database дээр default дасгалууд байхгүй бол, тэдгээрийг оруулах хэрэгтэй.

### Арга 1: Script ашиглах (Амар)

```bash
npm run db:seed-exercises
```

Энэ нь Supabase дээрх `.env.local` файлаас environment variables-ийг уншина.

### Арга 2: Supabase SQL Editor ашиглах

1. Supabase Dashboard → SQL Editor руу орно уу
2. Дараах SQL-ийг ажиллуулна уу (энэ нь цөөн дасгал оруулна):

```sql
-- Example: цөөн дасгал оруулах
INSERT INTO "Exercise" (id, name, "mnName", "muscleGroup", equipment, type, "isDefault", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'Bench Press', 'Бэнч пресс', 'Chest', 'Barbell', 'strength', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Squat', 'Скват', 'Legs', 'Barbell', 'strength', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Deadlift', 'Дэдлифт', 'Back', 'Barbell', 'strength', true, NOW(), NOW());
```

### Арга 3: API ашиглах

Postman эсвэл curl ашиглан дасгал нэмэх:

```bash
curl -X POST https://your-app.vercel.app/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bench Press",
    "mnName": "Бэнч пресс",
    "muscleGroup": "Chest",
    "equipment": "Barbell",
    "type": "strength"
  }'
```

## Шалгах

Dасгалууд оруулсны дараа:

1. Browser дээр `/api/exercises` endpoint-ийг шалгана уу
2. Эсвэл Supabase Dashboard → Table Editor → Exercise table руу орж шалгана уу

## Анхаарах

- Хэрэв дасгалууд аль хэдийн байгаа бол script давтагдахгүй
- Хэрэв алдаа гарвал console дээрх error-ийг шалгана уу


