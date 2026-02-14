export const dynamic = 'force-dynamic'

export default function DebugTestPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Debug Test Page</h1>
      <p>If you see this, the shop layout rendered successfully.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  )
}
