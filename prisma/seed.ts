import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultExercises = [
  { name: 'Bench Press', mnName: 'Бэнч пресс', muscleGroup: 'Chest', equipment: 'Barbell', type: 'strength' },
  { name: 'Squat', mnName: 'Скват', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' },
  { name: 'Deadlift', mnName: 'Дэдлифт', muscleGroup: 'Back', equipment: 'Barbell', type: 'strength' },
  { name: 'Overhead Press', mnName: 'Оверхед пресс', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'strength' },
  { name: 'Bent Over Row', mnName: 'Роу', muscleGroup: 'Back', equipment: 'Barbell', type: 'strength' },
  { name: 'Pull-ups', mnName: 'Пуллап', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Dips', mnName: 'Дип', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Bicep Curls', mnName: 'Байцепс curl', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Tricep Extensions', mnName: 'Трайцепс extension', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Leg Press', mnName: 'Лег пресс', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Lateral Raises', mnName: 'Латерал raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Front Squat', mnName: 'Фронт скват', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' },
  { name: 'Romanian Deadlift', mnName: 'Румын дэдлифт', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' },
  { name: 'Incline Bench Press', mnName: 'Инклайн бэнч пресс', muscleGroup: 'Chest', equipment: 'Barbell', type: 'strength' },
  { name: 'Dumbbell Flyes', mnName: 'Дамббел flyes', muscleGroup: 'Chest', equipment: 'Dumbbell', type: 'strength' },
  { name: 'T-Bar Row', mnName: 'T-бар роу', muscleGroup: 'Back', equipment: 'Barbell', type: 'strength' },
  { name: 'Face Pulls', mnName: 'Фейс пулл', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'strength' },
  { name: 'Hammer Curls', mnName: 'Хаммер curl', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Skull Crushers', mnName: 'Скул crushers', muscleGroup: 'Arms', equipment: 'Barbell', type: 'strength' },
  { name: 'Calf Raises', mnName: 'Калф raises', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Plank', mnName: 'Планк', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Crunches', mnName: 'Кранчес', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Leg Raises', mnName: 'Лег raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Russian Twists', mnName: 'Рашаан twists', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Running', mnName: 'Гүйлт', muscleGroup: 'Cardio', equipment: 'Treadmill', type: 'cardio' },
  { name: 'Cycling', mnName: 'Дугуй', muscleGroup: 'Cardio', equipment: 'Bike', type: 'cardio' },
  { name: 'Rowing', mnName: 'Ровинг', muscleGroup: 'Cardio', equipment: 'Rower', type: 'cardio' },
  { name: 'Jump Rope', mnName: 'Jump rope', muscleGroup: 'Cardio', equipment: 'Jump Rope', type: 'cardio' },
  { name: 'Burpees', mnName: 'Берпи', muscleGroup: 'Full Body', equipment: 'Bodyweight', type: 'cardio' },
  { name: 'Kettlebell Swings', mnName: 'Кеттбелл swings', muscleGroup: 'Full Body', equipment: 'Kettlebell', type: 'strength' },
  { name: 'Push-ups', mnName: 'Пушап', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Lunges', mnName: 'Ланжес', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Shoulder Press', mnName: 'Шолдер пресс', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Chin-ups', mnName: 'Чинап', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Tricep Pushdowns', mnName: 'Трайцепс пушдаун', muscleGroup: 'Arms', equipment: 'Cable', type: 'strength' },
  { name: 'Leg Curls', mnName: 'Лег curl', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Leg Extensions', mnName: 'Лег extension', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Cable Flyes', mnName: 'Кабел flyes', muscleGroup: 'Chest', equipment: 'Cable', type: 'strength' },
  { name: 'Upright Row', mnName: 'Апрайт роу', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'strength' },
  { name: 'Preacher Curls', mnName: 'Причер curl', muscleGroup: 'Arms', equipment: 'Barbell', type: 'strength' },
  { name: 'Concentration Curls', mnName: 'Концентраци curl', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Hip Thrusts', mnName: 'Хип trusts', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' },
  { name: 'Good Mornings', mnName: 'Гүүл морнингс', muscleGroup: 'Back', equipment: 'Barbell', type: 'strength' },
  { name: 'Farmers Walk', mnName: 'Фармерс валк', muscleGroup: 'Full Body', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Battle Ropes', mnName: 'Баттл rope', muscleGroup: 'Full Body', equipment: 'Battle Rope', type: 'cardio' },
  { name: 'Box Jumps', mnName: 'Бокс жампс', muscleGroup: 'Legs', equipment: 'Box', type: 'cardio' },
  { name: 'Medicine Ball Slams', mnName: 'Медицин бол slam', muscleGroup: 'Full Body', equipment: 'Medicine Ball', type: 'cardio' },
  { name: 'Mountain Climbers', mnName: 'Маунтин климберс', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'cardio' },
  { name: 'Bicycle Crunches', mnName: 'Байцикл кранчес', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Hanging Leg Raises', mnName: 'Ханнинг лег raises', muscleGroup: 'Core', equipment: 'Pull-up Bar', type: 'strength' },
  { name: 'Back Extensions', mnName: 'Бэк extension', muscleGroup: 'Back', equipment: 'Machine', type: 'strength' },
  { name: 'Shrugs', mnName: 'Шрагс', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Wrist Curls', mnName: 'Рист curl', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Reverse Flyes', mnName: 'Риверс flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Step-ups', mnName: 'Степ ап', muscleGroup: 'Legs', equipment: 'Box', type: 'strength' },
  { name: 'Bulgarian Split Squats', mnName: 'Болгариан сплит скват', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Glute Bridges', mnName: 'Глют брижес', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Side Lunges', mnName: 'Сайд ланжес', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Wood Chops', mnName: 'Вүүд чопс', muscleGroup: 'Core', equipment: 'Cable', type: 'strength' },
  { name: 'Pallof Press', mnName: 'Паллоф пресс', muscleGroup: 'Core', equipment: 'Cable', type: 'strength' },
  { name: 'Dead Bugs', mnName: 'Дэд багс', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Bird Dogs', mnName: 'Бирд догс', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Fire Hydrants', mnName: 'Файер хидрантс', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Clamshells', mnName: 'Кламшеллс', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Donkey Kicks', mnName: 'Донки кикс', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Wall Sits', mnName: 'Валл sits', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Superman', mnName: 'Супермэн', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'strength' },
  { name: 'Scapular Pull-ups', mnName: 'Скапюла пуллап', muscleGroup: 'Back', equipment: 'Pull-up Bar', type: 'strength' },
  { name: 'EZ Bar Curls', mnName: 'EZ бар curl', muscleGroup: 'Arms', equipment: 'EZ Bar', type: 'strength' },
  { name: 'Close Grip Bench Press', mnName: 'Клоуз грип бэнч пресс', muscleGroup: 'Arms', equipment: 'Barbell', type: 'strength' },
  { name: 'Skull Crushers', mnName: 'Скул crushers', muscleGroup: 'Arms', equipment: 'EZ Bar', type: 'strength' },
  { name: 'Face Pulls', mnName: 'Фейс пулл', muscleGroup: 'Shoulders', equipment: 'Rope', type: 'strength' },
  { name: 'Reverse Pec Deck', mnName: 'Риверс пек дек', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'strength' },
  { name: 'Pec Deck Machine', mnName: 'Пек дек машин', muscleGroup: 'Chest', equipment: 'Machine', type: 'strength' },
  { name: 'Seated Cable Rows', mnName: 'Ситед кабел роу', muscleGroup: 'Back', equipment: 'Cable', type: 'strength' },
  { name: 'Lat Pulldowns', mnName: 'Лат пулдаун', muscleGroup: 'Back', equipment: 'Cable', type: 'strength' },
  { name: 'Straight Arm Pulldowns', mnName: 'Страйт арм пулдаун', muscleGroup: 'Back', equipment: 'Cable', type: 'strength' },
  { name: 'Ab Rollouts', mnName: 'Аб роллаутс', muscleGroup: 'Core', equipment: 'Ab Roller', type: 'strength' },
  { name: 'Hanging Knee Raises', mnName: 'Ханнинг ни raises', muscleGroup: 'Core', equipment: 'Pull-up Bar', type: 'strength' },
  { name: 'Cable Crunches', mnName: 'Кабел кранчес', muscleGroup: 'Core', equipment: 'Cable', type: 'strength' },
  { name: 'Stair Climber', mnName: 'Стайр климбер', muscleGroup: 'Cardio', equipment: 'Stair Climber', type: 'cardio' },
  { name: 'Elliptical', mnName: 'Элиптикал', muscleGroup: 'Cardio', equipment: 'Elliptical', type: 'cardio' },
  { name: 'Stair Master', mnName: 'Стайр мастер', muscleGroup: 'Cardio', equipment: 'Stair Master', type: 'cardio' },
  { name: 'Assault Bike', mnName: 'Асалт байк', muscleGroup: 'Cardio', equipment: 'Assault Bike', type: 'cardio' },
  { name: 'Ski Erg', mnName: 'Ски эрг', muscleGroup: 'Cardio', equipment: 'Ski Erg', type: 'cardio' },
  { name: 'Swimming', mnName: 'Сэлгээ', muscleGroup: 'Cardio', equipment: 'Pool', type: 'cardio' }
]

async function main() {
  console.log('Seeding default exercises...')

  // Check if exercises already exist
  const existingCount = await prisma.exercise.count({
    where: { isDefault: true }
  })

  if (existingCount > 0) {
    console.log('Default exercises already exist. Skipping seeding.')
    return
  }

  await prisma.exercise.createMany({
    data: defaultExercises.map(exercise => ({
      ...exercise,
      isDefault: true
    }))
  })

  console.log('Default exercises seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })