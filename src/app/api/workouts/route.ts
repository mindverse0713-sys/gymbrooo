import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch workouts with sets and exercises
    const { data: workouts, error: workoutsError } = await getSupabase()
      .from('Workout')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false })

    if (workoutsError) {
      console.error('Supabase error:', workoutsError)
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      )
    }

    // Fetch sets for all workouts
    const workoutIds = workouts?.map(w => w.id) || []
    const { data: sets, error: setsError } = await getSupabase()
      .from('Set')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .in('workoutId', workoutIds)
      .order('order', { ascending: true })

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

    // Combine workouts with their sets
    const workoutsWithSets = workouts?.map(workout => ({
      ...workout,
      sets: setsByWorkout.get(workout.id) || []
    })) || []

    return NextResponse.json(workoutsWithSets)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, exercises, notes } = body

    if (!userId || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: 'User ID and exercises are required' },
        { status: 400 }
      )
    }

    const workoutId = uuidv4()
    const now = new Date().toISOString()

    // Create workout
    const { data: workout, error: workoutError } = await getSupabase()
      .from('Workout')
      .insert({
        id: workoutId,
        userId,
        date: now,
        notes: notes || null,
        completed: true,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (workoutError) {
      console.error('Supabase error:', workoutError)
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      )
    }

    // Create sets for each exercise
    const setsToInsert = []
    for (const workoutExercise of exercises) {
      for (const set of workoutExercise.sets) {
        setsToInsert.push({
          id: uuidv4(),
          workoutId: workoutId,
          exerciseId: workoutExercise.exerciseId,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe || null,
          completed: set.completed,
          order: set.order,
          createdAt: now,
        })
      }
    }

    if (setsToInsert.length > 0) {
      const { error: setsError } = await getSupabase()
        .from('Set')
        .insert(setsToInsert)

      if (setsError) {
        console.error('Supabase error:', setsError)
        // Still return the workout even if sets fail
      }
    }

    // Fetch the complete workout with sets
    const { data: sets, error: setsFetchError } = await getSupabase()
      .from('Set')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .eq('workoutId', workoutId)
      .order('order', { ascending: true })

    const completeWorkout = {
      ...workout,
      sets: sets || []
    }

    return NextResponse.json(completeWorkout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('workoutId')
    const userId = searchParams.get('userId')

    if (!workoutId || !userId) {
      return NextResponse.json(
        { error: 'Workout ID and User ID are required' },
        { status: 400 }
      )
    }

    // First verify that the workout belongs to the user
    const { data: workout, error: workoutError } = await getSupabase()
      .from('Workout')
      .select('userId')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    if (workout.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this workout' },
        { status: 403 }
      )
    }

    // Delete the workout (sets will be cascade deleted by foreign key)
    const { error: deleteError } = await getSupabase()
      .from('Workout')
      .delete()
      .eq('id', workoutId)

    if (deleteError) {
      console.error('Supabase error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete workout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
