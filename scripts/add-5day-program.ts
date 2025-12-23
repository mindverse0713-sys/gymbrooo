import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Exercise mapping - maps program exercise names to database exercise names or create data
const exerciseMapping: Record<string, { searchNames: string[]; createData?: { name: string; mnName: string; muscleGroup: string; equipment: string; type: string } }> = {
  'Barbell Bench Press': { searchNames: ['Bench Press', 'Barbell Bench Press'] },
  'Weighted Dips': { searchNames: ['Dips'], createData: { name: 'Weighted Dips', mnName: 'Жинлэсэн дип', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'strength' } },
  'Incline DB Press': { searchNames: ['Incline Bench Press', 'Incline Dumbbell Press'], createData: { name: 'Incline Dumbbell Press', mnName: 'Инклайн дамббел пресс', muscleGroup: 'Chest', equipment: 'Dumbbell', type: 'strength' } },
  'Seated DB Shoulder Press': { searchNames: ['Shoulder Press'], createData: { name: 'Seated Dumbbell Shoulder Press', mnName: 'Сунгасан дамббел мөрний пресс', muscleGroup: 'Shoulders', equipment: 'Dumbbell', type: 'strength' } },
  'Cable Lateral Raise': { searchNames: ['Lateral Raises'], createData: { name: 'Cable Lateral Raise', mnName: 'Кабел хажуугийн өргөлт', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'strength' } },
  'Overhead Rope Triceps Extension': { searchNames: ['Tricep Extensions'], createData: { name: 'Overhead Rope Triceps Extension', mnName: 'Оверхед олс трайцепс extension', muscleGroup: 'Arms', equipment: 'Cable', type: 'strength' } },
  'Weighted Pull-up': { searchNames: ['Pull-ups'], createData: { name: 'Weighted Pull-up', mnName: 'Жинлэсэн пуллап', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'strength' } },
  'Chest-Supported Row': { searchNames: ['Seated Cable Rows'], createData: { name: 'Chest-Supported Row', mnName: 'Цээж дэмжсэн роу', muscleGroup: 'Back', equipment: 'Machine', type: 'strength' } },
  'Lat Pulldown': { searchNames: ['Lat Pulldowns'] },
  'Face Pull': { searchNames: ['Face Pulls'] },
  'EZ Bar Curl': { searchNames: ['EZ Bar Curls'] },
  'Hammer Curl': { searchNames: ['Hammer Curls'] },
  'Back Squat': { searchNames: ['Squat', 'Back Squat'] },
  'Romanian Deadlift': { searchNames: ['Romanian Deadlift'], createData: { name: 'Romanian Deadlift', mnName: 'Румын дэдлифт', muscleGroup: 'Legs', equipment: 'Barbell', type: 'strength' } },
  'Leg Press': { searchNames: ['Leg Press'] },
  'Lying Leg Curl': { searchNames: ['Leg Curls'], createData: { name: 'Lying Leg Curl', mnName: 'Хэвтээ лег curl', muscleGroup: 'Legs', equipment: 'Machine', type: 'strength' } },
  'Standing Calf Raise': { searchNames: ['Calf Raises'] },
  'Standing Overhead Press': { searchNames: ['Overhead Press'], createData: { name: 'Standing Overhead Press', mnName: 'Зогсож оверхед пресс', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'strength' } },
  'Rear Delt Machine Fly': { searchNames: ['Reverse Pec Deck'], createData: { name: 'Rear Delt Machine Fly', mnName: 'Арын делт машин fly', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'strength' } },
  'Incline DB Curl': { searchNames: ['Bicep Curls'], createData: { name: 'Incline Dumbbell Curl', mnName: 'Инклайн дамббел curl', muscleGroup: 'Arms', equipment: 'Dumbbell', type: 'strength' } },
  'Preacher Curl': { searchNames: ['Preacher Curls'] },
  'Cable Pushdown': { searchNames: ['Tricep Pushdowns'] },
  'Decline Bench Press': { searchNames: ['Decline Bench Press'], createData: { name: 'Decline Bench Press', mnName: 'Деклайн бэнч пресс', muscleGroup: 'Chest', equipment: 'Barbell', type: 'strength' } },
  'Cable Low-to-High Fly': { searchNames: ['Cable Flyes'], createData: { name: 'Cable Low-to-High Fly', mnName: 'Кабел доошоос дээш fly', muscleGroup: 'Chest', equipment: 'Cable', type: 'strength' } },
  'Hanging Leg Raise': { searchNames: ['Hanging Leg Raises', 'Hanging Knee Raises'], createData: { name: 'Hanging Leg Raise', mnName: 'Ханнинг лег өргөлт', muscleGroup: 'Core', equipment: 'Pull-up Bar', type: 'strength' } },
  'Weighted Cable Crunch': { searchNames: ['Cable Crunches'], createData: { name: 'Weighted Cable Crunch', mnName: 'Жинлэсэн кабел кранч', muscleGroup: 'Core', equipment: 'Cable', type: 'strength' } },
  'Ab Wheel Rollout': { searchNames: ['Ab Rollouts'] },
}

