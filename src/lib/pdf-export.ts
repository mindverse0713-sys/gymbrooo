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

    // Try using html2canvas first, fallback to direct PDF generation if it fails
    try {
      // Create HTML element for better text rendering
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'
      container.style.backgroundColor = '#ffffff'
      container.style.fontFamily = 'Arial, sans-serif'
      document.body.appendChild(container)

    let htmlContent = `
      <div style="width: 794px; background: white; padding: 0; font-family: Arial, sans-serif;">
        <!-- Header -->
        <div style="background: #3b82f6; color: white; padding: 20px 15px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">💪 Gym Дэвтэр</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">Дасгалын Тайлан</p>
        </div>
        
        <!-- Workout Info -->
        <div style="background: #f3f4f6; padding: 15px; margin: 10px 15px; border-radius: 8px;">
          <div style="margin-bottom: 8px;">
            <strong>📅 Огноо:</strong> ${new Date(workout.date).toLocaleDateString('mn-MN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>✓ Төлөв:</strong> ${workout.completed ? '✅ Дууссан' : '⏳ Дуусаагүй'}
          </div>
          ${workout.notes ? `<div><strong>📝 Тэмдэглэл:</strong> ${workout.notes}</div>` : ''}
        </div>
        
        <!-- Exercises -->
        <div style="padding: 15px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">🏋️ Дасгалууд</h2>
    `

    exercises.forEach((exercise, index) => {
      const totalVolume = exercise.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0)
      const completedSets = exercise.sets.filter(set => set.completed).length
      
      htmlContent += `
        <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <!-- Exercise Header -->
          <div style="background: #e5e7eb; padding: 12px 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">
              ${index + 1}. ${exercise.mnName}
            </div>
            <div style="font-size: 10px; color: #666;">
              💪 ${exercise.muscleGroup} ${exercise.equipment ? `• ⚙️ ${exercise.equipment}` : ''}
            </div>
          </div>
          
          <!-- Sets Table -->
          <div style="padding: 15px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 8px; text-align: left; font-weight: bold;">Сет</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold;">Давталт</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold;">Жин (кг)</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold;">RPE</th>
                  <th style="padding: 8px; text-align: left; font-weight: bold;">Гүйцэтгэсэн</th>
                </tr>
              </thead>
              <tbody>
      `
      
      exercise.sets.forEach((set, setIndex) => {
        htmlContent += `
          <tr style="background: ${setIndex % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 6px;">${set.order}</td>
            <td style="padding: 6px;">${set.reps}</td>
            <td style="padding: 6px;">${set.weight}</td>
            <td style="padding: 6px;">${set.rpe || '-'}</td>
            <td style="padding: 6px; font-weight: bold;">${set.completed ? '✓' : '○'}</td>
          </tr>
        `
      })
      
      htmlContent += `
              </tbody>
            </table>
            <div style="margin-top: 10px; font-size: 9px; font-weight: bold;">
              Нийт эзэлхүүн: ${totalVolume.toFixed(1)} кг • Гүйцэтгэсэн: ${completedSets}/${exercise.sets.length}
            </div>
          </div>
        </div>
      `
    })

    htmlContent += `
        </div>
      </div>
    `

    container.innerHTML = htmlContent

      try {
        // Wait for DOM to render
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Get the content element
        const contentElement = container.firstElementChild as HTMLElement
        if (!contentElement) {
          throw new Error('Content element not found')
        }

        // Convert HTML to canvas
        const canvas = await html2canvas(contentElement, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })

        // Create PDF from canvas
        const imgData = canvas.toDataURL('image/png', 0.95)
        const imgWidth = 210 // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        this.doc = new jsPDF('p', 'mm', 'a4')
        
        // Handle multi-page PDF
        const pageHeight = 297 // A4 height in mm
        let heightLeft = imgHeight
        let position = 0
        
        this.doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          this.doc.addPage()
          this.doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Add footer to all pages
        const pageCount = this.doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          this.doc.setPage(i)
          this.doc.setFontSize(8)
          this.doc.setTextColor(128, 128, 128)
          this.doc.text(
            `Хуудас ${i} / ${pageCount}`,
            105,
            290,
            { align: 'center' }
          )
        }

        // Clean up
        if (container.parentNode) {
          document.body.removeChild(container)
        }

        // Save the PDF
        const fileName = `gym-workout-${new Date(workout.date).toISOString().split('T')[0]}.pdf`
        this.doc.save(fileName)
      } catch (html2canvasError) {
        // Clean up container
        if (container.parentNode) {
          document.body.removeChild(container)
        }
        
        // Fallback to direct PDF generation
        console.warn('html2canvas failed, using fallback method:', html2canvasError)
        await this.exportWorkoutFallback(data)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Fallback method using direct jsPDF text rendering (for when html2canvas fails)
  private async exportWorkoutFallback(data: WorkoutExportData): Promise<void> {
    const { workout, exercises } = data
    this.doc = new jsPDF('p', 'mm', 'a4')

    // Header
    this.doc.setFillColor(59, 130, 246)
    this.doc.rect(0, 0, 210, 30, 'F')
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Gym Detver', 105, 20, { align: 'center' })
    this.doc.setFontSize(14)
    this.doc.text('Dasgaliin Tailan', 105, 28, { align: 'center' })
    
    this.doc.setTextColor(0, 0, 0)
    let yPosition = 40

    // Workout info
    this.doc.setFontSize(11)
    const dateText = new Date(workout.date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    })
    this.doc.text(`Date: ${dateText}`, 20, yPosition)
    this.doc.text(`Status: ${workout.completed ? 'Completed' : 'Incomplete'}`, 20, yPosition + 7)
    if (workout.notes) {
      this.doc.text(`Notes: ${workout.notes}`, 20, yPosition + 14)
      yPosition += 7
    }
    yPosition += 20

    // Exercises
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Exercises', 20, yPosition)
    yPosition += 10

    exercises.forEach((exercise, index) => {
      if (yPosition > 270) {
        this.doc.addPage()
        yPosition = 20
      }

      // Exercise header
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`${index + 1}. ${exercise.mnName}`, 20, yPosition)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(10)
      this.doc.text(`${exercise.muscleGroup}`, 20, yPosition + 7)
      yPosition += 15

      // Sets table
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Set', 25, yPosition)
      this.doc.text('Reps', 55, yPosition)
      this.doc.text('Weight', 85, yPosition)
      this.doc.text('RPE', 115, yPosition)
      this.doc.text('Done', 145, yPosition)
      yPosition += 7

      this.doc.setFont('helvetica', 'normal')
      let totalVolume = 0
      let completedSets = 0
      exercise.sets.forEach(set => {
        this.doc.text(`${set.order}`, 25, yPosition)
        this.doc.text(`${set.reps}`, 55, yPosition)
        this.doc.text(`${set.weight}`, 85, yPosition)
        this.doc.text(`${set.rpe || '-'}`, 115, yPosition)
        this.doc.text(set.completed ? 'Yes' : 'No', 145, yPosition)
        totalVolume += set.reps * set.weight
        if (set.completed) completedSets++
        yPosition += 6
      })

      this.doc.setFontSize(8)
      this.doc.text(`Total Volume: ${totalVolume.toFixed(1)} kg`, 25, yPosition)
      this.doc.text(`Completed: ${completedSets}/${exercise.sets.length}`, 120, yPosition)
      yPosition += 12
    })

    // Footer
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' })
    }

    const fileName = `gym-workout-${new Date(workout.date).toISOString().split('T')[0]}.pdf`
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