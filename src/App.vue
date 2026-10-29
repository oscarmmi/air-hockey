<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  FIELD_HEIGHT,
  FIELD_WIDTH,
  PADDLE_RADIUS,
  PUCK_RADIUS,
  WINNING_SCORE,
  clampPaddle,
  stepPuck,
  type Puck,
  type Side,
} from './game/logic'

const canvas = ref<HTMLCanvasElement | null>(null)
const playerScore = ref(0)
const cpuScore = ref(0)
const matchStarted = ref(false)
const matchOver = ref(false)
const paused = ref(false)
const bestWins = ref(Number(localStorage.getItem('neon-rink-wins') ?? 0))
const soundOn = ref(false)
const scoreMessage = ref('First to seven takes the rink.')

const player = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT - 91, vx: 0, vy: 0 }
const cpu = { x: FIELD_WIDTH / 2, y: 91, vx: 0, vy: 0 }
const puck: Puck = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, vx: 180, vy: -285 }
let animationFrame = 0
let previousFrame = 0
let serveWait = 0
let pointerId: number | null = null
const pressedKeys = new Set<string>()
let audioContext: AudioContext | null = null

const winner = computed(() => {
  if (!matchOver.value) return ''
  return playerScore.value >= WINNING_SCORE ? 'You win!' : 'Rink rival wins'
})

function playTone(frequency = 420, duration = 0.08) {
  if (!soundOn.value) return
  try {
    audioContext ??= new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.055, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  } catch {
    // Audio is an optional enhancement; gameplay works without it.
  }
}

function launchPuck() {
  puck.x = FIELD_WIDTH / 2 + (Math.random() - 0.5) * 70
  puck.y = FIELD_HEIGHT / 2
  const direction = (playerScore.value + cpuScore.value) % 2 === 0 ? -1 : 1
  puck.vx = (Math.random() - 0.5) * 150
  puck.vy = direction * (270 + Math.random() * 35)
  serveWait = 0
  paused.value = false
  matchStarted.value = true
}

function startOrResume() {
  if (matchOver.value) return
  if (!matchStarted.value || serveWait > 0) launchPuck()
  else paused.value = false
}

function restartMatch() {
  playerScore.value = 0
  cpuScore.value = 0
  matchOver.value = false
  matchStarted.value = false
  paused.value = false
  serveWait = 0
  player.x = FIELD_WIDTH / 2
  player.y = FIELD_HEIGHT - 91
  cpu.x = FIELD_WIDTH / 2
  cpu.y = 91
  puck.x = FIELD_WIDTH / 2
  puck.y = FIELD_HEIGHT / 2
  scoreMessage.value = 'First to seven takes the rink.'
  launchPuck()
}

function recordPoint(scorer: Side) {
  if (scorer === 'player') {
    playerScore.value += 1
    scoreMessage.value = 'Clean shot. Keep the pressure on.'
    playTone(680, 0.16)
  } else {
    cpuScore.value += 1
    scoreMessage.value = 'They found a gap. Bring it back.'
    playTone(190, 0.18)
  }
  puck.x = FIELD_WIDTH / 2
  puck.y = FIELD_HEIGHT / 2
  puck.vx = 0
  puck.vy = 0
  const won = playerScore.value >= WINNING_SCORE || cpuScore.value >= WINNING_SCORE
  if (won) {
    matchOver.value = true
    paused.value = true
    if (playerScore.value >= WINNING_SCORE) {
      bestWins.value += 1
      localStorage.setItem('neon-rink-wins', String(bestWins.value))
      scoreMessage.value = 'The rink is yours. Run it back?'
      playTone(820, 0.28)
    } else {
      scoreMessage.value = 'The rival takes this round. Want a rematch?'
    }
  } else {
    serveWait = 1.05
    paused.value = true
  }
}

function movePlayerByKeys(seconds: number) {
  let dx = 0
  if (pressedKeys.has('ArrowLeft') || pressedKeys.has('a')) dx -= 1
  if (pressedKeys.has('ArrowRight') || pressedKeys.has('d')) dx += 1
  if (pressedKeys.has('ArrowUp')) player.vy = -240
  else if (pressedKeys.has('ArrowDown')) player.vy = 240
  else player.vy = 0
  player.x += dx * 330 * seconds
  if (dx) player.vx = dx * 330
  else player.vx *= 0.78
  player.y += player.vy * seconds
  Object.assign(player, clampPaddle(player, 'player'))
}