// Program structure
const programDays = [
  {
    dayNumber: 1,
    name: 'PUSH (ЦЭЭЖ + МӨР / ХҮЧ)',
    exercises: [
      'Barbell Bench Press',
      'Weighted Dips',
      'Incline DB Press',
      'Seated DB Shoulder Press',
      'Cable Lateral Raise',
      'Overhead Rope Triceps Extension'
    ]
  },
  {
    dayNumber: 2,
    name: 'PULL (НУРУУ + БИСЕП / ӨРГӨН)',
    exercises: [
      'Weighted Pull-up',
      'Chest-Supported Row',
      'Lat Pulldown',
      'Face Pull',
      'EZ Bar Curl',
      'Hammer Curl'
    ]
  },
  {
    dayNumber: 3,
    name: 'LOWER (ХЯЗГААРЛАСАН, СЭРГЭЛТЭД ЭЭЛТЭЙ)',
    exercises: [
      'Back Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Lying Leg Curl',
      'Standing Calf Raise'
    ]
  },
  {
    dayNumber: 4,
    name: 'SHOULDERS + ARMS (ОВООЛТ)',
    exercises: [
      'Standing Overhead Press',
      'Cable Lateral Raise',
      'Rear Delt Machine Fly',
      'Incline DB Curl',
      'Preacher Curl',
      'Cable Pushdown'
    ]
  },
  {
    dayNumber: 5,
    name: 'CORE + CHEST DETAIL',
    exercises: [
      'Decline Bench Press',
      'Cable Low-to-High Fly',
      'Hanging Leg Raise',
      'Weighted Cable Crunch',
      'Ab Wheel Rollout'
    ]
  }
]

async function findOrCreateExercise(exerciseKey: string) {
  const exerciseMappingData = exerciseMapping[exerciseKey]
  if (!exerciseMappingData) {
    throw new Error(`Exercise mapping not found for: ${exerciseKey}`)
  }

  // Try to find existing exercise by searching through possible names (case-insensitive)
  // Prioritize exact matches first, then partial matches
  let exercise = null
  const allExercises = await prisma.exercise.findMany()
  
  // First try exact matches
  for (const searchName of exerciseMappingData.searchNames) {
    const searchLower = searchName.toLowerCase().trim()
    exercise = allExercises.find(e => {
      const eNameLower = e.name.toLowerCase().trim()
      return eNameLower === searchLower
    })
    if (exercise) {
      console.log(`Found exact match: ${exercise.name} (searched: ${searchName})`)
      break
    }
  }
  
  // If no exact match, try partial matches
  if (!exercise) {
    for (const searchName of exerciseMappingData.searchNames) {
      const searchLower = searchName.toLowerCase().trim()
      exercise = allExercises.find(e => {
        const eNameLower = e.name.toLowerCase().trim()
        return (eNameLower.includes(searchLower) && searchLower.length > 5) || 
               (searchLower.includes(eNameLower) && eNameLower.length > 5)
      })
      if (exercise) {
        console.log(`Found partial match: ${exercise.name} (searched: ${searchName})`)
        break
      }
    }
  }

  // If not found and we have create data, create it
  if (!exercise && exerciseMappingData.createData) {
    exercise = await prisma.exercise.create({
      data: {
        ...exerciseMappingData.createData,
        isDefault: false
      }
    })
    console.log(`Created exercise: ${exerciseMappingData.createData.name}`)
  } else if (!exercise) {
    // Try exact match as last resort
    exercise = await prisma.exercise.findFirst({
      where: {
        name: exerciseMappingData.searchNames[0]
      }
    })
    if (!exercise) {
      console.error(`All exercises in DB:`, allExercises.map(e => e.name).slice(0, 10))
      throw new Error(`Could not find or create exercise: ${exerciseKey} (searched: ${exerciseMappingData.searchNames.join(', ')})`)
    }
  }

  return exercise
}

async function main() {
  console.log('Starting 5-day program creation...')

  // Get or create a demo user (you can modify this email)
  const userEmail = process.env.USER_EMAIL || 'demo@gymbook.mn'
  
  let user = await prisma.user.findUnique({
    where: { email: userEmail }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Demo User',
        experienceLevel: 'Intermediate'
      }
    })
    console.log(`Created user: ${userEmail}`)
  } else {
    console.log(`Using existing user: ${userEmail}`)
  }

  // Check if program already exists
  const existingProgram = await prisma.program.findFirst({
    where: {
      userId: user.id,
      name: '5-Day Push/Pull/Lower/Shoulders/Core Program'
    }
  })

  if (existingProgram) {
    console.log('Program already exists. Delete it first if you want to recreate it.')
    return
  }

  // Create exercises map
  const exercisesMap = new Map<string, any>()
  for (const exerciseKey of Object.keys(exerciseMapping)) {
    try {
      const exercise = await findOrCreateExercise(exerciseKey)
      exercisesMap.set(exerciseKey, exercise)
    } catch (error) {
      console.error(`Error processing exercise ${exerciseKey}:`, error)
      throw error
    }
  }

  // Create program
  const program = await prisma.program.create({
    data: {
      userId: user.id,
      name: '5-Day Push/Pull/Lower/Shoulders/Core Program'
    }
  })

  console.log(`Created program: ${program.name}`)

  // Create days with exercises
  for (const dayData of programDays) {
    const day = await prisma.day.create({
      data: {
        programId: program.id,
        dayNumber: dayData.dayNumber,
        isRestDay: false,
        isDeloadWeek: false
      }
    })

    console.log(`Created day ${dayData.dayNumber}: ${dayData.name}`)

    // Add exercises to day
    for (let i = 0; i < dayData.exercises.length; i++) {
      const exerciseKey = dayData.exercises[i]
      const exercise = exercisesMap.get(exerciseKey)
      
      if (!exercise) {
        console.error(`Exercise not found in map: ${exerciseKey}`)
        continue
      }

      await prisma.dayExercise.create({
        data: {
          dayId: day.id,
          exerciseId: exercise.id,
          order: i + 1
        }
      })
    }

    console.log(`  Added ${dayData.exercises.length} exercises to day ${dayData.dayNumber}`)
  }

  console.log('Program created successfully!')
  console.log(`Program ID: ${program.id}`)
  console.log(`User ID: ${user.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
