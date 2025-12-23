import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  // Lazy initialization - only check at runtime
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    supabaseClient = createClient(url, key)
  }
  
  return supabaseClient
}


// Database types (matching Prisma schema)
export interface User {
  id: string
  email: string
  name?: string | null
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  experienceLevel?: string | null
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: string
  name: string
  mnName: string
  muscleGroup: string
  equipment?: string | null
  type?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Program {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Day {
  id: string
  dayNumber: number
  isRestDay: boolean
  isDeloadWeek: boolean
  programId: string
  createdAt: string
  updatedAt: string
}

export interface DayExercise {
  id: string
  dayId: string
  exerciseId: string
  order: number
  createdAt: string
}

export interface Workout {
  id: string
  userId: string
  date: string
  notes?: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface Set {
  id: string
  workoutId: string
  exerciseId: string
  reps: number
  weight: number
  rpe?: number | null
  completed: boolean
  order: number
  createdAt: string
}

