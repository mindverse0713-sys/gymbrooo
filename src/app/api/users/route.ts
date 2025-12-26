import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

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
    const { email, password, name, age, gender, height, weight, experienceLevel, profileImage } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await getSupabase()
      .from('User')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    // maybeSingle returns null if no row found, error only if there's a real problem
    if (checkError) {
      console.error('Supabase check error:', checkError)
      // If it's a table not found error, that's the real problem
      return NextResponse.json(
        { 
          error: 'Database error. Please check if tables exist in Supabase.',
          details: checkError.message,
          code: checkError.code
        },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      id: uuidv4(),
        email,
      password: hashedPassword,
        name: name || null,
        age: age || null,
        gender: gender || null,
        height: height || null,
        weight: weight || null,
      experienceLevel: experienceLevel || null,
      profileImage: profileImage || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data: user, error } = await getSupabase()
      .from('User')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      // Provide more detailed error information for debugging
      const errorMessage = error.message || 'Unknown error'
      const errorCode = error.code || 'UNKNOWN'
      
      // Check if it's a table not found error
      if (errorMessage.includes('does not exist') || errorCode === '42P01') {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the SQL migration in Supabase.',
            details: errorMessage,
            code: errorCode
          },
          { status: 500 }
        )
      }
      
      // Check if it's a column not found error (password column might be missing)
      if (errorMessage.includes('column') && errorMessage.includes('does not exist') || errorCode === '42703') {
        return NextResponse.json(
          { 
            error: 'Database column missing. Please add password column to User table in Supabase.',
            details: errorMessage,
            code: errorCode,
            hint: 'Run: ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create user',
          details: errorMessage,
          code: errorCode,
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
    const { email, name, age, gender, height, weight, experienceLevel, profileImage } = body

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
    if (profileImage !== undefined) updateData.profileImage = profileImage

    const { data: user, error } = await getSupabase()
      .from('User')
      .update(updateData)
      .eq('email', email)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      // Check if it's a column not found error
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database column missing. Please run the SQL migration to add profileImage column.',
            details: error.message,
            hint: 'Run: ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
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
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
