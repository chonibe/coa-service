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
  it('shows Local main + LM and STONE3PL main + LM when all differ', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'AAA', last_mile_tracking: 'BBB' }),
      baseTrack({ tracking_number: 'CCC', last_mile_tracking: 'DDD' })
    )
    expect(s).toContain('Local:')
    expect(s).toContain('STONE3PL:')
    expect(s).toMatch(/main `AAA`/)
    expect(s).toMatch(/LM `BBB`/)
    expect(s).toMatch(/main `CCC`/)
    expect(s).toMatch(/LM `DDD`/)
  })

  it('omits duplicate LM when same as main', () => {
    const s = formatTrackingNumbersForSlack(
      baseOrder({ tracking_number: 'SAME', last_mile_tracking: 'SAME' }),
      baseTrack({ tracking_number: 'X', last_mile_tracking: 'X' })
    )
    expect(s).toMatch(/Local: main `SAME`/)
    expect(s).toMatch(/STONE3PL: main `X`/)
    expect(s).not.toMatch(/LM `SAME`/)
    expect(s).not.toMatch(/LM `X`/)
  })

  it('shows STONE3PL as — when no track row', () => {
    const s = formatTrackingNumbersForSlack(baseOrder({ tracking_number: 'Z' }), undefined)
    expect(s).toMatch(/Local: main `Z`/)
    expect(s).toMatch(/STONE3PL: —/)
  })
})
