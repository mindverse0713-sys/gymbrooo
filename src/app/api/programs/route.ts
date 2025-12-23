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

    // Fetch programs
    const { data: programs, error: programsError } = await getSupabase()
      .from('Program')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (programsError) {
      console.error('Supabase error:', programsError)
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      )
    }

    if (!programs || programs.length === 0) {
      return NextResponse.json([])
    }

    const programIds = programs.map(p => p.id)

    // Fetch days
    const { data: days, error: daysError } = await getSupabase()
      .from('Day')
      .select('*')
      .in('programId', programIds)
      .order('dayNumber', { ascending: true })

    if (daysError) {
      console.error('Supabase error:', daysError)
      return NextResponse.json(
        { error: 'Failed to fetch days' },
        { status: 500 }
      )
    }

    const dayIds = days?.map(d => d.id) || []

    // Fetch day exercises
    const { data: dayExercises, error: dayExercisesError } = await getSupabase()
      .from('DayExercise')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .in('dayId', dayIds)
      .order('order', { ascending: true })

    if (dayExercisesError) {
      console.error('Supabase error:', dayExercisesError)
      return NextResponse.json(
        { error: 'Failed to fetch day exercises' },
        { status: 500 }
      )
    }

    // Group days by programId
    const daysByProgram = new Map<string, any[]>()
    days?.forEach(day => {
      if (!daysByProgram.has(day.programId)) {
        daysByProgram.set(day.programId, [])
      }
      daysByProgram.get(day.programId)!.push(day)
    })

    // Group dayExercises by dayId
    const exercisesByDay = new Map<string, any[]>()
    dayExercises?.forEach(de => {
      if (!exercisesByDay.has(de.dayId)) {
        exercisesByDay.set(de.dayId, [])
      }
      exercisesByDay.get(de.dayId)!.push(de)
    })

    // Combine everything
    const programsWithDays = programs.map(program => {
      const programDays = daysByProgram.get(program.id) || []
      const daysWithExercises = programDays.map(day => ({
        ...day,
        exercises: exercisesByDay.get(day.id) || []
      }))
      return {
        ...program,
        days: daysWithExercises
      }
    })

    return NextResponse.json(programsWithDays)
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, days } = body

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and program name are required' },
        { status: 400 }
      )
    }

    const programId = uuidv4()
    const now = new Date().toISOString()

    // Create program
    const { data: program, error: programError } = await getSupabase()
      .from('Program')
      .insert({
        id: programId,
        userId,
        name,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (programError) {
      console.error('Supabase error:', programError)
      return NextResponse.json(
        { error: 'Failed to create program' },
        { status: 500 }
      )
    }

    // Create days and exercises if provided
    if (days && days.length > 0) {
      for (const dayData of days) {
        const dayId = uuidv4()
        
        // Create day
        const { error: dayError } = await getSupabase()
          .from('Day')
          .insert({
            id: dayId,
            programId: programId,
            dayNumber: dayData.dayNumber,
            isRestDay: dayData.isRestDay || false,
            isDeloadWeek: dayData.isDeloadWeek || false,
            createdAt: now,
            updatedAt: now,
          })

        if (dayError) {
          console.error('Supabase error creating day:', dayError)
          continue
        }

        // Create exercises for the day
        if (dayData.exercises && dayData.exercises.length > 0) {
          const dayExercisesToInsert = dayData.exercises.map((ex: any, index: number) => ({
            id: uuidv4(),
            dayId: dayId,
            exerciseId: ex.exerciseId,
            order: index + 1,
            createdAt: now,
          }))

          const { error: dayExercisesError } = await getSupabase()
            .from('DayExercise')
            .insert(dayExercisesToInsert)

          if (dayExercisesError) {
            console.error('Supabase error creating day exercises:', dayExercisesError)
          }
        }
      }
    }

    // Fetch the complete program
    const { data: programDays } = await getSupabase()
      .from('Day')
      .select('*')
      .eq('programId', programId)
      .order('dayNumber', { ascending: true })

    const dayIds = programDays?.map(d => d.id) || []
    
    const { data: dayExercises } = await getSupabase()
      .from('DayExercise')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .in('dayId', dayIds)
      .order('order', { ascending: true })

    const exercisesByDay = new Map<string, any[]>()
    dayExercises?.forEach(de => {
      if (!exercisesByDay.has(de.dayId)) {
        exercisesByDay.set(de.dayId, [])
      }
      exercisesByDay.get(de.dayId)!.push(de)
    })

    const daysWithExercises = programDays?.map(day => ({
      ...day,
      exercises: exercisesByDay.get(day.id) || []
    })) || []

    const completeProgram = {
      ...program,
      days: daysWithExercises
    }

    return NextResponse.json(completeProgram, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { programId, userId, name, days } = body

    if (!programId || !userId) {
      return NextResponse.json(
        { error: 'Program ID and User ID are required' },
        { status: 400 }
      )
    }

    // First verify that program belongs to user
    const { data: existingProgram, error: existingError } = await getSupabase()
      .from('Program')
      .select('*')
      .eq('id', programId)
      .single()

    if (existingError || !existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    if (existingProgram.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this program' },
        { status: 403 }
      )
    }

    // Update program name if provided
    if (name) {
      const { error: updateError } = await getSupabase()
        .from('Program')
        .update({
          name,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', programId)

      if (updateError) {
        console.error('Supabase error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update program' },
          { status: 500 }
        )
      }
    }

    // If days are provided, update them
    if (days && days.length > 0) {
      // Delete existing days (cascade will delete day exercises)
      const { error: deleteDaysError } = await getSupabase()
        .from('Day')
        .delete()
        .eq('programId', programId)

      if (deleteDaysError) {
        console.error('Supabase error deleting days:', deleteDaysError)
      }

      // Create new days (same logic as POST)
      const now = new Date().toISOString()
      for (const dayData of days) {
        const dayId = uuidv4()
        
        const { error: dayError } = await getSupabase()
          .from('Day')
          .insert({
            id: dayId,
            programId: programId,
            dayNumber: dayData.dayNumber,
            isRestDay: dayData.isRestDay || false,
            isDeloadWeek: dayData.isDeloadWeek || false,
            createdAt: now,
            updatedAt: now,
          })

        if (dayError) {
          console.error('Supabase error creating day:', dayError)
          continue
        }

        if (dayData.exercises && dayData.exercises.length > 0) {
          const dayExercisesToInsert = dayData.exercises.map((ex: any, index: number) => ({
            id: uuidv4(),
            dayId: dayId,
            exerciseId: ex.exerciseId,
            order: index + 1,
            createdAt: now,
          }))

          const { error: dayExercisesError } = await getSupabase()
            .from('DayExercise')
            .insert(dayExercisesToInsert)

          if (dayExercisesError) {
            console.error('Supabase error creating day exercises:', dayExercisesError)
          }
        }
      }
    }

    // Fetch the complete updated program (same as GET)
    const { data: updatedProgram } = await getSupabase()
      .from('Program')
      .select('*')
      .eq('id', programId)
      .single()

    const { data: programDays } = await getSupabase()
      .from('Day')
      .select('*')
      .eq('programId', programId)
      .order('dayNumber', { ascending: true })

    const dayIds = programDays?.map(d => d.id) || []
    
    const { data: dayExercises } = await getSupabase()
      .from('DayExercise')
      .select(`
        *,
        exercise:Exercise(*)
      `)
      .in('dayId', dayIds)
      .order('order', { ascending: true })

    const exercisesByDay = new Map<string, any[]>()
    dayExercises?.forEach(de => {
      if (!exercisesByDay.has(de.dayId)) {
        exercisesByDay.set(de.dayId, [])
      }
      exercisesByDay.get(de.dayId)!.push(de)
    })

    const daysWithExercises = programDays?.map(day => ({
      ...day,
      exercises: exercisesByDay.get(day.id) || []
    })) || []

    const completeProgram = {
      ...updatedProgram,
      days: daysWithExercises
    }

    return NextResponse.json(completeProgram)
  } catch (error) {
    console.error('Error updating program:', error)
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const userId = searchParams.get('userId')

    if (!programId || !userId) {
      return NextResponse.json(
        { error: 'Program ID and User ID are required' },
        { status: 400 }
      )
    }

    // First verify that program belongs to user
    const { data: program, error: programError } = await getSupabase()
      .from('Program')
      .select('userId')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    if (program.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this program' },
        { status: 403 }
      )
    }

    // Delete program (cascade will delete days and day exercises)
    const { error: deleteError } = await getSupabase()
      .from('Program')
      .delete()
      .eq('id', programId)

    if (deleteError) {
      console.error('Supabase error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete program' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}
