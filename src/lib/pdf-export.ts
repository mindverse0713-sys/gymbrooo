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

    // Set font
    this.doc.setFont('helvetica')
    
    // Header with background color
    this.doc.setFillColor(59, 130, 246) // Blue background
    this.doc.rect(0, 0, 210, 40, 'F')
    
    // Title (white text on blue background)
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('💪 Gym Дэвтэр', 105, 20, { align: 'center' })
    
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Дасгалын Тайлан', 105, 32, { align: 'center' })
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0)
    
    let yPosition = 50
    
    // Workout info box
    this.doc.setFillColor(243, 244, 246) // Light gray background
    this.doc.roundedRect(15, yPosition, 180, 35, 3, 3, 'F')
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📅 Огноо:', 20, yPosition + 8)
    this.doc.setFont('helvetica', 'normal')
    const workoutDate = new Date(workout.date)
    this.doc.text(workoutDate.toLocaleDateString('mn-MN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }), 55, yPosition + 8)
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('✓ Төлөв:', 20, yPosition + 18)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(workout.completed ? '✅ Дууссан' : '⏳ Дуусаагүй', 55, yPosition + 18)
    
    if (workout.notes) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('📝 Тэмдэглэл:', 20, yPosition + 28)
      this.doc.setFont('helvetica', 'normal')
      const notesLines = this.doc.splitTextToSize(workout.notes, 120)
      this.doc.text(notesLines, 75, yPosition + 28)
      yPosition += notesLines.length * 5
    }
    
    yPosition += 45

    // Exercises section
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('🏋️ Дасгалууд', 20, yPosition)
    yPosition += 15

    exercises.forEach((exercise, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        this.doc.addPage()
        yPosition = 20
      }
      
      // Exercise header with background
      this.doc.setFillColor(229, 231, 235) // Light gray
      this.doc.roundedRect(15, yPosition - 8, 180, 25, 3, 3, 'F')
      
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(59, 130, 246) // Blue text
      this.doc.text(`${index + 1}. ${exercise.mnName}`, 20, yPosition)
      this.doc.setTextColor(0, 0, 0) // Reset to black
      
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`💪 ${exercise.muscleGroup}`, 20, yPosition + 10)
      if (exercise.equipment) {
        this.doc.text(`⚙️ ${exercise.equipment}`, 120, yPosition + 10)
      }
      
      yPosition += 20
      
      // Sets table header
      this.doc.setFillColor(249, 250, 251)
      this.doc.roundedRect(20, yPosition - 5, 170, 8, 2, 2, 'F')
      
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Сет', 25, yPosition)
      this.doc.text('Давталт', 55, yPosition)
      this.doc.text('Жин (кг)', 95, yPosition)
      this.doc.text('RPE', 135, yPosition)
      this.doc.text('Гүйцэтгэсэн', 165, yPosition)
      
      yPosition += 10
      
      // Sets rows
      this.doc.setFont('helvetica', 'normal')
      let totalVolume = 0
      let completedSets = 0
      
      exercise.sets.forEach((set, setIndex) => {
        const volume = set.reps * set.weight
        totalVolume += volume
        if (set.completed) completedSets++
        
        // Alternate row colors
        if (setIndex % 2 === 0) {
          this.doc.setFillColor(255, 255, 255)
        } else {
          this.doc.setFillColor(249, 250, 251)
        }
        this.doc.roundedRect(20, yPosition - 4, 170, 7, 1, 1, 'F')
        
        this.doc.text(`${set.order}`, 25, yPosition)
        this.doc.text(`${set.reps}`, 55, yPosition)
        this.doc.text(`${set.weight}`, 95, yPosition)
        this.doc.text(`${set.rpe || '-'}`, 135, yPosition)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(set.completed ? '✓' : '○', 175, yPosition)
        this.doc.setFont('helvetica', 'normal')
        
        yPosition += 7
      })
      
      // Exercise summary
      yPosition += 3
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Нийт эзэлхүүн: ${totalVolume.toFixed(1)} кг`, 25, yPosition)
      this.doc.text(`Гүйцэтгэсэн: ${completedSets}/${exercise.sets.length}`, 135, yPosition)
      
      yPosition += 15
    })

    // Footer
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(
        `Gym Дэвтэр - Хуудас ${i} / ${pageCount}`,
        105,
        285,
        { align: 'center' }
      )
      this.doc.text(
        new Date().toLocaleDateString('mn-MN'),
        190,
        285,
        { align: 'right' }
      )
    }

    // Save the PDF
    const fileName = `gym-workout-${workoutDate.toISOString().split('T')[0]}.pdf`
    this.doc.save(fileName)
  }

  async exportAnalytics(data: AnalyticsExportData): Promise<void> {
    const { user, period, summary, personalRecords } = data

    // Header
    this.doc.setFillColor(59, 130, 246)
    this.doc.rect(0, 0, 210, 40, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📊 Статистик Тайлан', 105, 25, { align: 'center' })
    
    this.doc.setTextColor(0, 0, 0)
    let yPosition = 50

    // User info box
    this.doc.setFillColor(243, 244, 246)
    this.doc.roundedRect(15, yPosition, 180, 45, 3, 3, 'F')
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('👤 Хэрэглэгч:', 20, yPosition + 10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(user.name || 'N/A', 70, yPosition + 10)
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📧 И-мэйл:', 20, yPosition + 20)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(user.email, 70, yPosition + 20)
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('⭐ Түвшин:', 20, yPosition + 30)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(user.experienceLevel || 'N/A', 70, yPosition + 30)
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📅 Хугацаа:', 110, yPosition + 30)
    this.doc.setFont('helvetica', 'normal')
    const periodNames: { [key: string]: string } = {
      'week': '7 хоног',
      'month': 'Сар',
      'year': 'Жил'
    }
    this.doc.text(periodNames[period] || period, 160, yPosition + 30)

    yPosition += 60

    // Summary section
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📈 Нийтлэг', 20, yPosition)
    yPosition += 15

    // Summary cards
    const summaryData = [
      { label: 'Нийт дасгал', value: summary.totalWorkouts, icon: '🏋️', color: [59, 130, 246] },
      { label: 'Нийт сет', value: summary.totalSets, icon: '📊', color: [16, 185, 129] },
      { label: 'Гүйцэтгэсэн', value: `${summary.completedSets}`, icon: '✅', color: [34, 197, 94] },
      { label: 'Гүйцэтгэл', value: `${summary.completionRate.toFixed(1)}%`, icon: '🎯', color: [251, 146, 60] },
      { label: 'Нийт эзэлхүүн', value: `${summary.totalVolume.toFixed(1)} кг`, icon: '⚖️', color: [168, 85, 247] },
      { label: 'Дундаж RPE', value: summary.averageRPE.toFixed(1), icon: '💪', color: [236, 72, 153] }
    ]

    let xPos = 20
    summaryData.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) {
        yPosition += 50
        xPos = 20
      } else if (index > 0) {
        xPos = 110
      }

      this.doc.setFillColor(...item.color)
      this.doc.roundedRect(xPos, yPosition - 8, 85, 35, 3, 3, 'F')
      
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(20)
      this.doc.text(item.icon, xPos + 5, yPosition + 5)
      
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(item.value.toString(), xPos + 25, yPosition + 5)
      
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(item.label, xPos + 5, yPosition + 18)
    })

    yPosition += 55

    // Personal Records section
    if (personalRecords.length > 0) {
      if (yPosition > 230) {
        this.doc.addPage()
        yPosition = 20
      }

      this.doc.setFontSize(18)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(0, 0, 0)
      this.doc.text('🏆 Personal Records', 20, yPosition)
      yPosition += 15

      personalRecords.forEach((pr, index) => {
        if (yPosition > 260) {
          this.doc.addPage()
          yPosition = 20
        }

        this.doc.setFillColor(254, 249, 195) // Yellow background
        this.doc.roundedRect(20, yPosition - 6, 170, 20, 3, 3, 'F')
        
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(0, 0, 0)
        this.doc.text(`${index + 1}. ${pr.exercise.mnName}`, 25, yPosition + 3)
        
        this.doc.setFontSize(14)
        this.doc.text(`PR: ${pr.prWeight} кг`, 140, yPosition + 3, { align: 'right' })
        
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(`💪 ${pr.exercise.muscleGroup}`, 25, yPosition + 12)
        
        yPosition += 25
      })
    }

    // Footer
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(`Gym Дэвтэр - Хуудас ${i} / ${pageCount}`, 105, 285, { align: 'center' })
      this.doc.text(new Date().toLocaleDateString('mn-MN'), 190, 285, { align: 'right' })
    }

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

    // Header
    this.doc.setFillColor(168, 85, 247) // Purple
    this.doc.rect(0, 0, 210, 40, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📋 Хөтөлбөр', 105, 25, { align: 'center' })
    
    this.doc.setTextColor(0, 0, 0)
    let yPosition = 50

    // Program name box
    this.doc.setFillColor(243, 244, 246)
    this.doc.roundedRect(15, yPosition, 180, 25, 3, 3, 'F')
    
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`📌 ${programName}`, 20, yPosition + 15)

    yPosition += 40

    // Exercises by day
    exercises.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (yPosition > 250) {
        this.doc.addPage()
        yPosition = 20
      }

      // Day header
      this.doc.setFillColor(229, 231, 235)
      this.doc.roundedRect(15, yPosition - 8, 180, 20, 3, 3, 'F')
      
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(168, 85, 247)
      this.doc.text(`📅 Өдөр ${day.dayNumber}`, 20, yPosition + 5)
      this.doc.setTextColor(0, 0, 0)
      
      yPosition += 18

      day.exercises.forEach((exercise, index) => {
        if (yPosition > 260) {
          this.doc.addPage()
          yPosition = 20
        }

        // Exercise card
        this.doc.setFillColor(255, 255, 255)
        this.doc.setDrawColor(229, 231, 235)
        this.doc.roundedRect(20, yPosition - 6, 170, 30, 3, 3, 'FD')
        
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(`${index + 1}. ${exercise.mnName}`, 25, yPosition + 5)
        
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(`💪 ${exercise.muscleGroup}`, 25, yPosition + 13)
        
        if (exercise.equipment) {
          this.doc.text(`⚙️ ${exercise.equipment}`, 90, yPosition + 13)
        }
        
        // Exercise details
        const details = `${exercise.sets} сет • ${exercise.reps} давталт • ⏱️ ${exercise.rest}`
        this.doc.text(details, 25, yPosition + 21)
        
        yPosition += 35
      })
      
      yPosition += 10
    })

    // Footer
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(`Gym Дэвтэр - Хуудас ${i} / ${pageCount}`, 105, 285, { align: 'center' })
      this.doc.text(new Date().toLocaleDateString('mn-MN'), 190, 285, { align: 'right' })
    }

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