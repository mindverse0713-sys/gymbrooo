import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface WorkoutExportData {
  workout: {
    id: string
    date: string
    notes?: string
    completed: boolean
  }
  exercises: Array<{
    name: string
    mnName: string
    muscleGroup: string
    equipment?: string
    sets: Array<{
      reps: number
      weight: number
      rpe?: number
      completed: boolean
      order: number
    }>
  }>
}

export interface AnalyticsExportData {
  user: {
    name?: string
    email: string
    experienceLevel?: string
  }
  period: string
  summary: {
    totalWorkouts: number
    totalSets: number
    completedSets: number
    completionRate: number
    totalVolume: number
    averageRPE: number
  }
  personalRecords: Array<{
    exercise: {
      name: string
      mnName: string
      muscleGroup: string
    }
    prWeight: number
  }>
  chartData?: Array<{
    date: string
    count: number
  }>
}

export class PDFExporter {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  async exportWorkout(data: WorkoutExportData): Promise<void> {
    const { workout, exercises } = data

    // Set font to support Mongolian characters
    this.doc.setFont('helvetica')
    
    // Title
    this.doc.setFontSize(20)
    this.doc.text('Gym Дэвтэр - Дасгалын тайлан', 20, 20)
    
    // Workout info
    this.doc.setFontSize(12)
    this.doc.text(`Огноо: ${new Date(workout.date).toLocaleDateString('mn-MN')}`, 20, 40)
    this.doc.text(`Төлөв: ${workout.completed ? 'Дууссан' : 'Дуусаагүй'}`, 20, 50)
    
    if (workout.notes) {
      this.doc.text(`Тэмдэглэл: ${workout.notes}`, 20, 60)
    }

    // Exercises
    let yPosition = 80
    this.doc.setFontSize(16)
    this.doc.text('Дасгалууд:', 20, yPosition)
    yPosition += 15

    exercises.forEach((exercise, index) => {
      this.doc.setFontSize(14)
      this.doc.text(`${index + 1}. ${exercise.mnName}`, 20, yPosition)
      this.doc.setFontSize(10)
      this.doc.text(`Булчирхайн бүлэг: ${exercise.muscleGroup}`, 20, yPosition + 8)
      if (exercise.equipment) {
        this.doc.text(`Хэрэгсэл: ${exercise.equipment}`, 20, yPosition + 16)
      }
      
      // Sets table
      yPosition += 26
      this.doc.setFontSize(10)
      this.doc.text('Сет', 20, yPosition)
      this.doc.text('Давталт', 50, yPosition)
      this.doc.text('Жин (кг)', 90, yPosition)
      this.doc.text('RPE', 130, yPosition)
      this.doc.text('Гүйцэтгэсэн', 160, yPosition)
      
      yPosition += 8
      exercise.sets.forEach(set => {
        this.doc.text(`${set.order}`, 20, yPosition)
        this.doc.text(`${set.reps}`, 50, yPosition)
        this.doc.text(`${set.weight}`, 90, yPosition)
        this.doc.text(`${set.rpe || '-'}`, 130, yPosition)
        this.doc.text(`${set.completed ? '✓' : '○'}`, 160, yPosition)
        yPosition += 6
      })
      
      yPosition += 10
    })

    // Save the PDF
    this.doc.save(`gym-workout-${new Date(workout.date).toISOString().split('T')[0]}.pdf`)
  }