function drawTable(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
  gradient.addColorStop(0, '#102b34')
  gradient.addColorStop(0.48, '#0b222b')
  gradient.addColorStop(1, '#102b34')
  context.fillStyle = gradient
  context.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

  context.save()
  context.strokeStyle = 'rgba(102, 231, 223, 0.16)'
  context.lineWidth = 1
  for (let y = 24; y < FIELD_HEIGHT; y += 28) {
    context.beginPath()
    context.moveTo(18, y)
    context.lineTo(FIELD_WIDTH - 18, y)
    context.stroke()
  }
  context.strokeStyle = 'rgba(117, 245, 228, 0.46)'
  context.lineWidth = 2
  context.strokeRect(13, 13, FIELD_WIDTH - 26, FIELD_HEIGHT - 26)

  context.setLineDash([5, 9])
  context.strokeStyle = 'rgba(117, 245, 228, 0.3)'
  context.beginPath()
  context.moveTo(15, FIELD_HEIGHT / 2)
  context.lineTo(FIELD_WIDTH - 15, FIELD_HEIGHT / 2)
  context.stroke()
  context.setLineDash([])

  context.beginPath()
  context.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 66, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(117, 245, 228, 0.3)'
  context.lineWidth = 2
  context.stroke()
  context.beginPath()
  context.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 4, 0, Math.PI * 2)
  context.fillStyle = '#70f3dc'
  context.fill()

  for (const y of [0, FIELD_HEIGHT]) {
    const width = 126
    context.fillStyle = '#09181e'
    context.fillRect(FIELD_WIDTH / 2 - width / 2, y - 4, width, 8)
    context.shadowColor = '#fa756a'
    context.shadowBlur = 14
    context.fillStyle = '#ff8777'
    context.fillRect(FIELD_WIDTH / 2 - width / 2 + 8, y - 2, width - 16, 4)
    context.shadowBlur = 0
  }
  context.restore()

  drawPaddle(context, cpu.x, cpu.y, '#ff8174', 'CPU')
  drawPaddle(context, player.x, player.y, '#72f0d8', 'YOU')

  if (matchStarted.value && !matchOver.value && serveWait <= 0 && !paused.value) {
    context.save()
    context.globalAlpha = 0.35
    context.fillStyle = '#e8ffff'
    context.beginPath()
    context.arc(puck.x - puck.vx * 0.035, puck.y - puck.vy * 0.035, PUCK_RADIUS * 0.72, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  context.save()
  context.shadowColor = '#e4ffff'
  context.shadowBlur = 22
  const puckGlow = context.createRadialGradient(puck.x - 3, puck.y - 3, 1, puck.x, puck.y, PUCK_RADIUS)
  puckGlow.addColorStop(0, '#ffffff')
  puckGlow.addColorStop(0.55, '#d6fff8')
  puckGlow.addColorStop(1, '#76dccc')
  context.fillStyle = puckGlow
  context.beginPath()
  context.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawPaddle(context: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
  context.save()
  context.shadowColor = color
  context.shadowBlur = 20
  context.beginPath()
  context.arc(x, y, PADDLE_RADIUS, 0, Math.PI * 2)
  context.fillStyle = color
  context.fill()
  context.shadowBlur = 0
  context.beginPath()
  context.arc(x, y, PADDLE_RADIUS - 7, 0, Math.PI * 2)
  context.fillStyle = '#10252d'
  context.fill()
  context.beginPath()
  context.arc(x, y, 4, 0, Math.PI * 2)
  context.fillStyle = color
  context.fill()
  context.fillStyle = 'rgba(237, 255, 252, .82)'
  context.font = '700 9px Inter, sans-serif'
  context.textAlign = 'center'
  context.fillText(label, x, y + PADDLE_RADIUS + 13)
  context.restore()
}

function render(timestamp: number) {
  const element = canvas.value
  if (!element) return
  const context = element.getContext('2d')
  if (!context) return
  const bounds = element.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(bounds.width * dpr))
  const height = Math.max(1, Math.round(bounds.height * dpr))
  if (element.width !== width || element.height !== height) {
    element.width = width
    element.height = height
  }
  const scale = Math.min(width / FIELD_WIDTH, height / FIELD_HEIGHT)
  context.setTransform(scale, 0, 0, scale, (width - FIELD_WIDTH * scale) / 2, (height - FIELD_HEIGHT * scale) / 2)

  const seconds = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.035) : 0
  previousFrame = timestamp
  if (matchStarted.value && !matchOver.value) {
    movePlayerByKeys(seconds)
    const cpuTarget = puck.y < FIELD_HEIGHT / 2 ? puck.x + puck.vx * 0.13 : FIELD_WIDTH / 2 + (puck.x - FIELD_WIDTH / 2) * 0.22
    const cpuX = cpu.x + (cpuTarget - cpu.x) * Math.min(1, seconds * 2.25)
    const cpuY = cpu.y + ((puck.y < FIELD_HEIGHT / 2 ? Math.max(82, puck.y - 74) : 92) - cpu.y) * Math.min(1, seconds * 1.55)
    Object.assign(cpu, clampPaddle({ x: cpuX, y: cpuY }, 'cpu'))
    if (serveWait > 0 && !paused.value) {
      serveWait -= seconds
      if (serveWait <= 0) launchPuck()
    } else if (!paused.value) {
      const scorer = stepPuck(puck, seconds, [player, cpu])
      if (scorer) recordPoint(scorer)
    }
  }
  drawTable(context)
  animationFrame = window.requestAnimationFrame(render)
}

