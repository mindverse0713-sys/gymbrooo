const API_BASE = process.env.NODE_ENV === 'production' ? '' : ''

export interface Exercise {
  id: string
  name: string
  mnName: string
  muscleGroup: string
  equipment?: string
  type?: string
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  email: string
  name?: string
  age?: number
  gender?: string
  height?: number
  weight?: number
  experienceLevel?: string
  profileImage?: string
  createdAt?: string
  updatedAt?: string
}

export interface Workout {
  id: string
  userId: string
  date: string
  notes?: string
  completed: boolean
  createdAt: string
  updatedAt: string
  sets: Set[]
}

export interface Set {
  id: string
  workoutId: string
  exerciseId: string
  reps: number
  weight: number
  rpe?: number
  completed: boolean
  order: number
  createdAt: string
  exercise?: Exercise
}

export interface Program {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
  days: Day[]
}

export interface Day {
  id: string
  dayNumber: number
  isRestDay: boolean
  isDeloadWeek: boolean
  programId: string
  createdAt: string
  updatedAt: string
  exercises: DayExercise[]
}

export interface DayExercise {
  id: string
  dayId: string
  exerciseId: string
  order: number
  createdAt: string
  exercise?: Exercise
}

export interface Analytics {
  summary: {
    totalWorkouts: number
    totalSets: number
    completedSets: number
    completionRate: number
    totalVolume: number
    averageRPE: number
  }
  personalRecords: Array<{
    exercise: Exercise
    prWeight: number
  }>
  detailedExercises?: Array<{
    exercise: Exercise
    totalSets: number
    completedSets: number
    totalVolume: number
    avgWeight: number
    avgReps: number
    maxWeight: number
    avgRPE: number
    workoutCount: number
  }>
  chartData: Array<{
    date: string
    count: number
  }>
  period: string
}

// Exercise API
export async function getExercises(): Promise<Exercise[]> {
  const response = await fetch(`${API_BASE}/api/exercises`)
  if (!response.ok) {
    throw new Error('Failed to fetch exercises')
  }
  return response.json()
}

export async function createExercise(exercise: Partial<Exercise>): Promise<Exercise> {
  const response = await fetch(`${API_BASE}/api/exercises`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  })
  if (!response.ok) {
    throw new Error('Failed to create exercise')
  }
  return response.json()
}

// User API
export async function getUser(email: string): Promise<User | null> {
  const response = await fetch(`${API_BASE}/api/users?email=${encodeURIComponent(email)}`)
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to login')
  }
  return response.json()
}

export async function createUser(user: Partial<User> & { password?: string }): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create user' }))
    const errorMessage = error.error || error.details || 'Failed to create user'
    const apiError = new Error(errorMessage)
    ;(apiError as any).response = response
    throw apiError
  }
  return response.json()
}

export async function updateUser(user: Partial<User>): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update user' }))
    const errorMessage = error.error || error.details || 'Failed to update user'
    throw new Error(errorMessage)
  }
  return response.json()
}

// Workout API
export async function getWorkouts(userId: string): Promise<Workout[]> {
  const response = await fetch(`${API_BASE}/api/workouts?userId=${encodeURIComponent(userId)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch workouts')
  }
  return response.json()
}

export async function createWorkout(workout: {
  userId: string
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight: number
      rpe?: number
      completed: boolean
      order: number
    }>
  }>
  notes?: string
}): Promise<Workout> {
  const response = await fetch(`${API_BASE}/api/workouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workout),
  })
  if (!response.ok) {
    throw new Error('Failed to create workout')
  }
  return response.json()
}

export async function deleteWorkout(workoutId: string, userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/workouts?workoutId=${encodeURIComponent(workoutId)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete workout')
  }
  return response.json()
}

// Program API
export async function getPrograms(userId: string): Promise<Program[]> {
  const response = await fetch(`${API_BASE}/api/programs?userId=${encodeURIComponent(userId)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch programs')
  }
  return response.json()
}

export async function createProgram(program: {
  userId: string
  name: string
  days?: Array<{
    dayNumber: number
    isRestDay?: boolean
    isDeloadWeek?: boolean
    exercises?: Array<{
      exerciseId: string
    }>
  }>
}): Promise<Program> {
  const response = await fetch(`${API_BASE}/api/programs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(program),
  })
  if (!response.ok) {
    throw new Error('Failed to create program')
  }
  return response.json()
}

export async function updateProgram(program: {
  programId: string
  userId: string
  name?: string
  days?: Array<{
    dayNumber: number
    isRestDay?: boolean
    isDeloadWeek?: boolean
    exercises?: Array<{
      exerciseId: string
    }>
  }>
}): Promise<Program> {
  const response = await fetch(`${API_BASE}/api/programs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(program),
  })
  if (!response.ok) {
    throw new Error('Failed to update program')
  }
  return response.json()
}

export async function deleteProgram(programId: string, userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/programs?programId=${encodeURIComponent(programId)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete program')
  }
  return response.json()
}

// Analytics API
export async function getAnalytics(userId: string, period: string = 'week'): Promise<Analytics> {
  const response = await fetch(`${API_BASE}/api/analytics?userId=${encodeURIComponent(userId)}&period=${period}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics')
  }
  return response.json()
}