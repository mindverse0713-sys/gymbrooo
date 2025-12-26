// Food Recognition and Calorie Calculation API
// Using Edamam Nutrition Analysis API

const EDAMAM_APP_ID = process.env.NEXT_PUBLIC_EDAMAM_APP_ID || ''
const EDAMAM_APP_KEY = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY || ''

export interface FoodItem {
  food: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
}

export interface ExerciseRecommendation {
  exercise: string
  duration: number // minutes
  caloriesBurned: number
}

// Calculate exercise recommendations based on calories
export function calculateExerciseRecommendations(calories: number): ExerciseRecommendation[] {
  // Average calories burned per minute for different exercises
  // Based on 70kg person
  const exercises = [
    { name: 'Running (8 km/h)', caloriesPerMin: 8.3 },
    { name: 'Cycling (moderate)', caloriesPerMin: 7.0 },
    { name: 'Swimming', caloriesPerMin: 6.5 },
    { name: 'Jumping Rope', caloriesPerMin: 10.0 },
    { name: 'Weight Training', caloriesPerMin: 5.0 },
    { name: 'Walking (5 km/h)', caloriesPerMin: 3.5 },
    { name: 'HIIT', caloriesPerMin: 12.0 },
    { name: 'Rowing', caloriesPerMin: 7.5 },
  ]

  return exercises.map(ex => ({
    exercise: ex.name,
    duration: Math.ceil(calories / ex.caloriesPerMin),
    caloriesBurned: calories
  }))
}

// Analyze food image using Edamam API
export async function analyzeFoodImage(imageBase64: string): Promise<FoodItem | null> {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.warn('Edamam API credentials not configured')
    return null
  }

  try {
    // Note: Edamam doesn't directly support image recognition
    // We'll need to use a different approach or combine with another service
    // For now, this is a placeholder structure
    
    // Alternative: Use a food recognition API first, then get nutrition from Edamam
    const response = await fetch('/api/food/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze food image')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error analyzing food image:', error)
    return null
  }
}

// Get nutrition data from food name using Edamam
export async function getNutritionFromFoodName(foodName: string): Promise<FoodItem | null> {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.warn('Edamam API credentials not configured')
    return null
  }

  try {
    const url = `https://api.edamam.com/api/nutrition-data?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(foodName)}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to get nutrition data')
    }

    const data = await response.json()
    
    return {
      food: foodName,
      calories: Math.round(data.calories || 0),
      protein: Math.round(data.totalNutrients?.PROCNT?.quantity || 0),
      carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity || 0),
      fat: Math.round(data.totalNutrients?.FAT?.quantity || 0),
    }
  } catch (error) {
    console.error('Error getting nutrition data:', error)
    return null
  }
}

