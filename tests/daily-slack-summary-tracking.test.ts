import { formatTrackingNumbersForSlack } from '@/lib/warehouse/daily-slack-summary'
import type { ChinaDivisionOrderInfo, OrderTrackListItem } from '@/lib/chinadivision/client'

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

function baseTrack(over: Partial<OrderTrackListItem>): OrderTrackListItem {
  return {
    sys_order_id: 's',
    tracking_number: '',
    order_id: '#1',
    track_list: [],
    track_status: 0,
    track_status_name: '',
    error_code: 0,
    error_msg: '',
    ...over,
  }
}

describe('formatTrackingNumbersForSlack', () => {
  it('prefers track-list main and LM over order-info (single line, no duplicate)', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'AAA', last_mile_tracking: 'BBB' }),
      baseTrack({ tracking_number: 'CCC', last_mile_tracking: 'DDD' })
    )
    expect(s).toMatch(/main `CCC`/)
    expect(s).toMatch(/LM `DDD`/)
    expect(s).not.toMatch(/AAA/)
    expect(s).not.toMatch(/BBB/)
  })

  it('omits LM when same as main', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'SAME', last_mile_tracking: 'SAME' }),
      baseTrack({ tracking_number: 'X', last_mile_tracking: 'X' })
    )
    expect(s).toBe('main `X`')
  })

  it('falls back to order-info when no track row', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'Z', last_mile_tracking: 'LMZ' }),
      undefined
    )
    expect(s).toMatch(/main `Z`/)
    expect(s).toMatch(/LM `LMZ`/)
  })

  it('uses order main when track row has only last-mile', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'MAIN', last_mile_tracking: '' }),
      baseTrack({ tracking_number: '', last_mile_tracking: 'LAST' })
    )
    expect(s).toMatch(/main `MAIN`/)
    expect(s).toMatch(/LM `LAST`/)
  })
})
