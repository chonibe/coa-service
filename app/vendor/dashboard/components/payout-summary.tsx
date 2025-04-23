interface PayoutSummaryProps {
  productName: string
  productPrice: number
  payoutAmount: number
  isPercentage: boolean
  salesData: { date: string; sales: number }[]
}

export function PayoutSummary({
  productName,
  productPrice,
  payoutAmount,
  isPercentage,
  salesData,
}: PayoutSummaryProps) {
  const totalSales = salesData.reduce((acc, item) => acc + item.sales, 0)
  const totalPayout = isPercentage ? (productPrice * payoutAmount * totalSales) / 100 : payoutAmount * totalSales

  return (
    <div>
      <h3>{productName}</h3>
      <p>Price: ${productPrice}</p>
      <p>Payout: {isPercentage ? `${payoutAmount}%` : `$${payoutAmount}`}</p>
      <p>Total Sales: {totalSales}</p>
      <p>Total Payout: ${totalPayout.toFixed(2)}</p>
      <ul>
        {salesData.map((item) => (
          <li key={item.date}>
            {item.date}: {item.sales} sales
          </li>
        ))}
      </ul>
    </div>
  )
}
