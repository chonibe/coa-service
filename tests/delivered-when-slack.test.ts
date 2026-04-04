import { resolveDeliveredWhenForSlack } from '@/lib/warehouse/daily-slack-summary'
import type { ChinaDivisionOrderInfo, OrderTrackListItem } from '@/lib/chinadivision/client'
import type { STONE3PLClient } from '@/lib/stone3pl/client'

function baseOrder(over: Partial<ChinaDivisionOrderInfo>): ChinaDivisionOrderInfo {
  return {
    order_id: '#1',
    first_name: 'A',
    last_name: 'B',
    ship_address1: 'x',
    ship_city: 'c',
    ship_state: 's',
    ship_zip: 'z',
    ship_country: 'US',
    ship_phone: 'p',
    ship_email: 'e@x.com',
    code: 'c',
    quantity: '1',
    info: [],
    date_added: '2020-01-01',
    ...over,
  } as ChinaDivisionOrderInfo
}

function mockStone(timeline: ReturnType<STONE3PLClient['getTrackingTimeline']>): STONE3PLClient {
  return {
    getTrackingTimeline: () => timeline,
  } as STONE3PLClient
}

describe('resolveDeliveredWhenForSlack', () => {
  it('uses latest “delivered” event by timestamp', () => {
    const stone = mockStone({
      events: [
        {
          timestamp: '2026-04-01T12:00:00.000Z',
          description: 'Delivered at door',
          parsedTime: { full: 'Apr 1, 2026' } as { full: string },
        },
        {
          timestamp: '2026-04-03T12:00:00.000Z',
          description: 'Delivered signed',
          parsedTime: { full: 'Apr 3, 2026' } as { full: string },
        },
      ],
      currentStatus: {
        code: 121,
        name: 'Delivered',
        description: '',
        isDelivered: true,
        isInTransit: false,
        isException: false,
      },
      hasError: false,
    })
    const row = {
      sys_order_id: 's',
      tracking_number: 't',
      order_id: '#1',
      track_list: [],
      track_status: 121,
      track_status_name: 'Delivered',
      error_code: 0,
      error_msg: '',
    } as OrderTrackListItem

    const r = resolveDeliveredWhenForSlack(stone, row, baseOrder({}))
    expect(r.whenLabel).toBe('Apr 3, 2026')
    expect(r.atMs).toBe(new Date('2026-04-03T12:00:00.000Z').getTime())
  })

  it('falls back to date_added without track row', () => {
    const r = resolveDeliveredWhenForSlack({} as STONE3PLClient, undefined, baseOrder({ date_added: '2025-06-15' }))
    expect(r.whenLabel).toBe('listed 2025-06-15')
  })
})
