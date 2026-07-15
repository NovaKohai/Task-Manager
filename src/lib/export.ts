import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ReportMetrics, Task, User } from './types'
import { i18n } from './i18n'

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}

export function exportReportPDF(metrics: ReportMetrics, period: string) {
  const doc = new jsPDF() as JsPDFWithAutoTable
  doc.setFontSize(16)
  doc.text(i18n.t('export.report_title').replace('{period}', period), 14, 20)
  doc.setFontSize(9)
  doc.text(i18n.t('export.generated').replace('{date}', new Date().toLocaleString(i18n.localeStr)), 14, 27)

  doc.setFontSize(11)
  doc.text(`${i18n.t('export.total_tasks')}: ${metrics.totalTasks}`, 14, 36)
  doc.text(`${i18n.t('export.completed')}: ${metrics.completedTasks}`, 14, 43)
  doc.text(`${i18n.t('export.completion_rate')}: ${metrics.completionRate}%`, 14, 50)
  doc.text(`${i18n.t('export.avg_resolution')}: ${metrics.avgResolutionDays}d`, 14, 57)
  doc.text(`${i18n.t('export.overdue')}: ${metrics.overdueTasks}`, 14, 64)

  autoTable(doc, {
    startY: 72,
    head: [[i18n.t('export.member'), i18n.t('export.completed')]],
    body: metrics.topPerformers.map(p => [p.name, String(p.completed)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [[i18n.t('export.status'), i18n.t('export.count')]],
    body: metrics.byStatus.map(s => [i18n.t(`task.status.${s.status}`), String(s.count)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [[i18n.t('export.date'), i18n.t('export.completed')]],
    body: metrics.trend.map(t => [t.date, String(t.completed)]),
    headStyles: { fillColor: [99, 102, 241] },
  })

  doc.save(`report-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export function exportReportXLSX(metrics: ReportMetrics, period: string) {
  const wb = XLSX.utils.book_new()

  const summary = [
    [i18n.t('export.metric'), i18n.t('export.value')],
    [i18n.t('export.total_tasks'), metrics.totalTasks],
    [i18n.t('export.completed'), metrics.completedTasks],
    [i18n.t('export.completion_rate'), `${metrics.completionRate}%`],
    [i18n.t('export.avg_resolution'), `${metrics.avgResolutionDays}d`],
    [i18n.t('export.overdue'), metrics.overdueTasks],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  XLSX.utils.book_append_sheet(wb, wsSummary, i18n.t('export.summary'))

  const performers = [[i18n.t('export.member'), i18n.t('export.completed')], ...metrics.topPerformers.map(p => [p.name, p.completed])]
  const wsPerformers = XLSX.utils.aoa_to_sheet(performers)
  XLSX.utils.book_append_sheet(wb, wsPerformers, i18n.t('export.top_performers'))

  const statuses = [[i18n.t('export.status'), i18n.t('export.count')], ...metrics.byStatus.map(s => [i18n.t(`task.status.${s.status}`), s.count])]
  const wsStatus = XLSX.utils.aoa_to_sheet(statuses)
  XLSX.utils.book_append_sheet(wb, wsStatus, i18n.t('export.by_status'))

  const trend = [[i18n.t('export.date'), i18n.t('export.completed')], ...metrics.trend.map(t => [t.date, t.completed])]
  const wsTrend = XLSX.utils.aoa_to_sheet(trend)
  XLSX.utils.book_append_sheet(wb, wsTrend, i18n.t('export.trend'))

  XLSX.writeFile(wb, `report-${period.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
}

export function exportTaskPDF(task: Task, users: User[]) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(task.code, 14, 20)
  doc.setFontSize(9)
  doc.text(i18n.t('export.generated').replace('{date}', new Date().toLocaleString(i18n.localeStr)), 14, 27)

  doc.setFontSize(14)
  doc.text(task.title, 14, 36)

  doc.setFontSize(10)
  const lines = doc.splitTextToSize(task.description || i18n.t('export.no_description'), 180)
  doc.text(lines, 14, 44)

  const assignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : null
  const assigneeName = assignee ? assignee.name : i18n.t('export.unassigned')

  autoTable(doc, {
    startY: 44 + lines.length * 5 + 6,
    body: [
      [i18n.t('export.status'), i18n.t(`task.status.${task.status}`)],
      [i18n.t('export.priority'), i18n.t(`priority.${task.priority}`)],
      [i18n.t('export.assignee'), assigneeName],
      [i18n.t('export.project'), task.project || '—'],
      [i18n.t('export.due_date'), task.dueDate ? new Date(task.dueDate).toLocaleDateString(i18n.localeStr) : '—'],
      [i18n.t('export.est_hours'), task.estHours ? `${task.estHours}h` : '—'],
      [i18n.t('export.created'), new Date(task.createdAt).toLocaleString(i18n.localeStr)],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
  })

  doc.save(`${task.code}-${task.title.slice(0, 30).replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`)
}
