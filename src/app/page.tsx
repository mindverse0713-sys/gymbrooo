"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dumbbell, 
  TrendingUp, 
  User, 
  Play, 
  Clock,
  Download,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import { 
  getExercises, 
  Exercise as APIExercise, 
  createWorkout, 
  getWorkouts,
  createUser, 
  getUser, 
  updateUser,
  getAnalytics,
  deleteWorkout,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  Analytics
} from '@/lib/api'
import { PDFExporter } from '@/lib/pdf-export'

interface Set {
  id: string
  reps: number
  weight: number
  rpe?: number
  completed: boolean
}

interface WorkoutExercise {
  exercise: APIExercise
  sets: Set[]
}

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio']

export default function GymApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<APIExercise[]>([])
  const [exercises, setExercises] = useState<APIExercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All')
  const [workoutTime, setWorkoutTime] = useState(0)
  const [completedSets, setCompletedSets] = useState(0)
  const [totalSets, setTotalSets] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('demo@gymbook.mn') // Default user for demo
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLogin, setShowLogin] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('week')
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [programEditMode, setProgramEditMode] = useState(false)
  const [newProgramName, setNewProgramName] = useState('')
  const [showCreateProgram, setShowCreateProgram] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load exercises and user data only after component is mounted
  useEffect(() => {
    if (!mounted) return
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load exercises
        const exercisesData = await getExercises()
        setExercises(exercisesData)
        
        // Load or create user
        const userData = await getUser(userEmail)
        if (userData) {
          setCurrentUser(userData)
        } else {
          // User doesn't exist, create one
          const newUser = await createUser({
            email: userEmail,
            name: 'Demo Хэрэглэгч',
            experienceLevel: 'Intermediate'
          })
          setCurrentUser(newUser)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [mounted])

  // Load analytics when user is available and stats tab is active
  useEffect(() => {
    if (!mounted) return
    if (currentUser && activeTab === 'stats') {
      const loadAnalytics = async () => {
        try {
          const analyticsData = await getAnalytics(currentUser.id, analyticsPeriod)
          setAnalytics(analyticsData)
        } catch (error) {
          console.error('Error loading analytics:', error)
        }
      }
      
      loadAnalytics()
    }
  }, [mounted, currentUser, activeTab, analyticsPeriod])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (workoutStarted) {
      interval = setInterval(() => {
        setWorkoutTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [workoutStarted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.mnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup
    return matchesSearch && matchesMuscle
  })

  const startWorkout = () => {
    if (selectedExercises.length === 0 || !currentUser) return
    
    const workoutExercises: WorkoutExercise[] = selectedExercises.map(exercise => ({
      exercise,
      sets: [
        { id: '1', reps: 0, weight: 0, completed: false },
        { id: '2', reps: 0, weight: 0, completed: false },
        { id: '3', reps: 0, weight: 0, completed: false }
      ]
    }))
    
    setCurrentWorkout(workoutExercises)
    setWorkoutStarted(true)
    setTotalSets(workoutExercises.length * 3)
    setCompletedSets(0)
    setActiveTab('workout')
  }

  const toggleSet = (exerciseIndex: number, setId: string) => {
    setCurrentWorkout(prev => {
      const updated = [...prev]
      const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId)
      if (setIndex !== -1) {
        updated[exerciseIndex].sets[setIndex].completed = !updated[exerciseIndex].sets[setIndex].completed
        
        // Update completed sets count
        const newCompleted = updated.reduce((acc, ex) => 
          acc + ex.sets.filter(s => s.completed).length, 0)
        setCompletedSets(newCompleted)
      }
      return updated
    })
  }

  const addSet = (exerciseIndex: number) => {
    setCurrentWorkout(prev => {
      const updated = [...prev]
      const newSetId = mounted ? Date.now().toString() : Math.random().toString(36).substr(2, 9)
      const newSet: Set = {
        id: newSetId,
        reps: 0,
        weight: 0,
        completed: false
      }
      updated[exerciseIndex].sets.push(newSet)
      
      // Update total sets count
      const newTotal = updated.reduce((acc, ex) => acc + ex.sets.length, 0)
      setTotalSets(newTotal)
      
      return updated
    })
  }

  const removeSet = (exerciseIndex: number, setId: string) => {
    setCurrentWorkout(prev => {
      const updated = [...prev]
      const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId)
      
      if (setIndex !== -1 && updated[exerciseIndex].sets.length > 1) {
        // Remove the set
        updated[exerciseIndex].sets.splice(setIndex, 1)
        
        // Update completed sets count
        const newCompleted = updated.reduce((acc, ex) => 
          acc + ex.sets.filter(s => s.completed).length, 0)
        setCompletedSets(newCompleted)
        
        // Update total sets count
        const newTotal = updated.reduce((acc, ex) => acc + ex.sets.length, 0)
        setTotalSets(newTotal)
      }
      
      return updated
    })
  }

  const updateSet = (exerciseIndex: number, setId: string, field: 'reps' | 'weight' | 'rpe', value: number) => {
    setCurrentWorkout(prev => {
      const updated = [...prev]
      const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId)
      if (setIndex !== -1) {
        updated[exerciseIndex].sets[setIndex] = {
          ...updated[exerciseIndex].sets[setIndex],
          [field]: value
        }
      }
      return updated
    })
  }

  const finishWorkout = async () => {
    if (currentUser && currentWorkout.length > 0) {
      try {
        // Save workout to database
        const workoutData = {
          userId: currentUser.id,
          exercises: currentWorkout.map(we => ({
            exerciseId: we.exercise.id,
            sets: we.sets.map((set, index) => ({
              reps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
              completed: set.completed,
              order: index + 1
            }))
          })),
          notes: `Workout completed in ${formatTime(workoutTime)}`
        }
        
        await createWorkout(workoutData)
        console.log('Workout saved successfully!')
        
        // Reload workout history
        await loadWorkoutHistory()
      } catch (error) {
        console.error('Error saving workout:', error)
      }
    }
    
    setWorkoutStarted(false)
    setCurrentWorkout([])
    setSelectedExercises([])
    setWorkoutTime(0)
    setCompletedSets(0)
    setTotalSets(0)
    setActiveTab('home')
  }

  const addExerciseToWorkout = (exercise: APIExercise) => {
    if (!selectedExercises.find(e => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise])
    }
  }

  const removeExerciseFromWorkout = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId))
  }

  const saveUserProfile = async (profileData: any) => {
    if (!currentUser) return
    
    try {
      const updatedUser = await updateUser({
        email: currentUser.email,
        ...profileData
      })
      setCurrentUser(updatedUser)
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const loadPrograms = async () => {
    if (!currentUser) return
    
    try {
      setLoadingPrograms(true)
      const programsData = await getPrograms(currentUser.id)
      setPrograms(programsData)
    } catch (error) {
      console.error('Error loading programs:', error)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const startCreateProgram = () => {
    setNewProgramName('')
    setShowCreateProgram(true)
    setProgramEditMode(false)
    setSelectedProgram(null)
  }

  const startEditProgram = (program: any) => {
    setSelectedProgram(program)
    setNewProgramName(program.name)
    setProgramEditMode(true)
    setShowCreateProgram(false)
  }

  const saveProgram = async () => {
    if (!currentUser || !newProgramName.trim()) return
    
    try {
      if (programEditMode && selectedProgram) {
        // Update existing program
        await updateProgram({
          programId: selectedProgram.id,
          userId: currentUser.id,
          name: newProgramName,
          days: selectedProgram.days
        })
      } else {
        // Create new program with selected exercises
        const programDays = []
        
        if (selectedExercises.length > 0) {
          // Create first day with selected exercises
          // API expects only exerciseId, order is set automatically
          const dayExercises = selectedExercises.map(exercise => ({
            exerciseId: exercise.id
          }))
          
          programDays.push({
            dayNumber: 1,
            isRestDay: false,
            isDeloadWeek: false,
            exercises: dayExercises
          })
        }
        
        await createProgram({
          userId: currentUser.id,
          name: newProgramName,
          days: programDays
        })
      }
      
      // Reload programs
      await loadPrograms()
      
      // If creating new program (not editing), start workout with selected exercises
      if (!programEditMode && selectedExercises.length > 0) {
        // Convert selected exercises to workout format
        const workoutExercises = selectedExercises.map(exercise => ({
          exercise: exercise,
          sets: [
            { id: '1', reps: 0, weight: 0, completed: false },
            { id: '2', reps: 0, weight: 0, completed: false },
            { id: '3', reps: 0, weight: 0, completed: false }
          ]
        }))
        
        setCurrentWorkout(workoutExercises)
        setWorkoutStarted(true)
        setTotalSets(workoutExercises.length * 3)
        setCompletedSets(0)
        setActiveTab('workout')
      }
      
      // Reset form and clear selected exercises
      setShowCreateProgram(false)
      setProgramEditMode(false)
      setSelectedProgram(null)
      setNewProgramName('')
      setSelectedExercises([])
    } catch (error) {
      console.error('Error saving program:', error)
      alert('Хөтөлбөр хадгалахад алдаа гарлаа')
    }
  }

  const deleteProgramHandler = async (programId: string) => {
    if (!currentUser) return
    
    if (!confirm('Та энэ хөтөлбөрийг устгахдаа итгэлтэй байна уу?')) {
      return
    }
    
    try {
      await deleteProgram(programId, currentUser.id)
      await loadPrograms()
      
      // Reset form if editing deleted program
      if (selectedProgram?.id === programId) {
        setSelectedProgram(null)
        setProgramEditMode(false)
        setShowCreateProgram(false)
        setNewProgramName('')
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      alert('Хөтөлбөр устгахад алдаа гарлаа')
    }
  }

  const startProgram = async (program: any) => {
    if (!currentUser || !program) return
    
    try {
      // Convert program to workout format
      const workoutExercises = program.days
        .filter((day: any) => !day.isRestDay)
        .flatMap((day: any) => 
          day.exercises.map((dayExercise: any) => ({
            exercise: dayExercise.exercise,
            sets: [
              { id: '1', reps: 0, weight: 0, completed: false },
              { id: '2', reps: 0, weight: 0, completed: false },
              { id: '3', reps: 0, weight: 0, completed: false }
            ]
          }))
        )

      if (workoutExercises.length === 0) {
        alert('Энэ хөтөлбөрт дасгал байхгүй байна')
        return
      }

      const workoutExercisesWithSets = workoutExercises.map(we => ({
        exercise: we.exercise,
        sets: we.sets
      }))
      
      setCurrentWorkout(workoutExercisesWithSets)
      setWorkoutStarted(true)
      setTotalSets(workoutExercisesWithSets.length * 3)
      setCompletedSets(0)
      setActiveTab('workout')
    } catch (error) {
      console.error('Error starting program:', error)
      alert('Хөтөлбөрийг эхлүүлэхэд алдаа гарлаа')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('И-мэйл болон нууцэв нэгэлээ оруулна уу')
      return
    }

    try {
      setIsLoggingIn(true)
      
      // Try to find existing user
      const existingUser = await getUser(loginEmail)
      
      if (existingUser) {
        // Simple password check (in production, use proper hashing)
        if (existingUser.email === loginEmail && loginPassword === 'demo123') {
          setCurrentUser(existingUser)
          setIsLoggedIn(true)
          setShowLogin(false)
          setUserEmail(loginEmail)
        } else {
          alert('Нууц үг эсвэл имэйл буруу байна')
        }
      } else {
        // Create new user (in production, add proper validation)
        if (loginPassword === 'demo123') {
          const newUser = await createUser({
            email: loginEmail,
            name: loginEmail.split('@')[0],
            experienceLevel: 'Intermediate'
          })
          
          setCurrentUser(newUser)
          setIsLoggedIn(true)
          setShowLogin(false)
          setUserEmail(loginEmail)
        } else {
          alert('Шинэ хэрэглэгч үүсгэхийн тулд "demo123" нууц үг оруулна уу')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Нэвтрэхдээ алдаа гарлаа')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim() || !loginPassword.trim() || !signUpName.trim()) {
      alert('Бүх талбарыг бөглөнө үү')
      return
    }

    try {
      setIsLoggingIn(true)
      
      // Check if user already exists
      const existingUser = await getUser(loginEmail)
      
      if (existingUser) {
        alert('Энэ и-мэйл хаягаар бүртгэлтэй хэрэглэгч байна')
        setIsLoggingIn(false)
        return
      }
      
      // Create new user
      const newUser = await createUser({
        email: loginEmail,
        name: signUpName,
        experienceLevel: 'Intermediate'
      })
      
      setCurrentUser(newUser)
      setIsLoggedIn(true)
      setShowLogin(false)
      setUserEmail(loginEmail)
      setSignUpName('')
      setLoginPassword('')
      setIsSignUp(false)
      
      alert('Амжилттай бүртгэгдлээ!')
    } catch (error) {
      console.error('Sign up error:', error)
      alert('Бүртгэл үүсгэхэд алдаа гарлаа')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    setShowLogin(true)
    setUserEmail('')
    setLoginPassword('')
    setSignUpName('')
    setIsSignUp(false)
    setShowProfile(false)
  }

  const handleDeleteAccount = async () => {
    if (!currentUser) return
    
    if (!confirm('Та дан бүртгэл устгахдаа итгэлтэй байна уу? Энэ үйлдлийн бүхэн дасгалын мэдээлэл устгах болно.')) {
      return
    }
    
    try {
      // In production, add proper account deletion
      alert('Бүртгэл устгах үйлчилгээ болсонгүй')
      handleLogout()
    } catch (error) {
      console.error('Delete account error:', error)
      alert('Бүртгэл устгахад алдаа гарлаа')
    }
  }

  const exportCurrentWorkout = async () => {
    if (currentWorkout.length === 0) {
      alert('Дасгалын мэдээлэлэл байхгүй байна')
      return
    }

    try {
      const exporter = new PDFExporter()
      const workoutData = PDFExporter.createWorkoutExportData(currentWorkout, workoutTime)
      await exporter.exportWorkout(workoutData)
    } catch (error) {
      console.error('Error exporting workout:', error)
      alert('PDF татахад алдаа гарлаа')
    }
  }

  const exportWorkoutHistory = async () => {
    if (workoutHistory.length === 0) {
      alert('Дасгалын түүх байхгүй байна')
      return
    }

    try {
      const exporter = new PDFExporter()
      
      // Create a combined workout export
      const combinedWorkouts = workoutHistory.map(workout => ({
        workout: {
          id: workout.id,
          date: workout.date,
          notes: workout.notes,
          completed: workout.completed
        },
        exercises: workout.sets?.reduce((acc: any[], set: any) => {
          const existingExercise = acc.find(ex => ex.exerciseId === set.exercise.id)
          if (existingExercise) {
            existingExercise.sets.push({
              reps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
              completed: set.completed,
              order: set.order
            })
          } else {
            acc.push({
              name: set.exercise.name,
              mnName: set.exercise.mnName,
              muscleGroup: set.exercise.muscleGroup,
              equipment: set.exercise.equipment,
              sets: [{
                reps: set.reps,
                weight: set.weight,
                rpe: set.rpe,
                completed: set.completed,
                order: set.order
              }]
            })
          }
          return acc
        }, []) || []
      }))

      // Export each workout to separate PDFs
      for (const workoutData of combinedWorkouts) {
        await exporter.exportWorkout(workoutData)
      }
    } catch (error) {
      console.error('Error exporting workout history:', error)
      alert('PDF татахад алдаа гарлаа')
    }
  }

  const exportAnalytics = async () => {
    if (!analytics || !currentUser) {
      alert('Статистик мэдээлэлэл байхгүй байна')
      return
    }

    try {
      const exporter = new PDFExporter()
      await exporter.exportAnalytics({
        user: {
          name: currentUser.name,
          email: currentUser.email,
          experienceLevel: currentUser.experienceLevel
        },
        period: analyticsPeriod,
        summary: analytics.summary,
        personalRecords: analytics.personalRecords,
        chartData: analytics.chartData
      })
    } catch (error) {
      console.error('Error exporting analytics:', error)
      alert('PDF татахад алдаа гарлаа')
    }
  }

  const loadWorkoutHistory = async () => {
    if (!currentUser) return
    
    try {
      setLoadingHistory(true)
      const workouts = await getWorkouts(currentUser.id)
      setWorkoutHistory(workouts)
    } catch (error) {
      console.error('Error loading workout history:', error)
      setWorkoutHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!currentUser) return
    
    if (confirm('Та энэ дасгалыг устгахдаа итгэлтэй байна уу?')) {
      try {
        await deleteWorkout(workoutId, currentUser.id)
        await loadWorkoutHistory()
        alert('Дасгал амжилттай устгагдлаа')
      } catch (error) {
        console.error('Error deleting workout:', error)
        alert('Дасгал устгахад алдаа гарлаа')
      }
    }
  }

  // Load workout history and programs when user is available and home tab is active
  useEffect(() => {
    if (!mounted) return
    if (currentUser && activeTab === 'home') {
      loadWorkoutHistory()
      loadPrograms()
    }
  }, [mounted, currentUser, activeTab])

  const workoutProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 max-w-md mx-auto">
      {showLogin && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSignUp ? 'Бүртгүүлэх' : 'Нэвтрэх'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isSignUp ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm">И-мэйл</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm">Нууц үг</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Нууц үг"
                    required
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-10" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo: demo@example.com / demo123
                </p>
                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="text-xs p-0 h-auto"
                    onClick={() => setIsSignUp(true)}
                  >
                    Шинэ хэрэглэгч үү? Бүртгүүлэх
                  </Button>
                </div>
              </form>
            ) : (
              // Sign Up Form
              <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="signUpName" className="text-sm">Нэр</Label>
                  <Input
                    id="signUpName"
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Таны нэр"
                    required
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">И-мэйл</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm">Нууц үг</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Нууц үг"
                    required
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-10" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                </Button>
                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="text-xs p-0 h-auto"
                    onClick={() => setIsSignUp(false)}
                  >
                    Аль хэдийн бүртгэлтэй юу? Нэвтрэх
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!showLogin && (
        <>
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Dumbbell className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <span className="hidden sm:inline">Gym Дэвтэр</span>
              <span className="sm:inline md:hidden">Gym</span>
            </h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2 sm:gap-0">
              <p className="text-sm text-muted-foreground">
                Тавтай морил, {currentUser?.name}
              </p>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Гарах
              </Button>
            </div>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6">
          <TabsTrigger value="home" className="text-xs">Нүүр</TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="program" className="text-xs">Хөтөлбөр</TabsTrigger>
          <TabsTrigger value="workout" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Статистик</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs">Профайл</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <div className="space-y-4">
            {!workoutStarted ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      Дасгал эхлүүлэх
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Өнөөдрийн дасгалаа эхлүүлэхийн тулд дасгалуудаа сонгоно уу
                    </p>
                    <div className="space-y-2">
                      {selectedExercises.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 text-center">Дасгал сонгоогүй байна</p>
                      ) : (
                        selectedExercises.map(exercise => (
                          <div key={exercise.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded">
                            <span className="text-sm">{exercise.mnName}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeExerciseFromWorkout(exercise.id)}
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={startWorkout}
                      disabled={selectedExercises.length === 0}
                    >
                      Дасгал эхлүүлэх
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Хурдан сонгох</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exercises.slice(0, 6).map(exercise => (
                        <Button
                          key={exercise.id}
                          variant="outline"
                          size="sm"
                          onClick={() => addExerciseToWorkout(exercise)}
                          disabled={selectedExercises.find(e => e.id === exercise.id) !== undefined}
                          className="text-xs h-auto py-3 px-2 justify-start"
                        >
                          {exercise.mnName}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Дасгалын түүх</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <p className="text-muted-foreground">Ачааллаж байна...</p>
                    ) : workoutHistory.length === 0 ? (
                      <p className="text-muted-foreground">Дасгалын түүх байхгүй байна</p>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                          <p className="text-sm text-muted-foreground">
                            {workoutHistory.length} дасгалын түүх
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportWorkoutHistory}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Бүгдийг PDF</span>
                            <span className="sm:hidden">PDF</span>
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {workoutHistory.map((workout) => (
                            <div key={workout.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {mounted ? new Date(workout.date).toLocaleDateString('mn-MN', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'Түр хүлээнэ үү...'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {workout.sets?.length || 0} сет • {workout.sets?.reduce((acc: number, set: any) => 
                                    acc + (set.completed ? 1 : 0), 0) || 0} гүйцэтгэсэн
                                </div>
                                {workout.notes && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {workout.notes}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWorkout(workout.id)}
                                className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Идэвхитэй дасгал</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(workoutTime)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Прогресс</span>
                      <span>{completedSets}/{totalSets} сет</span>
                    </div>
                    <Progress value={workoutProgress} className="w-full" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={finishWorkout} variant="destructive" className="flex-1">
                      Дасгал дуусгах
                    </Button>
                    <Button onClick={exportCurrentWorkout} variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="workout">
          {workoutStarted && currentWorkout.length > 0 && (
            <div className="space-y-4">
              {currentWorkout.map((workoutExercise, exerciseIndex) => (
                <Card key={workoutExercise.exercise.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{workoutExercise.exercise.mnName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{workoutExercise.exercise.muscleGroup}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workoutExercise.sets.map((set, setIndex) => (
                        <div key={set.id} className="flex items-center gap-2 p-3 border rounded">
                          <Checkbox
                            checked={set.completed}
                            onCheckedChange={() => toggleSet(exerciseIndex, set.id)}
                          />
                          <span className="text-sm font-medium w-12">Сет {setIndex + 1}</span>
                          <Input
                            type="number"
                            placeholder="Давталт"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Input
                            type="number"
                            placeholder="Жин"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm">кг</span>
                          <Input
                            type="number"
                            placeholder="RPE"
                            value={set.rpe || ''}
                            onChange={(e) => updateSet(exerciseIndex, set.id, 'rpe', parseInt(e.target.value) || 0)}
                            className="w-16"
                            min="1"
                            max="10"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, set.id)}
                            disabled={workoutExercise.sets.length <= 1}
                            className="w-8 h-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(exerciseIndex)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Сет нэмэх
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Дасгал хайх</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Дасгалын нэрээр хайх..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Булчирхайн бүлэг сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {group === 'All' ? 'Бүгд' : group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExercises.map(exercise => (
                <Card key={exercise.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{exercise.mnName}</h3>
                        <p className="text-sm text-muted-foreground">{exercise.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {exercise.muscleGroup}
                          </Badge>
                          {exercise.equipment && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.equipment}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addExerciseToWorkout(exercise)}
                        disabled={selectedExercises.find(e => e.id === exercise.id) !== undefined}
                      >
                        {selectedExercises.find(e => e.id === exercise.id) ? 'Нэмсэн' : 'Нэмэх'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <CardTitle>Статистик</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">7 хоног</SelectItem>
                        <SelectItem value="month">1 сар</SelectItem>
                        <SelectItem value="year">1 жил</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAnalytics}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{analytics.summary.totalWorkouts}</div>
                      <p className="text-sm text-muted-foreground">Нийт дасгал</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{analytics.summary.totalSets}</div>
                      <p className="text-sm text-muted-foreground">Сэт</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{analytics.summary.totalVolume}кг</div>
                      <p className="text-sm text-muted-foreground">Нийт жин</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{analytics.summary.completionRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Гүйцэтгэл</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Статистик ачааллаж байна...</p>
                )}
              </CardContent>
            </Card>

            {analytics && analytics.personalRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.personalRecords.slice(0, 5).map((pr, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{pr.exercise.mnName}</span>
                        <Badge variant="secondary">{pr.prWeight}кг</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="program">
          <div className="space-y-4">
            {/* Selected exercises for new program */}
            {selectedExercises.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Сонгосон дасгалууд ({selectedExercises.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedExercises.map(exercise => (
                      <div key={exercise.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{exercise.mnName}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeExerciseFromWorkout(exercise.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-2" 
                    size="sm"
                    onClick={startCreateProgram}
                    disabled={selectedExercises.length === 0}
                  >
                    Эдгээр дасгалаар хөтөлбөр үүсгэх
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startCreateProgram}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Шинэ хөтөлбөр
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPrograms ? (
                  <p className="text-muted-foreground">Ачааллаж байна...</p>
                ) : programs.length === 0 ? (
                  <p className="text-muted-foreground">Хөтөлбөр байхгүй байна</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{program.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {program.days?.length || 0} өдөр • {program.days?.reduce((acc: number, day: any) => 
                              acc + (day.exercises?.length || 0), 0) || 0} дасгал
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditProgram(program)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Засах
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startProgram(program)}
                            className="flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Эхлүүлэх
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProgramHandler(program.id)}
                            className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Program Modal */}
            {(showCreateProgram || programEditMode) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {programEditMode ? 'Хөтөлбөр засах' : 'Шинэ хөтөлбөр'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="programName">Хөтөлбөрийн нэр</Label>
                      <Input
                        id="programName"
                        value={newProgramName}
                        onChange={(e) => setNewProgramName(e.target.value)}
                        placeholder="Хөтөлбөрийн нэрээ оруулна уу"
                        className="w-full"
                      />
                    </div>
                    {programEditMode && selectedProgram && (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          Өдөрүүд ({selectedProgram.days?.length || 0}):
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedProgram.days?.map((day: any, index: number) => (
                            <div key={day.id} className="p-2 bg-muted rounded">
                              <div className="font-medium text-sm">
                                Өдөр {day.dayNumber}: {day.isRestDay ? 'Амрах' : `${day.exercises?.length || 0} дасгал`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {day.exercises?.map((dayExercise: any) => dayExercise.exercise?.mnName).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateProgram(false)
                          setProgramEditMode(false)
                          setSelectedProgram(null)
                          setNewProgramName('')
                        }}
                      >
                        Цуцлах
                      </Button>
                      <Button
                        onClick={saveProgram}
                        disabled={!newProgramName.trim()}
                      >
                        {programEditMode ? 'Хадгалах' : 'Үүсгэх'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Профайл
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Нэр</Label>
                    <Input 
                      id="name" 
                      placeholder="Таны нэр"
                      defaultValue={currentUser?.name || ''}
                      onBlur={(e) => saveUserProfile({ name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Нас</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="Нас"
                        defaultValue={currentUser?.age || ''}
                        onBlur={(e) => saveUserProfile({ age: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Жин (кг)</Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        placeholder="Жин"
                        defaultValue={currentUser?.weight || ''}
                        onBlur={(e) => saveUserProfile({ weight: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="height">Өндөр (см)</Label>
                      <Input 
                        id="height" 
                        type="number" 
                        placeholder="Өндөр"
                        defaultValue={currentUser?.height || ''}
                        onBlur={(e) => saveUserProfile({ height: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">Түвшин</Label>
                      <Select 
                        defaultValue={currentUser?.experienceLevel || 'Intermediate'}
                        onValueChange={(value) => saveUserProfile({ experienceLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Түвшин сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Эхлэгч</SelectItem>
                          <SelectItem value="Intermediate">Дунд</SelectItem>
                          <SelectItem value="Advanced">Дээд</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Хэрэглэгч: {currentUser?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Тохиргоо</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    PDF татах
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}