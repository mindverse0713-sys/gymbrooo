import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const workouts = await db.workout.findMany({
      where: {
        userId
      },
      include: {
        sets: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(workouts)
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

    // Create workout
    const workout = await db.workout.create({
      data: {
        userId,
        date: new Date(),
        notes: notes || null,
        completed: true
      }
    })

    // Create sets for each exercise
    for (const workoutExercise of exercises) {
      for (const set of workoutExercise.sets) {
        await db.set.create({
          data: {
            workoutId: workout.id,
            exerciseId: workoutExercise.exerciseId,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            completed: set.completed,
            order: set.order
          }
        })
      }
    }

    // Fetch the complete workout with sets
    const completeWorkout = await db.workout.findUnique({
      where: { id: workout.id },
      include: {
        sets: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

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
    const workout = await db.workout.findUnique({
      where: { id: workoutId }
    })

    if (!workout) {
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

    // Delete the workout (this will cascade delete sets due to the relation)
    await db.workout.delete({
      where: { id: workoutId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}