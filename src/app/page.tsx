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
  Calendar,
  User, 
  Play, 
  Clock,
  Download,
  Plus,
  X,
  Trash2,
  ChevronDown,
  LogOut,
  UtensilsCrossed
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
  Analytics,
  getNutritionFromFoodName,
  calculateExerciseRecommendations,
  FoodItem,
  ExerciseRecommendation
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
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set<string>())
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [programEditMode, setProgramEditMode] = useState(false)
  const [newProgramName, setNewProgramName] = useState('')
  const [showCreateProgram, setShowCreateProgram] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [foodAnalysis, setFoodAnalysis] = useState<FoodItem | null>(null)
  const [exerciseRecommendations, setExerciseRecommendations] = useState<ExerciseRecommendation[]>([])
  const [analyzingFood, setAnalyzingFood] = useState(false)

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Зөвхөн зураг оруулна уу')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Зургийн хэмжээ 5MB-аас их байна')
      return
    }

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        saveUserProfile({ profileImage: base64String })
      }
      reader.onerror = () => {
        alert('Зураг уншихад алдаа гарлаа')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Зураг оруулахад алдаа гарлаа')
    }
  }

  const handleFoodNameSubmit = async () => {
    if (!foodName.trim()) {
      alert('Хоолны нэрийг оруулна уу')
      return
    }

    setAnalyzingFood(true)
    try {
      const nutrition = await getNutritionFromFoodName(foodName)
      if (nutrition) {
        setFoodAnalysis(nutrition)
        const recommendations = calculateExerciseRecommendations(nutrition.calories)
        setExerciseRecommendations(recommendations)
      } else {
        alert('Хоолны мэдээлэл олдсонгүй')
      }
    } catch (error) {
      console.error('Error analyzing food:', error)
      alert('Хоолны мэдээлэл авахад алдаа гарлаа')
    } finally {
      setAnalyzingFood(false)
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
          {/* Login Header Image */}
          <div className="w-full h-48 sm:h-56 overflow-hidden rounded-t-lg relative">
            <img 
              src="/images/login-header.png" 
              alt="Gym Login"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
          </div>
          
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
          {/* Header */}
          <div className="mb-6 glass-card rounded-lg border border-border/50 backdrop-blur-lg">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Left side - Logo and Text */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-lg text-foreground">Gym</span>
              </div>
              
              {/* Right side - Profile Picture */}
              <div className="relative">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="relative w-10 h-10 rounded-full overflow-hidden border border-border bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser?.name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop Tabs */}
        <TabsList className="hidden sm:grid sm:grid-cols-5 mb-6">
          <TabsTrigger value="home" className="text-xs">Нүүр</TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="program" className="text-xs">Хөтөлбөр</TabsTrigger>
          <TabsTrigger value="workout" className="text-xs">Дасгал</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Статистик</TabsTrigger>
        </TabsList>
        
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-card/95 backdrop-blur-lg border-t border-border z-50">
          <div className="grid grid-cols-4 w-full max-w-md mx-auto relative">
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
              <Calendar className="w-5 h-5 mb-1" />
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
                            {/* Exercise image/icon */}
                            {exercise.name.toLowerCase().includes('bench press') || exercise.mnName.toLowerCase().includes('bench press') ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/bench-press.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Chest' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/chest-exercise.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Shoulders' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/shoulder-press.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Legs' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/leg-squat.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Arms' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/arm-curl.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Back' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/back-exercise.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Cardio' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/cardio-exercise.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Core' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/core-exercise.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : exercise.muscleGroup === 'Full Body' ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative mx-auto mb-2">
                                <img 
                                  src="/images/full-body-exercise.png" 
                                  alt={exercise.mnName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              </div>
                            ) : (
                              <div className="icon-circle mx-auto mb-2">
                                <Dumbbell className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                            )}
                            <div className="text-xs font-medium text-primary mb-1">{exercise.muscleGroup}</div>
                            <div className="text-sm font-semibold">{exercise.mnName}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Food/Nutrition Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
                      Хоолны калори тооцоолох
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Food Name Input */}
                      <div>
                        <Label htmlFor="foodNameHome">Хоолны нэр оруулах</Label>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            id="foodNameHome" 
                            placeholder="Жишээ: apple, chicken breast, rice"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleFoodNameSubmit()}
                          />
                          <Button 
                            onClick={handleFoodNameSubmit}
                            disabled={analyzingFood || !foodName.trim()}
                          >
                            {analyzingFood ? 'Тооцоолж байна...' : 'Тооцоолох'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Хоолны нэрийг англи хэлээр оруулна уу
                        </p>
                      </div>

                      {/* Analysis Results */}
                      {analyzingFood && (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">Хоолны мэдээлэл тооцоолж байна...</p>
                        </div>
                      )}

                      {foodAnalysis && (
                        <div className="space-y-3">
                          <div className="glass-card border border-border/50 rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-3">{foodAnalysis.food}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="text-center">
                                <div className="text-xl font-bold text-primary">{foodAnalysis.calories}</div>
                                <p className="text-xs text-muted-foreground">Калори</p>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-primary">{foodAnalysis.protein}г</div>
                                <p className="text-xs text-muted-foreground">Уураг</p>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-primary">{foodAnalysis.carbs}г</div>
                                <p className="text-xs text-muted-foreground">Нүүрс ус</p>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-primary">{foodAnalysis.fat}г</div>
                                <p className="text-xs text-muted-foreground">Өөх тос</p>
                              </div>
                            </div>
                          </div>

                          {/* Exercise Recommendations */}
                          {exerciseRecommendations.length > 0 && (
                            <div className="border border-border/50 rounded-lg p-4">
                              <h5 className="font-medium mb-2">Дасгалын зөвлөмж</h5>
                              <p className="text-xs text-muted-foreground mb-3">
                                {foodAnalysis.calories} калори шатаахын тулд:
                              </p>
                              <div className="space-y-2">
                                {exerciseRecommendations.slice(0, 3).map((rec, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                  >
                                    <span className="font-medium">{rec.exercise}</span>
                                    <Badge className="bg-primary text-primary-foreground text-xs">
                                      {rec.duration} мин
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                            {/* Quick Select Buttons for Reps */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[5, 8, 10, 12, 15, 20].map((repValue) => (
                                <button
                                  key={repValue}
                                  type="button"
                                  onClick={() => updateSet(exerciseIndex, set.id, 'reps', repValue)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    set.reps === repValue
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }`}
                                >
                                  {repValue}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Weight Input */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Жин (кг)
                            </label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateSet(exerciseIndex, set.id, 'weight', Math.max(0, (set.weight || 0) - 5))}
                                className="h-12 flex-1 border-border hover:bg-primary/10 hover:border-primary rounded-lg"
                              >
                                <span className="text-lg font-bold">-5</span>
                              </Button>
                              <div
                                className="h-12 flex-1 flex items-center justify-center bg-muted/50 border border-border rounded-lg cursor-pointer select-none touch-none"
                                onTouchStart={(e) => {
                                  const touch = e.touches[0]
                                  const startX = touch.clientX
                                  const startWeight = set.weight || 0
                                  e.currentTarget.setAttribute('data-touch-start-x', startX.toString())
                                  e.currentTarget.setAttribute('data-touch-start-weight', startWeight.toString())
                                  e.currentTarget.setAttribute('data-touch-last-updated', '0')
                                }}
                                onTouchMove={(e) => {
                                  e.preventDefault()
                                  const startX = parseFloat(e.currentTarget.getAttribute('data-touch-start-x') || '0')
                                  const startWeight = parseFloat(e.currentTarget.getAttribute('data-touch-start-weight') || '0')
                                  const lastUpdated = parseFloat(e.currentTarget.getAttribute('data-touch-last-updated') || '0')
                                  const touch = e.touches[0]
                                  const currentX = touch.clientX
                                  const totalDiff = currentX - startX
                                  const threshold = 30 // Update every 30px
                                  const steps = Math.floor(Math.abs(totalDiff) / threshold)
                                  
                                  if (steps !== lastUpdated && steps > 0) {
                                    const direction = totalDiff > 0 ? 1 : -1
                                    const newWeight = Math.max(0, startWeight + (direction * steps * 5))
                                    
                                    updateSet(exerciseIndex, set.id, 'weight', newWeight)
                                    e.currentTarget.setAttribute('data-touch-last-updated', steps.toString())
                                  }
                                }}
                                onTouchEnd={(e) => {
                                  e.currentTarget.removeAttribute('data-touch-start-x')
                                  e.currentTarget.removeAttribute('data-touch-start-weight')
                                  e.currentTarget.removeAttribute('data-touch-last-updated')
                                }}
                                onMouseDown={(e) => {
                                  const startX = e.clientX
                                  const startWeight = set.weight || 0
                                  e.currentTarget.setAttribute('data-mouse-start-x', startX.toString())
                                  e.currentTarget.setAttribute('data-mouse-start-weight', startWeight.toString())
                                  e.currentTarget.setAttribute('data-mouse-last-updated', '0')
                                  e.currentTarget.setAttribute('data-is-dragging', 'true')
                                  e.preventDefault()
                                }}
                                onMouseMove={(e) => {
                                  if (e.currentTarget.getAttribute('data-is-dragging') === 'true') {
                                    e.preventDefault()
                                    const startX = parseFloat(e.currentTarget.getAttribute('data-mouse-start-x') || '0')
                                    const startWeight = parseFloat(e.currentTarget.getAttribute('data-mouse-start-weight') || '0')
                                    const lastUpdated = parseFloat(e.currentTarget.getAttribute('data-mouse-last-updated') || '0')
                                    const currentX = e.clientX
                                    const totalDiff = currentX - startX
                                    const threshold = 30
                                    const steps = Math.floor(Math.abs(totalDiff) / threshold)
                                    
                                    if (steps !== lastUpdated && steps > 0) {
                                      const direction = totalDiff > 0 ? 1 : -1
                                      const newWeight = Math.max(0, startWeight + (direction * steps * 5))
                                      
                                      updateSet(exerciseIndex, set.id, 'weight', newWeight)
                                      e.currentTarget.setAttribute('data-mouse-last-updated', steps.toString())
                                    }
                                  }
                                }}
                                onMouseUp={(e) => {
                                  e.currentTarget.removeAttribute('data-mouse-start-x')
                                  e.currentTarget.removeAttribute('data-mouse-start-weight')
                                  e.currentTarget.removeAttribute('data-mouse-last-updated')
                                  e.currentTarget.removeAttribute('data-is-dragging')
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.removeAttribute('data-mouse-start-x')
                                  e.currentTarget.removeAttribute('data-mouse-start-weight')
                                  e.currentTarget.removeAttribute('data-mouse-last-updated')
                                  e.currentTarget.removeAttribute('data-is-dragging')
                                }}
                              >
                                <span className="text-lg font-medium">{set.weight || 0}</span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateSet(exerciseIndex, set.id, 'weight', (set.weight || 0) + 5)}
                                className="h-12 flex-1 border-border hover:bg-primary/10 hover:border-primary rounded-lg"
                              >
                                <span className="text-lg font-bold">+5</span>
                              </Button>
                            </div>
                            {/* Quick Select Buttons for Weight */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[5, 10, 15, 20, 25, 30, 40, 50].map((weightValue) => (
                                <button
                                  key={weightValue}
                                  type="button"
                                  onClick={() => updateSet(exerciseIndex, set.id, 'weight', weightValue)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    set.weight === weightValue
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }`}
                                >
                                  {weightValue}кг
                                </button>
                              ))}
                            </div>
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
                            {/* Quick Select Buttons for RPE */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[6, 7, 8, 9, 10].map((rpeValue) => (
                                <button
                                  key={rpeValue}
                                  type="button"
                                  onClick={() => updateSet(exerciseIndex, set.id, 'rpe', rpeValue)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    set.rpe === rpeValue
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }`}
                                >
                                  {rpeValue}
                                </button>
                              ))}
                            </div>
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
                      {/* Exercise image/icon */}
                      {exercise.name.toLowerCase().includes('bench press') || exercise.mnName.toLowerCase().includes('bench press') ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/bench-press.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Chest' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/chest-exercise.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Shoulders' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/shoulder-press.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Legs' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/leg-squat.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Arms' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/arm-curl.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Back' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/back-exercise.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Cardio' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/cardio-exercise.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Core' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/core-exercise.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : exercise.muscleGroup === 'Full Body' ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30 relative">
                          <img 
                            src="/images/full-body-exercise.png" 
                            alt={exercise.mnName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        <div className="icon-circle flex-shrink-0">
                          <Dumbbell className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                      )}
                      
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
                  <div className="space-y-6">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="glass-card p-4 rounded-lg border border-border/50 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{analytics.summary.totalWorkouts}</div>
                        <p className="text-sm text-muted-foreground">Нийт дасгал</p>
                        {analytics.summary.totalWorkouts > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {analyticsPeriod === 'week' 
                              ? `${analytics.summary.totalWorkouts} дасгал/долоо хоног`
                              : analyticsPeriod === 'month'
                              ? `${(analytics.summary.totalWorkouts / 4).toFixed(1)} дасгал/долоо хоног`
                              : `${(analytics.summary.totalWorkouts / 52).toFixed(1)} дасгал/долоо хоног`
                            }
                          </p>
                        )}
                      </div>
                      <div className="glass-card p-4 rounded-lg border border-border/50 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{analytics.summary.totalSets}</div>
                        <p className="text-sm text-muted-foreground">Нийт сет</p>
                        {analytics.summary.totalSets > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {analytics.summary.completedSets} гүйцэтгэсэн
                          </p>
                        )}
                      </div>
                      <div className="glass-card p-4 rounded-lg border border-border/50 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{analytics.summary.totalVolume.toFixed(0)}</div>
                        <p className="text-sm text-muted-foreground">Нийт жин (кг)</p>
                        {analytics.summary.totalWorkouts > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Дундаж: {(analytics.summary.totalVolume / analytics.summary.totalWorkouts).toFixed(0)}кг/дасгал
                          </p>
                        )}
                      </div>
                      <div className="glass-card p-4 rounded-lg border border-border/50 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{analytics.summary.completionRate.toFixed(1)}%</div>
                        <p className="text-sm text-muted-foreground">Гүйцэтгэл</p>
                        {analytics.summary.totalSets > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {analytics.summary.completedSets}/{analytics.summary.totalSets} сет
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional Detailed Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Дундаж RPE</span>
                          <span className="text-lg font-semibold">{analytics.summary.averageRPE > 0 ? analytics.summary.averageRPE.toFixed(1) : '-'}</span>
                        </div>
                        {analytics.summary.averageRPE > 0 && (
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(analytics.summary.averageRPE / 10) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {analytics.summary.totalWorkouts > 0 && (
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Дундаж сет/дасгал</span>
                              <span className="text-lg font-semibold">{(analytics.summary.totalSets / analytics.summary.totalWorkouts).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Дундаж жин/сет</span>
                              <span className="text-lg font-semibold">
                                {analytics.summary.totalSets > 0 
                                  ? (analytics.summary.totalVolume / analytics.summary.completedSets).toFixed(1)
                                  : '0'
                                }кг
                              </span>
                            </div>
                          </div>
                        </>
                      )}
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
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Дасгалын дэлгэрэнгүй мэдээлэл ({analytics.detailedExercises.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.detailedExercises.map((ex, index) => (
                      <div key={index} className="glass-card border border-border/50 rounded-lg p-4 space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-foreground">{ex.exercise.mnName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {ex.exercise.muscleGroup}
                              </Badge>
                              {ex.exercise.equipment && (
                                <Badge variant="outline" className="text-xs">
                                  {ex.exercise.equipment}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1">
                            {ex.workoutCount} удаа хийсэн
                          </Badge>
                        </div>

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Нийт сет</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold text-primary">{ex.completedSets}</span>
                              <span className="text-sm text-muted-foreground">/{ex.totalSets}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${ex.totalSets > 0 ? (ex.completedSets / ex.totalSets) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Нийт жин</p>
                            <div className="text-xl font-bold text-primary">{ex.totalVolume.toFixed(0)}кг</div>
                            {ex.workoutCount > 0 && (
                              <p className="text-xs text-muted-foreground/70">
                                {(ex.totalVolume / ex.workoutCount).toFixed(0)}кг/дасгал
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Дундаж жин</p>
                            <div className="text-xl font-bold text-primary">{ex.avgWeight.toFixed(1)}кг</div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Хамгийн их жин</p>
                            <div className="flex items-center gap-1">
                              <span className="text-xl font-bold text-primary">{ex.maxWeight}кг</span>
                              {ex.maxWeight > ex.avgWeight && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                                  PR
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Дундаж давталт</p>
                            <div className="text-xl font-bold text-primary">{ex.avgReps.toFixed(1)}</div>
                          </div>

                          {ex.avgRPE > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Дундаж RPE</p>
                              <div className="text-xl font-bold text-primary">{ex.avgRPE.toFixed(1)}</div>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                                <div 
                                  className="bg-primary h-1.5 rounded-full transition-all"
                                  style={{ width: `${(ex.avgRPE / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Stats */}
                        {ex.completedSets > 0 && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Дундаж жин/сет:</span>
                                <span className="ml-2 font-medium">{(ex.totalVolume / ex.completedSets).toFixed(1)}кг</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Гүйцэтгэл:</span>
                                <span className="ml-2 font-medium">{((ex.completedSets / ex.totalSets) * 100).toFixed(0)}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Дундаж сет/дасгал:</span>
                                <span className="ml-2 font-medium">{(ex.totalSets / ex.workoutCount).toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Хамгийн их жин/сет:</span>
                                <span className="ml-2 font-medium">{ex.maxWeight}кг</span>
                              </div>
                            </div>
                          </div>
                        )}
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
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Personal Records ({analytics.personalRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analytics.personalRecords.map((pr, index) => (
                      <div key={index} className="glass-card border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base truncate">{pr.exercise.mnName}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{pr.exercise.muscleGroup}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-base px-3 py-1">
                              {pr.prWeight}кг
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">Хамгийн их</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {analytics.personalRecords.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Ердөө {analytics.personalRecords.length} personal record харуулж байна
                    </p>
                  )}
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
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border bg-muted/50 flex items-center justify-center">
                        {currentUser?.profileImage ? (
                          <img
                            src={currentUser.profileImage}
                            alt={currentUser?.name || 'Profile'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      <Label htmlFor="avatarUpload">Профайл зураг</Label>
                      <Input 
                        id="avatarUpload" 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Зургаа сонгоно уу (JPG, PNG, max 5MB)
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Нэр</Label>
                    <Input 
                      id="name" 
                      placeholder="Таны нэр"
                      defaultValue={currentUser?.name || ''}
                      onBlur={(e) => saveUserProfile({ name: e.target.value.trim() || undefined })}
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
                        onBlur={(e) => {
                          const value = e.target.value.trim()
                          saveUserProfile({ age: value ? parseInt(value) : undefined })
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Хүйс</Label>
                      <Select 
                        defaultValue={currentUser?.gender || ''}
                        onValueChange={(value) => saveUserProfile({ gender: value || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Хүйс сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Эр</SelectItem>
                          <SelectItem value="Female">Эм</SelectItem>
                          <SelectItem value="Other">Бусад</SelectItem>
                        </SelectContent>
                      </Select>
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
                        onBlur={(e) => {
                          const value = e.target.value.trim()
                          saveUserProfile({ height: value ? parseFloat(value) : undefined })
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Жин (кг)</Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        placeholder="Жин"
                        defaultValue={currentUser?.weight || ''}
                        onBlur={(e) => {
                          const value = e.target.value.trim()
                          saveUserProfile({ weight: value ? parseFloat(value) : undefined })
                        }}
                      />
                    </div>
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
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Гарах
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Хоолны калори тооцоолох
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Food Name Input */}
                  <div>
                    <Label htmlFor="foodName">Хоолны нэр оруулах</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        id="foodName" 
                        placeholder="Жишээ: apple, chicken breast, rice"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFoodNameSubmit()}
                      />
                      <Button 
                        onClick={handleFoodNameSubmit}
                        disabled={analyzingFood || !foodName.trim()}
                      >
                        {analyzingFood ? 'Тооцоолж байна...' : 'Тооцоолох'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Хоолны нэрийг англи хэлээр оруулна уу
                    </p>
                  </div>

                  {/* Analysis Results */}
                  {analyzingFood && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Хоолны мэдээлэл тооцоолж байна...</p>
                    </div>
                  )}

                  {foodAnalysis && (
                    <div className="space-y-4">
                      <Card className="glass-card border border-border/50">
                        <CardHeader>
                          <CardTitle className="text-lg">{foodAnalysis.food}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{foodAnalysis.calories}</div>
                              <p className="text-sm text-muted-foreground">Калори</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{foodAnalysis.protein}г</div>
                              <p className="text-sm text-muted-foreground">Уураг</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{foodAnalysis.carbs}г</div>
                              <p className="text-sm text-muted-foreground">Нүүрс ус</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{foodAnalysis.fat}г</div>
                              <p className="text-sm text-muted-foreground">Өөх тос</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Exercise Recommendations */}
                      {exerciseRecommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Дасгалын зөвлөмж</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {foodAnalysis.calories} калори шатаахын тулд:
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {exerciseRecommendations.slice(0, 5).map((rec, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{rec.exercise}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {rec.duration} минут
                                    </div>
                                  </div>
                                  <Badge className="bg-primary text-primary-foreground">
                                    {rec.caloriesBurned} калори
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
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