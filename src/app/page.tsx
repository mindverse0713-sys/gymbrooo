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
  Trash2,
  ChevronDown
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
  login,
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
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
        
        // Check if user is stored in localStorage
        const storedUserEmail = localStorage.getItem('gym_user_email')
        if (storedUserEmail) {
          try {
            const userData = await getUser(storedUserEmail)
            if (userData) {
              setCurrentUser(userData)
              setIsLoggedIn(true)
              setShowLogin(false)
              setUserEmail(storedUserEmail)
              return // User found, don't create new one
            }
          } catch (error) {
            console.error('Error loading stored user:', error)
            // Clear invalid stored email
            localStorage.removeItem('gym_user_email')
          }
        }
        
        // No stored user, show login
        setShowLogin(true)
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
      alert('И-мэйл болон нууц үг оруулна уу')
      return
    }

    try {
      setIsLoggingIn(true)
      
      // Login with email and password
      const user = await login(loginEmail, loginPassword)
      setCurrentUser(user)
      setIsLoggedIn(true)
      setShowLogin(false)
      setUserEmail(loginEmail)
      setLoginPassword('')
      
      // Save user email to localStorage
      localStorage.setItem('gym_user_email', loginEmail)
    } catch (error: any) {
      console.error('Login error:', error)
      alert(error.message || 'Нэвтрэхдээ алдаа гарлаа')
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

    if (loginPassword.length < 6) {
      alert('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой')
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
      
      // Create new user with password
      const newUser = await createUser({
        email: loginEmail,
        password: loginPassword,
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
      
      // Save user email to localStorage
      localStorage.setItem('gym_user_email', loginEmail)
      
      alert('Амжилттай бүртгэгдлээ!')
    } catch (error: any) {
      console.error('Sign up error:', error)
      // Try to get error message from response
      let errorMessage = 'Бүртгэл үүсгэхэд алдаа гарлаа'
      try {
        if (error.response) {
          const errorData = await error.response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } else if (error.message) {
          errorMessage = error.message
        }
      } catch (e) {
        // If we can't parse error, use default message
      }
      alert(errorMessage)
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
    
    // Clear stored user email
    localStorage.removeItem('gym_user_email')
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
    } catch (error: any) {
      console.error('Error exporting workout:', error)
      const errorMessage = error?.message || 'PDF татахад алдаа гарлаа'
      alert(errorMessage)
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

  // Load workout history when stats tab is active
  useEffect(() => {
    if (!mounted) return
    if (currentUser && activeTab === 'stats' && workoutHistory.length === 0) {
      loadWorkoutHistory()
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
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 max-w-md mx-auto pb-20 sm:pb-4">
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
                    className="h-12 sm:h-10 text-base sm:text-sm"
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
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-12 sm:h-10 text-base sm:text-sm" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                </Button>
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
                    className="h-12 sm:h-10 text-base sm:text-sm"
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
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="signUpPassword" className="text-sm">Нууц үг</Label>
                  <Input
                    id="signUpPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Хамгийн багадаа 6 тэмдэгт"
                    required
                    minLength={6}
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-12 sm:h-10 text-base sm:text-sm" disabled={isLoggingIn}>
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
        {/* Desktop Tabs */}
        <TabsList className="hidden sm:grid sm:grid-cols-6 mb-6">
          <TabsTrigger value="home" className="text-xs">Нүүр</TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="program" className="text-xs">Хөтөлбөр</TabsTrigger>
          <TabsTrigger value="workout" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Статистик</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs">Профайл</TabsTrigger>
        </TabsList>
        
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-card/95 backdrop-blur-lg border-t border-border z-50">
          <div className="grid grid-cols-5 w-full max-w-md mx-auto relative">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs">Нүүр</span>
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`relative flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === 'exercises' ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {activeTab === 'exercises' && (
                <div className="absolute -top-2 w-12 h-12 rounded-full bg-primary border-2 border-primary shadow-lg green-glow flex items-center justify-center">
                  <Play className="w-5 h-5 fill-primary-foreground" />
                </div>
              )}
              {activeTab !== 'exercises' && (
                <>
                  <Play className="w-5 h-5 mb-1" />
                  <span className="text-xs">Дасгал</span>
                </>
              )}
              {activeTab === 'exercises' && (
                <span className="text-xs mt-8">Дасгал</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('program')}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === 'program' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-1" />
              <span className="text-xs">Хөтөлбөр</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === 'stats' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-1" />
              <span className="text-xs">Стат</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Профайл</span>
            </button>
          </div>
        </div>
        
        {/* Mobile workout tab button - floating */}
        {workoutStarted && (
          <div className="sm:hidden fixed bottom-20 right-4 z-40">
            <Button
              onClick={() => setActiveTab('workout')}
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg"
            >
              <Play className="w-6 h-6" />
            </Button>
          </div>
        )}

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

                <div>
                  <h3 className="text-lg font-semibold mb-3">Хурдан сонгох</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {exercises.slice(0, 6).map(exercise => {
                      const isSelected = selectedExercises.find(e => e.id === exercise.id) !== undefined
                      return (
                        <div
                          key={exercise.id}
                          className={`flex-shrink-0 w-32 glass-card rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected ? 'border-2 border-primary' : 'border border-border'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              removeExerciseFromWorkout(exercise.id)
                            } else {
                              addExerciseToWorkout(exercise)
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="icon-circle mx-auto mb-2">
                              <Dumbbell className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="text-xs font-medium text-primary mb-1">{exercise.muscleGroup}</div>
                            <div className="text-sm font-semibold">{exercise.mnName}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={finishWorkout} variant="destructive" className="flex-1 h-12 sm:h-10 text-base sm:text-sm">
                      Дасгал дуусгах
                    </Button>
                    <Button onClick={exportCurrentWorkout} variant="outline" className="flex items-center justify-center gap-2 h-12 sm:h-10 text-base sm:text-sm">
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
            <div className="space-y-6">
              {currentWorkout.map((workoutExercise, exerciseIndex) => (
                <div key={workoutExercise.exercise.id} className="space-y-4">
                  {/* Exercise Header */}
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-foreground mb-1">
                      {workoutExercise.exercise.mnName}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {workoutExercise.exercise.muscleGroup}
                    </p>
                  </div>

                  {/* Sets */}
                  <div className="space-y-4">
                    {workoutExercise.sets.map((set, setIndex) => (
                      <div 
                        key={set.id} 
                        className="glass-card rounded-xl p-5 space-y-4 border border-border/50"
                      >
                        {/* Set Header */}
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={set.completed}
                            onCheckedChange={() => toggleSet(exerciseIndex, set.id)}
                            className="w-6 h-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-lg font-semibold">Сет {setIndex + 1}</span>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Reps Input */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Давталт
                            </label>
                            <Input
                              type="number"
                              placeholder="Давталт"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                              className="h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary"
                              inputMode="numeric"
                            />
                          </div>

                          {/* Weight Input */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Жин (кг)
                            </label>
                            <Input
                              type="number"
                              placeholder="Жин"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary"
                              inputMode="decimal"
                            />
                          </div>

                          {/* RPE Input */}
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              RPE
                            </label>
                            <Input
                              type="number"
                              placeholder="RPE"
                              value={set.rpe || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'rpe', parseInt(e.target.value) || 0)}
                              className="h-12 text-base bg-muted/50 border-border focus:border-primary focus:ring-primary"
                              min="1"
                              max="10"
                              inputMode="numeric"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, set.id)}
                            disabled={workoutExercise.sets.length <= 1}
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Устгах
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Set Button */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => addSet(exerciseIndex)}
                      className="w-full h-12 text-base border-primary/30 hover:bg-primary/10 hover:border-primary"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Сет нэмэх
                    </Button>
                  </div>
                </div>
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredExercises.map(exercise => {
                const isSelected = selectedExercises.find(e => e.id === exercise.id) !== undefined
                return (
                  <div 
                    key={exercise.id} 
                    className={`glass-card rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected ? 'border-primary border-2' : 'border border-border'
                    } hover:border-primary/50`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Circular icon */}
                      <div className="icon-circle flex-shrink-0">
                        <Dumbbell className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      
                      {/* Exercise info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground">{exercise.mnName}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{exercise.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className="text-xs bg-primary text-primary-foreground border-0">
                            {exercise.muscleGroup}
                          </Badge>
                          {exercise.equipment && (
                            <Badge variant="outline" className="text-xs bg-muted/50">
                              {exercise.equipment}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Add button */}
                      <Button
                        size="sm"
                        onClick={() => addExerciseToWorkout(exercise)}
                        disabled={isSelected}
                        className={`${isSelected ? 'bg-primary/20 text-primary border border-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'} flex items-center gap-1.5`}
                      >
                        <Plus className="w-4 h-4" />
                        {isSelected ? 'Нэмсэн' : 'Нэмэх'}
                      </Button>
                    </div>
                  </div>
                )
              })}
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

            {analytics && analytics.detailedExercises && analytics.detailedExercises.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Дасгалын дэлгэрэнгүй мэдээлэл</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.detailedExercises.map((ex, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{ex.exercise.mnName}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{ex.exercise.muscleGroup}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {ex.workoutCount} дасгал
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Нийт сет:</span>
                            <div className="font-medium">{ex.completedSets}/{ex.totalSets}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Нийт жин:</span>
                            <div className="font-medium">{ex.totalVolume.toFixed(0)}кг</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Дундаж жин:</span>
                            <div className="font-medium">{ex.avgWeight.toFixed(1)}кг</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Хамгийн их жин:</span>
                            <div className="font-medium">{ex.maxWeight}кг</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Дундаж давталт:</span>
                            <div className="font-medium">{ex.avgReps.toFixed(1)}</div>
                          </div>
                          {ex.avgRPE > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs">Дундаж RPE:</span>
                              <div className="font-medium">{ex.avgRPE.toFixed(1)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workout History by Month and Day */}
            {workoutHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Дасгалын түүх (Сар, Өдөр)</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Group workouts by month and day
                    const groupedByMonth: { [key: string]: { [key: string]: any[] } } = {}
                    
                    workoutHistory.forEach((workout) => {
                      const date = new Date(workout.date)
                      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                      const day = String(date.getDate()).padStart(2, '0')
                      const dateKey = `${yearMonth}-${day}`
                      
                      if (!groupedByMonth[yearMonth]) {
                        groupedByMonth[yearMonth] = {}
                      }
                      if (!groupedByMonth[yearMonth][dateKey]) {
                        groupedByMonth[yearMonth][dateKey] = []
                      }
                      groupedByMonth[yearMonth][dateKey].push(workout)
                    })

                    // Sort months (newest first)
                    const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a))

                    return (
                      <div className="space-y-2">
                        {sortedMonths.map((yearMonth) => {
                          const monthDate = new Date(yearMonth + '-01')
                          const monthName = monthDate.toLocaleDateString('mn-MN', { month: 'long', year: 'numeric' })
                          const isExpanded = expandedMonths.has(yearMonth)
                          const days = Object.keys(groupedByMonth[yearMonth]).sort((a, b) => b.localeCompare(a))

                          return (
                            <div key={yearMonth} className="border rounded-lg">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedMonths)
                                  if (isExpanded) {
                                    newExpanded.delete(yearMonth)
                                  } else {
                                    newExpanded.add(yearMonth)
                                  }
                                  setExpandedMonths(newExpanded)
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                              >
                                <div className="font-semibold">{monthName}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">{days.length} өдөр</span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </button>
                              
                              {isExpanded && (
                                <div className="border-t">
                                  {days.map((dateKey) => {
                                    const workoutsForDay = groupedByMonth[yearMonth][dateKey]
                                    const dayDate = new Date(dateKey + 'T00:00:00')
                                    const dayName = dayDate.toLocaleDateString('mn-MN', { weekday: 'short', day: 'numeric' })
                                    const isSelected = selectedDate === dateKey
                                    
                                    // Calculate day stats
                                    const daySets = workoutsForDay.flatMap((w: any) => w.sets || [])
                                    const completedSets = daySets.filter((s: any) => s.completed).length
                                    const totalVolume = daySets.reduce((acc: number, s: any) => 
                                      acc + (s.completed ? s.weight * s.reps : 0), 0)

                                    return (
                                      <div key={dateKey} className="border-b last:border-b-0">
                                        <button
                                          onClick={() => {
                                            setSelectedDate(isSelected ? null : dateKey)
                                          }}
                                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">{dayName}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {workoutsForDay.length} дасгал • {completedSets} сет • {totalVolume.toFixed(0)}кг
                                            </div>
                                          </div>
                                          <ChevronDown className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isSelected && (
                                          <div className="p-3 bg-muted/20 space-y-3">
                                            {workoutsForDay.map((workout: any) => {
                                              // Group sets by exercise
                                              const exerciseGroups = new Map()
                                              workout.sets?.forEach((set: any) => {
                                                if (!set.exercise) return
                                                const exId = set.exercise.id
                                                if (!exerciseGroups.has(exId)) {
                                                  exerciseGroups.set(exId, {
                                                    exercise: set.exercise,
                                                    sets: []
                                                  })
                                                }
                                                exerciseGroups.get(exId).sets.push(set)
                                              })

                                              return (
                                                <div key={workout.id} className="border rounded p-2 bg-background">
                                                  <div className="text-xs text-muted-foreground mb-2">
                                                    {new Date(workout.date).toLocaleTimeString('mn-MN', { 
                                                      hour: '2-digit', 
                                                      minute: '2-digit' 
                                                    })}
                                                  </div>
                                                  {Array.from(exerciseGroups.values()).map((group, idx) => (
                                                    <div key={idx} className="mb-2 last:mb-0">
                                                      <div className="font-medium text-sm">{group.exercise.mnName}</div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {group.sets.filter((s: any) => s.completed).length}/{group.sets.length} сет гүйцэтгэсэн
                                                      </div>
                                                      <div className="flex gap-2 flex-wrap mt-1">
                                                        {group.sets.map((set: any, setIdx: number) => (
                                                          <span 
                                                            key={setIdx}
                                                            className={`text-xs px-1.5 py-0.5 rounded ${
                                                              set.completed 
                                                                ? 'bg-primary/20 text-primary' 
                                                                : 'bg-muted text-muted-foreground'
                                                            }`}
                                                          >
                                                            {set.weight}кг × {set.reps}
                                                            {set.rpe && ` (RPE ${set.rpe})`}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  ))}
                                                  {workout.notes && (
                                                    <div className="text-xs text-muted-foreground mt-2 italic">
                                                      {workout.notes}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

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