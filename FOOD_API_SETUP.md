# Хоолны шим тэжээлийн мэдээлэл API тохируулга

Энэ аппликейшн нь Spoonacular API ашиглан хоолны шим тэжээлийн мэдээллийг (калори, уураг, нүүрс ус, тос) олж авдаг.

## API тохируулга

### Spoonacular API

Spoonacular API нь хоолны шим тэжээлийн мэдээлэл өгдөг найдвартай үйлчилгээ.

**Үнэгүй API Key авах:**
1. [Spoonacular.com](https://spoonacular.com/food-api) руу очно
2. Бүртгүүлэх эсвэл нэвтрэх
3. Dashboard руу очно
4. API Key-ээ хуулж авна

### Environment Variables тохируулах

`.env.local` файлд дараах мэдээллийг нэмнэ:

```env
SPOONACULAR_API_KEY=your_api_key_here
```

### Vercel дээр тохируулах

Vercel dashboard дээр:
1. Project Settings → Environment Variables руу очно
2. `SPOONACULAR_API_KEY` хувьсагчийг нэмнэ
3. Redeploy хийх

## Хэрэглээ

**Хоолны нэр оруулах**: 
- Хоолны нэрийг оруулбал Spoonacular API шим тэжээлийн мэдээллийг буцаана
- Калори, уураг, нүүрс ус, тос гэх мэт

## API хязгаарлалт

- **Spoonacular Free Tier**: Өдөрт 150 requests (энэ нь ихэнх хэрэглээнд хангалттай)

## Тэмдэглэл

- Spoonacular API key шаардлагатай (үнэгүй бүртгэлдээс авах боломжтой)
- Хоолны нэрийг англи хэлээр оруулах нь илүү сайн үр дүн өгнө
