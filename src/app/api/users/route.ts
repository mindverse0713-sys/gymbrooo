import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const { data: user, error } = await getSupabase()
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user', details: error.message },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, age, gender, height, weight, experienceLevel } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await getSupabase()
      .from('User')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine, other errors are real problems
      console.error('Supabase check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check user existence', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const newUser = {
      id: uuidv4(),
      email,
      name: name || null,
      age: age || null,
      gender: gender || null,
      height: height || null,
      weight: weight || null,
      experienceLevel: experienceLevel || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data: user, error } = await getSupabase()
      .from('User')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      // Provide more detailed error information
      return NextResponse.json(
        { 
          error: 'Failed to create user',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, age, gender, height, weight, experienceLevel } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (age !== undefined) updateData.age = age
    if (gender !== undefined) updateData.gender = gender
    if (height !== undefined) updateData.height = height
    if (weight !== undefined) updateData.weight = weight
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel

    const { data: user, error } = await getSupabase()
      .from('User')
      .update(updateData)
      .eq('email', email)
      .select()
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