function setPlayerFromPointer(event: PointerEvent) {
  const element = canvas.value
  if (!element) return
  const bounds = element.getBoundingClientRect()
  const scale = bounds.width / FIELD_WIDTH
  const localX = (event.clientX - bounds.left) / scale
  const localY = (event.clientY - bounds.top) / scale
  Object.assign(player, clampPaddle({ x: localX, y: localY, vx: 0, vy: 0 }, 'player'))
}

function onPointerDown(event: PointerEvent) {
  pointerId = event.pointerId
  canvas.value?.setPointerCapture(event.pointerId)
  if (!matchStarted.value) startOrResume()
  setPlayerFromPointer(event)
}

function onPointerMove(event: PointerEvent) {
  if (pointerId === event.pointerId) setPlayerFromPointer(event)
}

function onPointerUp(event: PointerEvent) {
  if (pointerId === event.pointerId) pointerId = null
}

function onKeyDown(event: KeyboardEvent) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) event.preventDefault()
  if (key === 'r') restartMatch()
  if (key === 'Escape' && matchStarted.value && !matchOver.value) paused.value = !paused.value
  if (key === ' ' && (!matchStarted.value || serveWait > 0)) startOrResume()
  pressedKeys.add(key)
}

function onKeyUp(event: KeyboardEvent) {
  pressedKeys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  animationFrame = window.requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrame)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  void audioContext?.close()
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Neon Rink home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i></span>
        <span>NEON<span class="brand-light">RINK</span></span>
      </a>
      <div class="season-label"><span class="live-dot"></span> ARCADE MODE <span class="season-divider">/</span> SOLO SERIES</div>
      <button class="sound-toggle" type="button" :aria-pressed="soundOn" @click="soundOn = !soundOn">
        <span class="sound-icon" aria-hidden="true">{{ soundOn ? '♫' : '♪' }}</span>
        {{ soundOn ? 'SOUND ON' : 'SOUND OFF' }}
      </button>
    </header>

    <section id="top" class="intro-row">
      <div>
        <p class="eyebrow"><span>01</span> &nbsp; THE AFTER-HOURS CLASSIC</p>
        <h1>Own the <em>rink.</em></h1>
      </div>
      <p class="intro-copy">Fast hands. Clean angles.<br /><span>One puck. First to seven.</span></p>
    </section>

    <section class="game-layout" aria-label="Neon Rink air hockey game">
      <div class="rink-column">
        <div class="rink-meta">
          <span><span class="status-led" :class="{ active: matchStarted && !paused && !matchOver }"></span> {{ matchOver ? 'MATCH COMPLETE' : paused ? 'READY WHEN YOU ARE' : matchStarted ? 'MATCH IN PROGRESS' : 'RINK IS OPEN' }}</span>
          <span class="round-label">BEST OF 7 <b>·</b> FIRST TO 7</span>
        </div>
        <div class="table-frame" :class="{ 'is-paused': paused || !matchStarted, 'is-finished': matchOver }">
          <canvas
            ref="canvas"
            class="rink-canvas"
            aria-label="Air hockey table. Drag your paddle in the lower half to play."
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          ></canvas>
          <div v-if="!matchStarted || paused || matchOver" class="table-overlay">
            <span class="overlay-kicker">{{ matchOver ? 'FINAL WHISTLE' : matchStarted ? 'POINT ON THE BOARD' : 'YOUR TABLE IS READY' }}</span>
            <h2>{{ winner || (matchStarted ? 'Reset & go.' : 'Feel the flow.') }}</h2>
            <button class="launch-button" type="button" @click="matchOver ? restartMatch() : startOrResume()">
              {{ matchOver ? 'PLAY AGAIN' : matchStarted ? 'NEXT RALLY' : 'DROP THE PUCK' }} <span>↗</span>
            </button>
          </div>
          <div class="table-scan" aria-hidden="true"></div>
        </div>
        <div class="rink-footer"><span>EST. AFTER DARK</span><span>DESIGNED FOR THE REMATCH <b>✳</b></span><span>NO. 07</span></div>
      </div>

      <aside class="match-panel">
        <div class="panel-heading"><span class="eyebrow">TONIGHT'S MATCH</span><span class="match-badge">LIVE TABLE</span></div>
        <div class="scoreboard" aria-live="polite">
          <div class="score-row rival-row">
            <span class="player-avatar rival-avatar">R</span>
            <span class="player-name"><strong>RINK RIVAL</strong><small>CPU · QUICK HANDS</small></span>
            <span class="score-number rival-number">{{ String(cpuScore).padStart(2, '0') }}</span>
          </div>
          <div class="score-divider"><span>VS</span><i></i><i></i><i></i></div>
          <div class="score-row you-row">
            <span class="player-avatar you-avatar">Y</span>
            <span class="player-name"><strong>YOU</strong><small>PLAYER 01 · HOME</small></span>
            <span class="score-number">{{ String(playerScore).padStart(2, '0') }}</span>
          </div>
          <div class="target-track" aria-label="Score toward seven">
            <span v-for="point in WINNING_SCORE" :key="point" class="target-point" :class="{ scored: playerScore >= point }"></span>
          </div>
          <p class="score-caption">{{ scoreMessage }}</p>
        </div>

        <div class="panel-divider"></div>
        <div class="stat-row">
          <span class="stat-label">PERSONAL BEST</span>
          <span class="stat-value">{{ String(bestWins).padStart(2, '0') }} <small>WINS</small></span>
        </div>

        <div class="controls-card">
          <div class="controls-title"><span>HOW TO PLAY</span><span class="controls-spark">✳</span></div>
          <div class="control-line"><span class="control-icon pointer-icon">↕</span><span><strong>DRAG TO MOVE</strong><small>Pointer or touch</small></span></div>
          <div class="control-line"><span class="keycap">A</span><span class="keycap">D</span><span><strong>SLIDE LEFT / RIGHT</strong><small>Arrow keys work too</small></span></div>
          <div class="control-line"><span class="keycap wide-key">R</span><span><strong>RESET MATCH</strong><small>Start fresh anytime</small></span></div>
        </div>

        <button class="reset-button" type="button" @click="restartMatch"><span>↺</span> RESTART MATCH <kbd>R</kbd></button>
        <p class="panel-note">KEEP YOUR PADDLE ON YOUR SIDE.<br />THE REST IS ALL REFLEX. <span>✳</span></p>
      </aside>
    </section>

    <footer class="page-footer">
      <span>BUILT FOR THE LOVE OF THE GAME <b>·</b> NEON RINK 2025</span>
      <span>LOCAL WINS SAVED ON THIS DEVICE <i></i></span>
    </footer>
  </main>
</template>
