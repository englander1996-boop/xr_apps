import './styles.css'
import {
  CreateStartUpPageContainer,
  ListContainerProperty,
  ListItemContainerProperty,
  OsEventTypeList,
  RebuildPageContainer,
  TextContainerProperty,
  waitForEvenAppBridge,
  type EvenAppBridge,
  type EvenHubEvent,
} from '@evenrealities/even_hub_sdk'

const MESSAGES = [
  'Hello, Even G2!',
  'Tap to see the next message.',
  'You are looking through smart glasses.',
  'Made with @evenrealities/even_hub_sdk',
  'Bye! (tap to loop)',
] as const

const TEXT_CONTAINER_ID = 1
const TEXT_CONTAINER_NAME = 'hello-text'
const CAPTURE_CONTAINER_ID = 2
const CAPTURE_CONTAINER_NAME = 'hello-capture'
const LENS_WIDTH = 576
const TEXT_X = 8
const TEXT_Y = 80
const TEXT_WIDTH = LENS_WIDTH - TEXT_X * 2
const TEXT_HEIGHT = 80

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) throw new Error('Missing #app')

appRoot.innerHTML = `
  <header>
    <h1>Hello, Even G2</h1>
    <p class="status" id="status">Not connected</p>
  </header>
  <section class="card">
    <div class="row">
      <button id="connect-btn">Connect glasses</button>
      <button id="next-btn" class="secondary">Next message</button>
    </div>
  </section>
  <section class="card">
    <p class="status">Current message: <span id="current">${MESSAGES[0]}</span></p>
  </section>
  <section class="card">
    <p class="status">Event log</p>
    <pre id="event-log"></pre>
  </section>
`

const statusEl = document.getElementById('status') as HTMLParagraphElement
const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement
const currentEl = document.getElementById('current') as HTMLSpanElement
const logEl = document.getElementById('event-log') as HTMLPreElement

function setStatus(text: string): void {
  statusEl.textContent = text
}

function setCurrent(text: string): void {
  currentEl.textContent = text
}

function appendLog(line: string): void {
  const stamp = new Date().toLocaleTimeString()
  logEl.textContent = `[${stamp}] ${line}\n` + logEl.textContent
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

let bridge: EvenAppBridge | null = null
let messageIndex = 0
let startupRendered = false

// G2 のタップ/スクロールは List コンテナ経由でしか届かない（テキスト単体だと CLICK_EVENT が
// 飛んでこない）。表示は text にやらせ、イベントを拾うためだけの 1x1 不可視 List を一緒に置く。
function buildPayload(text: string) {
  return {
    containerTotalNum: 2,
    textObject: [
      new TextContainerProperty({
        containerID: TEXT_CONTAINER_ID,
        containerName: TEXT_CONTAINER_NAME,
        content: text,
        xPosition: TEXT_X,
        yPosition: TEXT_Y,
        width: TEXT_WIDTH,
        height: TEXT_HEIGHT,
        isEventCapture: 0,
      }),
    ],
    listObject: [
      new ListContainerProperty({
        containerID: CAPTURE_CONTAINER_ID,
        containerName: CAPTURE_CONTAINER_NAME,
        itemContainer: new ListItemContainerProperty({
          itemCount: 1,
          itemWidth: 1,
          isItemSelectBorderEn: 0,
          itemName: [' '],
        }),
        isEventCapture: 1,
        xPosition: 0,
        yPosition: 0,
        width: 1,
        height: 1,
      }),
    ],
  }
}

async function renderMessage(): Promise<void> {
  const text = MESSAGES[messageIndex]
  setCurrent(text)
  if (!bridge) return

  if (!startupRendered) {
    await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(buildPayload(text)))
    startupRendered = true
  } else {
    await bridge.rebuildPageContainer(new RebuildPageContainer(buildPayload(text)))
  }
}

// listEvent / textEvent / sysEvent のどれに入っているか分からないので順に拾い、
// 数値・文字列どちらの形でも来るので SDK 自身の正規化 fromJson に通す。
function getEventType(event: EvenHubEvent): OsEventTypeList | undefined {
  const raw =
    event.listEvent?.eventType ??
    event.textEvent?.eventType ??
    event.sysEvent?.eventType ??
    (event as { eventType?: unknown }).eventType ??
    (event.jsonData as { eventType?: unknown; event_type?: unknown } | undefined)?.eventType ??
    (event.jsonData as { event_type?: unknown } | undefined)?.event_type
  return OsEventTypeList.fromJson(raw)
}

// Simulator は 1 ジェスチャあたり 4 回くらい同じイベントを連射してくるので、
// 同じ kind が短時間に来たら 2 回目以降は捨てる。
const DEBOUNCE_MS = 250
let lastHandledKind: 'click' | 'double' | null = null
let lastHandledAt = 0

function shouldHandle(kind: 'click' | 'double'): boolean {
  const now = Date.now()
  if (kind === lastHandledKind && now - lastHandledAt < DEBOUNCE_MS) {
    return false
  }
  lastHandledKind = kind
  lastHandledAt = now
  return true
}

function handleEvent(event: EvenHubEvent): void {
  const type = getEventType(event)
  const container = event.listEvent?.containerName ?? event.textEvent?.containerName ?? '-'
  const source = event.listEvent ? 'list' : event.textEvent ? 'text' : event.sysEvent ? 'sys' : 'other'
  appendLog(`event type=${type ?? 'unknown'} source=${source} container=${container}`)

  // シングルタップ: hello-capture (1x1 不可視 List) で eventType 未指定の listEvent として来る。
  // timer-controller.ts の「listEvent && eventType===undefined → CLICK 扱い」と同じパターン。
  let kind: 'click' | 'double' | null = null
  if (type === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    kind = 'double'
  } else if (type === OsEventTypeList.CLICK_EVENT) {
    kind = 'click'
  } else if (type === undefined && event.listEvent && container === CAPTURE_CONTAINER_NAME) {
    kind = 'click'
  }

  if (!kind || !shouldHandle(kind)) return

  if (kind === 'click') {
    messageIndex = (messageIndex + 1) % MESSAGES.length
    void renderMessage()
  } else {
    messageIndex = 0
    void renderMessage()
  }
}

async function connect(): Promise<void> {
  setStatus('Connecting to Even bridge...')
  appendLog('connect requested')

  try {
    bridge = await withTimeout(waitForEvenAppBridge(), 4000)
    bridge.onEvenHubEvent(handleEvent)
    await renderMessage()
    setStatus('Connected. Tap on glasses or press Next message.')
    appendLog('bridge connected')
  } catch (err) {
    console.error(err)
    setStatus('Bridge not available (browser-only mode).')
    appendLog('bridge unavailable')
  }
}

connectBtn.addEventListener('click', () => {
  void connect()
})

nextBtn.addEventListener('click', () => {
  messageIndex = (messageIndex + 1) % MESSAGES.length
  if (bridge) {
    void renderMessage()
  } else {
    setCurrent(MESSAGES[messageIndex])
  }
})

void connect()
