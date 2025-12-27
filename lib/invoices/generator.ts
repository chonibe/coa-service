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
  yPos += 12

  // Sub-line
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Issued by COA Service on behalf of the supplier', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Invoice details (right-aligned block)
  const metadataX = pageWidth - margin
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Draw a light box around the metadata
  const boxWidth = 80
  const boxHeight = 25
  const boxX = metadataX - boxWidth
  doc.setFillColor(245, 245, 245) // Light gray background
  doc.rect(boxX, yPos - 5, boxWidth, boxHeight, 'F')
  doc.setDrawColor(200, 200, 200) // Light border
  doc.rect(boxX, yPos - 5, boxWidth, boxHeight, 'S')

  doc.text(`Invoice Number: ${data.invoiceNumber}`, metadataX, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Invoice Date: ${new Date(data.payoutDate).toLocaleDateString('en-GB')}`, metadataX, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Reference: ${data.reference || 'MANUAL-' + Date.now().toString().slice(-6)}`, metadataX, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Payout ID: ${data.payoutId}`, metadataX, yPos, { align: 'right' })

  yPos += 15

  // Supplier (Artist / Vendor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Supplier (Artist / Vendor)', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.vendorName}`, margin, yPos)
  yPos += 6

  if (data.vendorTaxCountry) {
    doc.text(`Country of residence: ${data.vendorTaxCountry}`, margin, yPos)
    yPos += 6
  }

  if (data.vendorTaxId) {
    doc.text(`Tax ID / VAT ID: ${data.vendorTaxId}`, margin, yPos)
    yPos += 6
  }

  yPos += 10

  // Customer / Invoice Issuer (COA Service)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer / Invoice Issuer', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Street Collector Ltd', margin, yPos)
  yPos += 6
  doc.text('Platform for Digital Art & NFTs', margin, yPos)
  yPos += 6
  doc.text('Registered address: 128 City Road, London EC1V 2NX', margin, yPos)
  yPos += 6
  doc.text('Country: United Kingdom', margin, yPos)
  yPos += 6
  doc.text('Company registration number: 473655758', margin, yPos)
  yPos += 6
  doc.text('VAT number: 473655758', margin, yPos)
  yPos += 10

  // Line Items Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Line Items', margin, yPos)
  yPos += 8

  // Aggregate items by product name to handle multiple quantities
  const aggregatedItems = data.lineItems.reduce((acc, item) => {
    const key = item.productTitle
    if (!acc[key]) {
      acc[key] = {
        productTitle: item.productTitle,
        quantity: 0,
        totalUnitPrice: 0,
        totalPayoutAmount: 0,
        orderIds: []
      }
    }
    acc[key].quantity += item.quantity
    acc[key].totalUnitPrice += item.unitPrice * item.quantity
    acc[key].totalPayoutAmount += item.payoutAmount
    if (!acc[key].orderIds.includes(item.orderId)) {
      acc[key].orderIds.push(item.orderId)
    }
    return acc
  }, {} as Record<string, { productTitle: string; quantity: number; totalUnitPrice: number; totalPayoutAmount: number; orderIds: string[] }>)

  const tableData = Object.values(aggregatedItems).map((item) => [
    item.productTitle, // Description - actual product name
    item.orderIds.join(', '), // Order ID(s)
    item.quantity.toString(), // Qty
    `${data.currency} ${(item.totalUnitPrice / item.quantity).toFixed(2)}`, // Unit Price (USD) - average per item
    `${data.currency} ${item.totalPayoutAmount.toFixed(2)}`, // Amount (USD) - total payout for this product
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Order ID', 'Qty', 'Unit Price (USD)', 'Amount (USD)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Totals (visually dominant)
  const totalsX = pageWidth - margin
  doc.setFontSize(10)

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', totalsX - 60, yPos, { align: 'right' })
  doc.text(`${data.currency} ${(data.payoutAmount - data.taxAmount).toFixed(2)}`, totalsX, yPos, { align: 'right' })
  yPos += 8

  // Separator line
  doc.setDrawColor(100, 100, 100)
  doc.line(totalsX - 80, yPos, totalsX, yPos)
  yPos += 8

  // Total (made visually dominant)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('TOTAL DUE:', totalsX - 60, yPos, { align: 'right' })
  doc.text(`${data.currency} ${data.payoutAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' })
  yPos += 20

  // Payment Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Details', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, margin, yPos)
  yPos += 6
  doc.text('Payment Status: Paid', margin, yPos)
  yPos += 6
  // Note: We don't have the actual user who marked it as paid or the exact payment date in the current data structure
  // This would need to be added to the InvoiceData interface if we want to include it
  doc.text(`Marked as paid by: System`, margin, yPos)
  yPos += 6
  doc.text(`Payment Date: ${new Date(data.payoutDate).toLocaleDateString('en-GB')}`, margin, yPos)
  yPos += 15

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 40

  // Self-billing notice (footer, smaller text)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'This is a self-billing invoice issued by Street Collector Ltd. The supplier agrees to accept this invoice as valid for tax purposes.',
    margin,
    yPos,
    { maxWidth: pageWidth - 2 * margin, align: 'left' }
  )
  yPos += 10

  // Generation info (clean line)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on ${new Date().toLocaleString('en-GB')}`,
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

