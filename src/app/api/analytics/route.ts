import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

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
    const { data: workouts, error: workoutsError } = await getSupabase()
      .from('Workout')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString())

    if (workoutsError) {
      console.error('Supabase error:', workoutsError)
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      )
    }

    if (!workouts || workouts.length === 0) {
      return NextResponse.json({
        summary: {
          totalWorkouts: 0,
          totalSets: 0,
          completedSets: 0,
          completionRate: 0,
          totalVolume: 0,
          averageRPE: 0
        },
        personalRecords: [],
        chartData: [],
        period
      })
    }

    const workoutIds = workouts.map(w => w.id)

    // Fetch sets with exercises
    const { data: sets, error: setsError } = await getSupabase()
      .from('Set')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .in('workoutId', workoutIds)

    if (setsError) {
      console.error('Supabase error:', setsError)
      return NextResponse.json(
        { error: 'Failed to fetch sets' },
        { status: 500 }
      )
    }

    // Group sets by workoutId
    const setsByWorkout = new Map<string, any[]>()
    sets?.forEach(set => {
      if (!setsByWorkout.has(set.workoutId)) {
        setsByWorkout.set(set.workoutId, [])
      }
      setsByWorkout.get(set.workoutId)!.push(set)
    })

    // Calculate analytics
    const totalWorkouts = workouts.length
    const allSets = sets || []
    const totalSets = allSets.length
    const completedSets = allSets.filter(set => set.completed).length
    
    const totalVolume = allSets.reduce((acc, set) => 
      acc + (set.weight * set.reps), 0)

    const setsWithRPE = allSets.filter(set => set.rpe)
    const averageRPE = setsWithRPE.length > 0
      ? setsWithRPE.reduce((acc, set) => acc + (set.rpe || 0), 0) / setsWithRPE.length
      : 0

    // Find PRs (personal records) - highest volume per exercise
    const exercisePRs = new Map()
    allSets.forEach(set => {
      if (set.completed && set.exercise) {
        const exerciseId = set.exercise.id
        const currentPR = exercisePRs.get(exerciseId) || { weight: 0, reps: 0, volume: 0 }
        const setVolume = set.weight * set.reps
        if (setVolume > currentPR.volume || (setVolume === currentPR.volume && set.weight > currentPR.weight)) {
          exercisePRs.set(exerciseId, {
            weight: set.weight,
            reps: set.reps,
            volume: setVolume
          })
        }
      }
    })

    // Get exercise details for PRs
    const prExerciseIds = Array.from(exercisePRs.keys())
    const { data: prExercises } = await getSupabase()
      .from('Exercise')
      .select('*')
      .in('id', prExerciseIds)

    const personalRecords = (prExercises || []).map(exercise => ({
      exercise,
      prWeight: exercisePRs.get(exercise.id)?.weight || 0
    }))

    // Group workouts by date for chart data
    const workoutsByDate = new Map()
    workouts.forEach(workout => {
      const date = new Date(workout.date).toISOString().split('T')[0]
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
