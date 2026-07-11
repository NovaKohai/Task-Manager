import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ReportMetrics, Task } from './types'
import { track } from './analytics'

export function exportReportPDF(metrics: ReportMetrics, period: string) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Report - ${period}`, 14, 20)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27)

  doc.setFontSize(11)
  doc.text(`Total Tasks: ${metrics.totalTasks}`, 14, 36)
  doc.text(`Completed: ${metrics.completedTasks}`, 14, 43)
  doc.text(`Completion Rate: ${metrics.completionRate}%`, 14, 50)
  doc.text(`Avg Resolution: ${metrics.avgResolutionDays}d`, 14, 57)
  doc.text(`Overdue: ${metrics.overdueTasks}`, 14, 64)

  autoTable(doc, {
    startY: 72,
    head: [['Member', 'Completed']],
    body: metrics.topPerformers.map(p => [p.name, String(p.completed)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Status', 'Count']],
    body: metrics.byStatus.map(s => [s.status, String(s.count)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Date', 'Completed']],
    body: metrics.trend.map(t => [t.date, String(t.completed)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  doc.save(`report-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  track('export_pdf', { type: 'report', period })
}

export function exportReportXLSX(metrics: ReportMetrics, period: string) {
  const wb = XLSX.utils.book_new()

  const summary = [
    ['Metric', 'Value'],
    ['Total Tasks', metrics.totalTasks],
    ['Completed', metrics.completedTasks],
    ['Completion Rate', `${metrics.completionRate}%`],
    ['Avg Resolution', `${metrics.avgResolutionDays}d`],
    ['Overdue', metrics.overdueTasks],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  const performers = [['Member', 'Completed'], ...metrics.topPerformers.map(p => [p.name, p.completed])]
  const wsPerformers = XLSX.utils.aoa_to_sheet(performers)
  XLSX.utils.book_append_sheet(wb, wsPerformers, 'Top Performers')

  const statuses = [['Status', 'Count'], ...metrics.byStatus.map(s => [s.status, s.count])]
  const wsStatus = XLSX.utils.aoa_to_sheet(statuses)
  XLSX.utils.book_append_sheet(wb, wsStatus, 'By Status')

  const trend = [['Date', 'Completed'], ...metrics.trend.map(t => [t.date, t.completed])]
  const wsTrend = XLSX.utils.aoa_to_sheet(trend)
  XLSX.utils.book_append_sheet(wb, wsTrend, 'Trend')

  XLSX.writeFile(wb, `report-${period.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
  track('export_xlsx', { type: 'report', period })
}

export function exportTaskPDF(task: Task) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(task.code, 14, 20)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27)

  doc.setFontSize(14)
  doc.text(task.title, 14, 36)

  doc.setFontSize(10)
  const lines = doc.splitTextToSize(task.description || 'No description', 180)
  doc.text(lines, 14, 44)

  autoTable(doc, {
    startY: 44 + lines.length * 5 + 6,
    body: [
      ['Status', task.status],
      ['Priority', task.priority],
      ['Assignee', task.assigneeId || 'Unassigned'],
      ['Project', task.project || '—'],
      ['Due Date', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'],
      ['Est. Hours', task.estHours ? `${task.estHours}h` : '—'],
      ['Created', new Date(task.createdAt).toLocaleString()],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
  })

  doc.save(`${task.code}-${task.title.slice(0, 30).replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`)
  track('export_pdf', { type: 'task' })
}
