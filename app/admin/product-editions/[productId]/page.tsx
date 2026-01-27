import { ProductEditionsClient } from "./ProductEditionsClient"

export default async function ProductEditionsPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  return <ProductEditionsClient productId={productId} />
}
