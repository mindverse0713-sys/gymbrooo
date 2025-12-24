import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
  { name: 'Arnold Press', mnName: 'Арнолд пресс', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Barbell Curls', mnName: 'Барбелл curl', muscleGroup: 'Arms', equipment: 'Barbell', type: 'strength' },
  { name: 'Preacher Curls', mnName: 'Пречер curl', muscleGroup: 'Arms', equipment: 'Machine', type: 'strength' },
  { name: 'Cable Tricep Pushdown', mnName: 'Кабел трайцепс pushdown', muscleGroup: 'Arms', equipment: 'Cable', type: 'strength' },
  { name: 'Overhead Tricep Extension', mnName: 'Оверхед трайцепс extension', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Seated Calf Raises', mnName: 'Ситэд калф raises', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Leg Curls', mnName: 'Лег curl', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Leg Extensions', mnName: 'Лег extension', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' },
  { name: 'Bulgarian Split Squat', mnName: 'Булгариан сплит скват', muscleGroup: 'Legs', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Sumo Deadlift', mnName: 'Сумо дэдлифт', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' },
  { name: 'Good Mornings', mnName: 'Гуд морнингс', muscleGroup: 'Back', equipment: 'Barbell', type: 'strength' },
  { name: 'Lat Pulldown', mnName: 'Лат пулдаун', muscleGroup: 'Back', equipment: 'Machine', type: 'strength' },
  { name: 'Cable Rows', mnName: 'Кабел row', muscleGroup: 'Back', equipment: 'Cable', type: 'strength' },
  { name: 'Shrugs', mnName: 'Шрагс', muscleGroup: 'Back', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Decline Bench Press', mnName: 'Деклайн бэнч пресс', muscleGroup: 'Chest', equipment: 'Barbell', type: 'strength' },
  { name: 'Cable Flyes', mnName: 'Кабел flyes', muscleGroup: 'Chest', equipment: 'Cable', type: 'strength' },
  { name: 'Pec Deck', mnName: 'Пек дек', muscleGroup: 'Chest', equipment: 'Machine', type: 'strength' },
  { name: 'Rear Delt Flyes', mnName: 'Риар делт flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' },
  { name: 'Upright Rows', mnName: 'Апрайт row', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'strength' },
  { name: 'Hanging Leg Raises', mnName: 'Ханнинг ни raises', muscleGroup: 'Core', equipment: 'Pull-up Bar', type: 'strength' },
  { name: 'Cable Crunches', mnName: 'Кабел кранчес', muscleGroup: 'Core', equipment: 'Cable', type: 'strength' },
  { name: 'Stair Climber', mnName: 'Стайр климбер', muscleGroup: 'Cardio', equipment: 'Stair Climber', type: 'cardio' },
  { name: 'Elliptical', mnName: 'Элиптикал', muscleGroup: 'Cardio', equipment: 'Elliptical', type: 'cardio' },
  { name: 'Stair Master', mnName: 'Стайр мастер', muscleGroup: 'Cardio', equipment: 'Stair Master', type: 'cardio' },
  { name: 'Assault Bike', mnName: 'Асалт байк', muscleGroup: 'Cardio', equipment: 'Assault Bike', type: 'cardio' },
  { name: 'Ski Erg', mnName: 'Ски эрг', muscleGroup: 'Cardio', equipment: 'Ski Erg', type: 'cardio' },
  { name: 'Swimming', mnName: 'Сэлгээ', muscleGroup: 'Cardio', equipment: 'Pool', type: 'cardio' }
]

async function main() {
  console.log('Seeding default exercises to Supabase...')

  try {
    // Check if exercises already exist
    const { data: existing, error: checkError } = await supabase
      .from('Exercise')
      .select('id')
      .eq('isDefault', true)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing exercises:', checkError)
      throw checkError
    }

    if (existing && existing.length > 0) {
      console.log('Default exercises already exist. Skipping seeding.')
      return
    }

    // Prepare exercises with IDs and timestamps
    const now = new Date().toISOString()
    const exercisesToInsert = defaultExercises.map(exercise => ({
      id: uuidv4(),
      ...exercise,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    }))

    // Insert exercises in batches of 50 (Supabase limit)
    const batchSize = 50
    for (let i = 0; i < exercisesToInsert.length; i += batchSize) {
      const batch = exercisesToInsert.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('Exercise')
        .insert(batch)

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
        throw insertError
      }
    }

    console.log(`Successfully seeded ${exercisesToInsert.length} default exercises!`)
  } catch (error) {
    console.error('Error seeding exercises:', error)
    process.exit(1)
  }
}

main()

