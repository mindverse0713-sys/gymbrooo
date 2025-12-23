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

    const programs = await db.program.findMany({
      where: {
        userId
      },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(programs)
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

    // Create program
    const program = await db.program.create({
      data: {
        userId,
        name
      }
    })

    // Create days if provided
    if (days && days.length > 0) {
      for (const dayData of days) {
        const day = await db.day.create({
          data: {
            programId: program.id,
            dayNumber: dayData.dayNumber,
            isRestDay: dayData.isRestDay || false,
            isDeloadWeek: dayData.isDeloadWeek || false
          }
        })

        // Create exercises for the day
        if (dayData.exercises && dayData.exercises.length > 0) {
          for (let i = 0; i < dayData.exercises.length; i++) {
            await db.dayExercise.create({
              data: {
                dayId: day.id,
                exerciseId: dayData.exercises[i].exerciseId,
                order: i + 1
              }
            })
          }
        }
      }
    }

    // Fetch the complete program
    const completeProgram = await db.program.findUnique({
      where: { id: program.id },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    })

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
    const existingProgram = await db.program.findUnique({
      where: { id: programId }
    })

    if (!existingProgram) {
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

    // Update program
    const updatedProgram = await db.program.update({
      where: { id: programId },
      data: {
        name: name || existingProgram.name
      }
    })

    // If days are provided, update them
    if (days && days.length > 0) {
      // Delete existing days
      await db.day.deleteMany({
        where: { programId }
      })

      // Create new days
      for (const dayData of days) {
        const day = await db.day.create({
          data: {
            programId,
            dayNumber: dayData.dayNumber,
            isRestDay: dayData.isRestDay || false,
            isDeloadWeek: dayData.isDeloadWeek || false
          }
        })

        // Create exercises for the day
        if (dayData.exercises && dayData.exercises.length > 0) {
          for (let i = 0; i < dayData.exercises.length; i++) {
            await db.dayExercise.create({
              data: {
                dayId: day.id,
                exerciseId: dayData.exercises[i].exerciseId,
                order: i + 1
              }
            })
          }
        }
      }
    }

    // Fetch the complete updated program
    const completeProgram = await db.program.findUnique({
      where: { id: programId },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    })

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
    const program = await db.program.findUnique({
      where: { id: programId }
    })

    if (!program) {
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

    // Delete program (this will cascade delete days and exercises)
    await db.program.delete({
      where: { id: programId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}