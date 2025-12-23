import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'week' // week, month, year

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Fetch workouts in the period
    const workouts = await db.workout.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        sets: {
          include: {
            exercise: true
          }
        }
      }
    })

    // Calculate analytics
    const totalWorkouts = workouts.length
    const totalSets = workouts.reduce((acc, workout) => acc + workout.sets.length, 0)
    const completedSets = workouts.reduce((acc, workout) => 
      acc + workout.sets.filter(set => set.completed).length, 0)
    
    const totalVolume = workouts.reduce((acc, workout) => 
      acc + workout.sets.reduce((setAcc, set) => 
        setAcc + (set.weight * set.reps), 0), 0)

    const averageRPE = workouts.reduce((acc, workout) => {
      const workoutRPE = workout.sets.reduce((setAcc, set) => 
        setAcc + (set.rpe || 0), 0)
      const workoutSets = workout.sets.filter(set => set.rpe).length
      return acc + (workoutSets > 0 ? workoutRPE / workoutSets : 0)
    }, 0) / (workouts.length || 1)

    // Find PRs (personal records)
    const exercisePRs = new Map()
    workouts.forEach(workout => {
      workout.sets.forEach(set => {
        if (set.completed && set.exercise) {
          const exerciseId = set.exercise.id
          const currentPR = exercisePRs.get(exerciseId) || 0
          const setWeight = set.weight * set.reps
          if (setWeight > currentPR) {
            exercisePRs.set(exerciseId, setWeight)
          }
        }
      })
    })

    // Get exercise details for PRs
    const prExerciseIds = Array.from(exercisePRs.keys())
    const prExercises = await db.exercise.findMany({
      where: {
        id: {
          in: prExerciseIds
        }
      }
    })

    const personalRecords = prExercises.map(exercise => ({
      exercise,
      prWeight: exercisePRs.get(exercise.id)
    }))

    // Group workouts by date for chart data
    const workoutsByDate = new Map()
    workouts.forEach(workout => {
      const date = workout.date.toISOString().split('T')[0]
      const current = workoutsByDate.get(date) || 0
      workoutsByDate.set(date, current + 1)
    })

    const chartData = Array.from(workoutsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const analytics = {
      summary: {
        totalWorkouts,
        totalSets,
        completedSets,
        completionRate: totalSets > 0 ? (completedSets / totalSets) * 100 : 0,
        totalVolume,
        averageRPE: Math.round(averageRPE * 10) / 10
      },
      personalRecords,
      chartData,
      period
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}