  async exportAnalytics(data: AnalyticsExportData): Promise<void> {
    const { user, period, summary, personalRecords } = data

    // Set font
    this.doc.setFont('helvetica')
    
    // Title
    this.doc.setFontSize(20)
    this.doc.text('Gym Дэвтэр - Статистик тайлан', 20, 20)
    
    // User info
    this.doc.setFontSize(12)
    this.doc.text(`Хэрэглэгч: ${user.name || 'N/A'}`, 20, 40)
    this.doc.text(`И-мэйл: ${user.email}`, 20, 50)
    this.doc.text(`Түвшин: ${user.experienceLevel || 'N/A'}`, 20, 60)
    this.doc.text(`Мөчлөх хугацаа: ${period}`, 20, 70)

    // Summary
    let yPosition = 90
    this.doc.setFontSize(16)
    this.doc.text('Нийтлэг:', 20, yPosition)
    yPosition += 15

    this.doc.setFontSize(12)
    this.doc.text(`Нийт дасгал: ${summary.totalWorkouts}`, 20, yPosition)
    this.doc.text(`Нийт сет: ${summary.totalSets}`, 20, yPosition + 10)
    this.doc.text(`Гүйцэтгэсэн сет: ${summary.completedSets}`, 20, yPosition + 20)
    this.doc.text(`Гүйцэтгэлийн хувь: ${summary.completionRate.toFixed(1)}%`, 20, yPosition + 30)
    this.doc.text(`Нийт жин: ${summary.totalVolume} кг`, 20, yPosition + 40)
    this.doc.text(`Дундаж RPE: ${summary.averageRPE}`, 20, yPosition + 50)

    // Personal Records
    yPosition += 70
    this.doc.setFontSize(16)
    this.doc.text('Personal Records:', 20, yPosition)
    yPosition += 15

    this.doc.setFontSize(12)
    personalRecords.forEach((pr, index) => {
      this.doc.text(`${index + 1}. ${pr.exercise.mnName}`, 20, yPosition)
      this.doc.text(`   PR: ${pr.prWeight} кг`, 20, yPosition + 8)
      yPosition += 18
    })

    // Save the PDF
    this.doc.save(`gym-analytics-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  async exportProgram(data: {
    programName: string
    exercises: Array<{
      dayNumber: number
      exercises: Array<{
        mnName: string
        muscleGroup: string
        equipment?: string
        sets: number
        reps: string
        rest: string
      }>
    }>
  }): Promise<void> {
    const { programName, exercises } = data

    // Set font
    this.doc.setFont('helvetica')
    
    // Title
    this.doc.setFontSize(20)
    this.doc.text('Gym Дэвтэр - Хөтөлбөр', 20, 20)
    
    // Program name
    this.doc.setFontSize(16)
    this.doc.text(`Хөтөлбөр: ${programName}`, 20, 40)

    // Exercises by day
    let yPosition = 70
    exercises.forEach(day => {
      this.doc.setFontSize(14)
      this.doc.text(`Өдөр ${day.dayNumber}:`, 20, yPosition)
      yPosition += 12

      day.exercises.forEach((exercise, index) => {
        this.doc.setFontSize(12)
        this.doc.text(`${index + 1}. ${exercise.mnName}`, 30, yPosition)
        this.doc.setFontSize(10)
        this.doc.text(`   ${exercise.muscleGroup} • ${exercise.sets} сет • ${exercise.reps} давталт • Амрах хугацаа: ${exercise.rest}`, 30, yPosition + 8)
        if (exercise.equipment) {
          this.doc.text(`   Хэрэгсэл: ${exercise.equipment}`, 30, yPosition + 16)
        }
        yPosition += 26
      })
      
      yPosition += 10
    })

    // Save the PDF
    this.doc.save(`gym-program-${programName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  // Utility method to create workout data from current workout state
  static createWorkoutExportData(currentWorkout: any[], workoutTime: number): WorkoutExportData {
    if (currentWorkout.length === 0) {
      throw new Error('No workout data to export')
    }

    return {
      workout: {
        id: 'current',
        date: new Date().toISOString(),
        notes: `Workout completed in ${Math.floor(workoutTime / 60)}:${(workoutTime % 60).toString().padStart(2, '0')}`,
        completed: true
      },
      exercises: currentWorkout.map(we => ({
        name: we.exercise.name,
        mnName: we.exercise.mnName,
        muscleGroup: we.exercise.muscleGroup,
        equipment: we.exercise.equipment,
        sets: we.sets.map((set: any, index: number) => ({
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
          completed: set.completed,
          order: index + 1
        }))
      }))
    }
  }
}