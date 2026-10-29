export const FIELD_WIDTH = 400
export const FIELD_HEIGHT = 680
export const PUCK_RADIUS = 9
export const PADDLE_RADIUS = 29
export const WINNING_SCORE = 7
export const GOAL_WIDTH = 126

export type Side = 'player' | 'cpu'

export interface Point {
  x: number
  y: number
}

export interface Paddle extends Point {
  vx?: number
  vy?: number
}

export interface Puck extends Point {
  vx: number
  vy: number
}

export interface Scores {
  player: number
  cpu: number
}

export function clampPaddle<T extends Point>(paddle: T, side: Side): T {
  const inset = PADDLE_RADIUS + 15
  const half = FIELD_HEIGHT / 2
  const minY = side === 'cpu' ? inset : half + PADDLE_RADIUS + 4
  const maxY = side === 'cpu' ? half - PADDLE_RADIUS - 4 : FIELD_HEIGHT - inset
  return {
    ...paddle,
    x: Math.max(inset, Math.min(FIELD_WIDTH - inset, paddle.x)),
    y: Math.max(minY, Math.min(maxY, paddle.y)),
  }
}

export function scoreGoal(puck: Point, scores: Scores): { scorer: Side; scores: Scores } | null {
  const inGoal = Math.abs(puck.x - FIELD_WIDTH / 2) <= GOAL_WIDTH / 2
  if (!inGoal) return null
  if (puck.y < -PUCK_RADIUS) return { scorer: 'player', scores: { ...scores, player: scores.player + 1 } }
  if (puck.y > FIELD_HEIGHT + PUCK_RADIUS) return { scorer: 'cpu', scores: { ...scores, cpu: scores.cpu + 1 } }
  return null
}

export function isMatchWon(scores: Scores, winningScore = WINNING_SCORE): boolean {
  return scores.player >= winningScore || scores.cpu >= winningScore
}

export function stepPuck(puck: Puck, seconds: number, paddles: readonly [Paddle, Paddle]): Side | null {
  puck.x += puck.vx * seconds
  puck.y += puck.vy * seconds

  const scored = scoreGoal(puck, { player: 0, cpu: 0 })
  if (scored) return scored.scorer

  const left = PUCK_RADIUS + 13
  const right = FIELD_WIDTH - PUCK_RADIUS - 13
  if (puck.x < left) {
    puck.x = left
    puck.vx = Math.abs(puck.vx)
  } else if (puck.x > right) {
    puck.x = right
    puck.vx = -Math.abs(puck.vx)
  }

  for (const paddle of paddles) {
    const dx = puck.x - paddle.x
    const dy = puck.y - paddle.y
    const distance = Math.hypot(dx, dy)
    const collisionDistance = PADDLE_RADIUS + PUCK_RADIUS
    if (distance >= collisionDistance || distance === 0) continue
    const nx = dx / distance
    const ny = dy / distance
    const paddleVelocityX = paddle.vx ?? 0
    const paddleVelocityY = paddle.vy ?? 0
    const relativeVelocity = (puck.vx - paddleVelocityX) * nx + (puck.vy - paddleVelocityY) * ny
    if (relativeVelocity < 0) {
      puck.vx -= 2 * relativeVelocity * nx
      puck.vy -= 2 * relativeVelocity * ny
      puck.vx += paddleVelocityX * 0.35
      puck.vy += paddleVelocityY * 0.35
    }
    puck.x = paddle.x + nx * (collisionDistance + 0.5)
    puck.y = paddle.y + ny * (collisionDistance + 0.5)
  }

  const leftGoalEdge = FIELD_WIDTH / 2 - GOAL_WIDTH / 2
  const rightGoalEdge = FIELD_WIDTH / 2 + GOAL_WIDTH / 2
  const nearGoal = puck.x >= leftGoalEdge && puck.x <= rightGoalEdge
  if (puck.y < PUCK_RADIUS && !nearGoal) {
    puck.y = PUCK_RADIUS
    puck.vy = Math.abs(puck.vy)
  } else if (puck.y > FIELD_HEIGHT - PUCK_RADIUS && !nearGoal) {
    puck.y = FIELD_HEIGHT - PUCK_RADIUS
    puck.vy = -Math.abs(puck.vy)
  }

  const speed = Math.hypot(puck.vx, puck.vy)
  const maxSpeed = 610
  if (speed > maxSpeed) {
    puck.vx = (puck.vx / speed) * maxSpeed
    puck.vy = (puck.vy / speed) * maxSpeed
  }
  return null
}
