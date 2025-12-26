import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Spoonacular API for nutrition data
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || ''
const SPOONACULAR_API_URL = 'https://api.spoonacular.com'

/**
 * Get nutrition data from Spoonacular API using food name
 */
async function getNutritionFromSpoonacular(foodName: string): Promise<{
  food: string
  calories: number
  protein: number
  carbs: number
  fat: number
} | null> {
  try {
    if (!SPOONACULAR_API_KEY) {
      console.error('Spoonacular API key not configured. Please add SPOONACULAR_API_KEY to your environment variables.')
      return null
    }

    // Use Spoonacular's food search endpoint
    const searchUrl = `${SPOONACULAR_API_URL}/food/ingredients/search`
    const searchResponse = await axios.get(searchUrl, {
      params: {
        query: foodName,
        number: 1,
        apiKey: SPOONACULAR_API_KEY,
      },
    })

    const ingredients = searchResponse.data.results
    if (!ingredients || ingredients.length === 0) {
      console.log('No ingredients found for:', foodName)
      return null
    }

    const ingredientId = ingredients[0].id
    const ingredientName = ingredients[0].name

    // Get detailed nutrition information
    const nutritionUrl = `${SPOONACULAR_API_URL}/food/ingredients/${ingredientId}/information`
    const nutritionResponse = await axios.get(nutritionUrl, {
      params: {
        amount: 100, // 100g serving
        unit: 'grams',
        apiKey: SPOONACULAR_API_KEY,
      },
    })

    const nutrition = nutritionResponse.data.nutrition
    if (!nutrition) {
      return null
    }

    // Extract nutrition values
    const nutrients = nutrition.nutrients || []
    const calories = nutrients.find((n: any) => n.name === 'Calories')?.amount || 0
    const protein = nutrients.find((n: any) => n.name === 'Protein')?.amount || 0
    const carbs = nutrients.find((n: any) => n.name === 'Carbohydrates')?.amount || 0
    const fat = nutrients.find((n: any) => n.name === 'Fat')?.amount || 0

    return {
      food: ingredientName,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    }
  } catch (error: any) {
    console.error('Error getting nutrition from Spoonacular:', error)
    if (error.response) {
      console.error('Spoonacular API error:', error.response.data)
    }
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { foodName, ingredients } = await request.json()

    // If foodName is provided, get nutrition directly
    if (foodName) {
      const nutrition = await getNutritionFromSpoonacular(foodName)
      
      if (!nutrition) {
        return NextResponse.json(
          { error: `Nutrition data not found for "${foodName}". Please try a different food name.` },
          { status: 404 }
        )
      }

      return NextResponse.json(nutrition)
    }

    // If ingredients is provided, try to get nutrition for the first ingredient
    if (ingredients) {
      const firstIngredient = ingredients.split(',')[0].trim()
      const nutrition = await getNutritionFromSpoonacular(firstIngredient)
      
      if (!nutrition) {
        return NextResponse.json(
          { error: `Nutrition data not found for "${firstIngredient}". Please try a different food name.` },
          { status: 404 }
        )
      }

      return NextResponse.json(nutrition)
    }

    return NextResponse.json(
      { error: 'Please provide a food name or ingredients.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Food analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze food' },
      { status: 500 }
    )
  }
}
