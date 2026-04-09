import { describe, expect, it } from 'vitest'
import { getReviewTokens } from './reviewTokens'

describe('getReviewTokens', () => {
  it('returns empty array when no uncertain token exists', () => {
    const text = 'Omeprazole 20mg uống sáng trước ăn 30 phút.'

    expect(getReviewTokens(text)).toEqual([])
  })

  it('extracts a single uncertain token and trims leading spaces', () => {
    const text = 'Kê đơn:   domperidone sau khi chăn trâu (??).'

    expect(getReviewTokens(text)).toEqual([
      {
        start: text.indexOf('domperidone sau khi chăn trâu (??)'),
        end: text.indexOf('domperidone sau khi chăn trâu (??)') + 'domperidone sau khi chăn trâu (??)'.length,
        text: 'domperidone sau khi chăn trâu (??)',
      },
    ])
  })

  it('extracts multiple uncertain tokens in order', () => {
    const text = '1) thuốc A buổi sáng (??), 2) thuốc B buổi tối (??); 3) tái khám 1 tuần.'

    const tokens = getReviewTokens(text)

    expect(tokens).toHaveLength(2)
    expect(tokens[0].text).toBe('1) thuốc A buổi sáng (??)')
    expect(tokens[1].text).toBe('2) thuốc B buổi tối (??)')
    expect(text.slice(tokens[0].start, tokens[0].end)).toBe(tokens[0].text)
    expect(text.slice(tokens[1].start, tokens[1].end)).toBe(tokens[1].text)
  })
})
