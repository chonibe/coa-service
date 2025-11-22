/**
 * PDF Invoice Generator for Vendor Payouts
 * Generates professional self-billing invoices for tax compliance
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceData {
  invoiceNumber: string
  payoutId: number
  vendorName: string
  vendorEmail?: string
  vendorTaxId?: string
  vendorTaxCountry?: string
  vendorIsCompany?: boolean
  payoutDate: string
  payoutAmount: number
  currency: string
  taxRate: number
  taxAmount: number
  lineItems: Array<{
    productTitle: string
    orderId: string
    orderName?: string
    quantity: number
    unitPrice: number
    payoutAmount: number
  }>
  reference?: string
  payoutBatchId?: string
  paymentMethod: string
  notes?: string
}

/**
 * Generate a PDF invoice for a vendor payout
 */
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SELF-BILLING INVOICE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Invoice details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice Number: ${data.invoiceNumber}`, margin, yPos)
  doc.text(`Date: ${new Date(data.payoutDate).toLocaleDateString('en-GB')}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 10

  if (data.reference) {
    doc.text(`Reference: ${data.reference}`, margin, yPos)
    yPos += 10
  }

  if (data.payoutBatchId) {
    doc.text(`Payment Batch ID: ${data.payoutBatchId}`, margin, yPos)
    yPos += 10
  }

  yPos += 5

  // Supplier (Vendor) Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Supplier Details', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.vendorName}`, margin, yPos)
  yPos += 6

  if (data.vendorEmail) {
    doc.text(`Email: ${data.vendorEmail}`, margin, yPos)
    yPos += 6
  }

  if (data.vendorTaxId) {
    doc.text(`Tax ID: ${data.vendorTaxId}`, margin, yPos)
    yPos += 6
  }

  if (data.vendorTaxCountry) {
    doc.text(`Country: ${data.vendorTaxCountry}`, margin, yPos)
    yPos += 6
  }

  yPos += 10

  // Customer (Platform) Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Details', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('COA Service', margin, yPos)
  yPos += 6
  doc.text('Platform for Digital Art & NFTs', margin, yPos)
  yPos += 10

  // Line Items Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Line Items', margin, yPos)
  yPos += 8

  const tableData = data.lineItems.map((item) => [
    item.productTitle || 'Product',
    item.orderName || item.orderId,
    item.quantity.toString(),
    `${data.currency} ${item.unitPrice.toFixed(2)}`,
    `${data.currency} ${item.payoutAmount.toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Product', 'Order', 'Qty', 'Unit Price', 'Payout Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Totals
  const totalsX = pageWidth - margin
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Subtotal
  doc.text('Subtotal:', totalsX - 60, yPos, { align: 'right' })
  doc.text(`${data.currency} ${(data.payoutAmount - data.taxAmount).toFixed(2)}`, totalsX, yPos, { align: 'right' })
  yPos += 6

  // Tax
  if (data.taxAmount > 0) {
    doc.text(`Tax (${data.taxRate}%):`, totalsX - 60, yPos, { align: 'right' })
    doc.text(`${data.currency} ${data.taxAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' })
    yPos += 6
  }

  // Total
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', totalsX - 60, yPos, { align: 'right' })
  doc.text(`${data.currency} ${data.payoutAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' })
  yPos += 15

  // Payment Information
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, margin, yPos)
  yPos += 6

  if (data.notes) {
    doc.text(`Notes: ${data.notes}`, margin, yPos)
    yPos += 6
  }

  yPos += 10

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'This is a self-billing invoice issued by COA Service. The supplier (vendor) agrees to accept this invoice as valid for tax purposes.',
    margin,
    yPos,
    { maxWidth: pageWidth - 2 * margin, align: 'left' }
  )
  yPos += 8

  doc.text(
    `Generated on ${new Date().toLocaleString('en-GB')} | Payout ID: ${data.payoutId}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  return doc
}

/**
 * Generate invoice PDF as buffer (for API responses)
 */
export function generateInvoiceBuffer(data: InvoiceData): Buffer {
  const doc = generateInvoicePDF(data)
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

