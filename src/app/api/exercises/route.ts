import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const { data: exercises, error } = await getSupabase()
      .from('Exercise')
      .select('*')
      .order('mnName', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    return NextResponse.json(exercises || [])
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, mnName, muscleGroup, equipment, type } = body

    if (!name || !mnName || !muscleGroup) {
      return NextResponse.json(
        { error: 'Name, Mongolian name, and muscle group are required' },
        { status: 400 }
      )
    }

    const newExercise = {
      id: uuidv4(),
      name,
      mnName,
      muscleGroup,
      equipment: equipment || null,
      type: type || null,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data: exercise, error } = await getSupabase()
      .from('Exercise')
      .insert(newExercise)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create exercise' },
        { status: 500 }
      )
    }

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
