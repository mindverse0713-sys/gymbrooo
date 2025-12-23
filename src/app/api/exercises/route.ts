import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const exercises = await db.exercise.findMany({
      orderBy: {
        mnName: 'asc'
      }
    })

    return NextResponse.json(exercises)
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

    const exercise = await db.exercise.create({
      data: {
        name,
        mnName,
        muscleGroup,
        equipment,
        type,
        isDefault: false
      }
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}