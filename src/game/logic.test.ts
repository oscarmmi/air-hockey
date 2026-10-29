import { describe, expect, it } from 'vitest'
import { FIELD_HEIGHT, FIELD_WIDTH, clampPaddle, isMatchWon, scoreGoal } from './logic'

describe('air hockey game rules', () => {
  it('awards the player a point when the puck crosses the top goal', () => {
    expect(scoreGoal({ x: FIELD_WIDTH / 2, y: -10 }, { player: 2, cpu: 3 })).toEqual({
      scorer: 'player',
      scores: { player: 3, cpu: 3 },
    })
  })

  it('awards the CPU a point when the puck crosses the bottom goal', () => {
    expect(scoreGoal({ x: FIELD_WIDTH / 2, y: FIELD_HEIGHT + 10 }, { player: 2, cpu: 3 })).toEqual({
      scorer: 'cpu',
      scores: { player: 2, cpu: 4 },
    })
  })

  it('does not score when the puck crosses outside the goal opening', () => {
    expect(scoreGoal({ x: 40, y: -20 }, { player: 0, cpu: 0 })).toBeNull()
  })

  it('keeps the player paddle inside their half and the table bounds', () => {
    expect(clampPaddle({ x: -50, y: 20 }, 'player')).toMatchObject({ x: 44, y: 373 })
    expect(clampPaddle({ x: 900, y: 900 }, 'player')).toMatchObject({ x: 356, y: 636 })
  })

  it('keeps the CPU paddle in the top half', () => {
    expect(clampPaddle({ x: 200, y: 900 }, 'cpu').y).toBe(307)
    expect(clampPaddle({ x: 200, y: -10 }, 'cpu').y).toBe(44)
  })

  it('declares a match win at seven points', () => {
    expect(isMatchWon({ player: 7, cpu: 4 })).toBe(true)
    expect(isMatchWon({ player: 4, cpu: 7 })).toBe(true)
    expect(isMatchWon({ player: 6, cpu: 6 })).toBe(false)
  })
})
