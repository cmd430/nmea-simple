const AIS_CHARS = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_ !"#\$%&\'()*+,-./0123456789:<=>?'
const BUFFER_TIMEOUT_MS = 10000

function charTo6Bit(char: string): number {
  let code = char.charCodeAt(0)
  if (code < 48 || code > 119 || (code > 87 && code < 96)) return 0
  code -= 48
  if (code > 40) code -= 8
  return code
}

function decodeAisString(bits: string): string {
  let result = ''
  for (let i = 0; i < bits.length; i += 6) {
    const chunk = bits.substring(i, i + 6)
    if (chunk.length < 6) break
    result += AIS_CHARS[parseInt(chunk, 2)]
  }
  return result.replace(/@+$/, '').trim()
}

function readSignedInt(bits: string): number {
  if (bits[0] === '1') {
    let inverted = ''
    for (let i = 0; i < bits.length; i++) {
      inverted += bits[i] === '0' ? '1' : '0'
    }
    return -(parseInt(inverted, 2) + 1)
  }
  return parseInt(bits, 2)
}

export interface FlatAisData {
  messageType?: number
  mmsi?: number
  navStatus?: number
  sog?: number
  longitude?: number
  latitude?: number
  cog?: number
  heading?: number
  isClassB?: boolean
  imoNumber?: number
  callSign?: string
  vesselName?: string
  vesselType?: number
  destination?: string
  partNumber?: number
}

interface BufferedFragments {
  fragments: string[]
  expectedCount: number
  timestamp: number
}

export class AisStreamAssembler {
  private buffer: Map<string, BufferedFragments> = new Map()

  public processAndDecode(
    sentenceId: string,
    messageId: number | null,
    channel: string,
    totalFragments: number,
    fragmentNumber: number,
    payload: string,
    fillBits: number
  ): FlatAisData | null {
    this.cleanupStaleFragments()

    if (totalFragments === 1) {
      return this.decodePayload(payload, fillBits)
    }

    const cacheKey = `${sentenceId}-${messageId || ''}-${channel}`

    let state = this.buffer.get(cacheKey)
    if (!state) {
      state = {
        fragments: new Array(totalFragments),
        expectedCount: totalFragments,
        timestamp: Date.now()
      }
      this.buffer.set(cacheKey, state)
    }

    state.fragments[fragmentNumber - 1] = payload

    const dynamicCount = state.fragments.filter(f => f !== undefined).length
    if (dynamicCount === state.expectedCount) {
      this.buffer.delete(cacheKey)
      const fullPayload = state.fragments.join('')
      return this.decodePayload(fullPayload, fillBits)
    }

    return null
  }

  private cleanupStaleFragments(): void {
    const now = Date.now()
    for (const [key, value] of this.buffer.entries()) {
      if (now - value.timestamp > BUFFER_TIMEOUT_MS) {
        this.buffer.delete(key)
      }
    }
  }

  private decodePayload(payload: string, fillBits: number): FlatAisData | null {
    let bits = ''
    for (let i = 0; i < payload.length; i++) {
      bits += charTo6Bit(payload[i]!).toString(2).padStart(6, '0')
    }
    if (fillBits > 0 && bits.length > fillBits) {
      bits = bits.substring(0, bits.length - fillBits)
    }

    if (bits.length < 38) return null
    const messageType = parseInt(bits.substring(0, 6), 2)
    const mmsi = parseInt(bits.substring(8, 38), 2)

    if (messageType === 1 || messageType === 2 || messageType === 3) {
      if (bits.length < 168) return null
      return {
        messageType,
        mmsi,
        navStatus: parseInt(bits.substring(38, 42), 2),
        sog: parseInt(bits.substring(50, 60), 2) / 10,
        longitude: readSignedInt(bits.substring(61, 89)) / 600000,
        latitude: readSignedInt(bits.substring(89, 116)) / 600000,
        cog: parseInt(bits.substring(116, 128), 2) / 10,
        heading: parseInt(bits.substring(128, 137), 2),
        isClassB: false
      }
    }

    if (messageType === 18) {
      if (bits.length < 168) return null
      return {
        messageType,
        mmsi,
        sog: parseInt(bits.substring(46, 56), 2) / 10,
        longitude: readSignedInt(bits.substring(57, 85)) / 600000,
        latitude: readSignedInt(bits.substring(85, 112)) / 600000,
        cog: parseInt(bits.substring(112, 124), 2) / 10,
        heading: parseInt(bits.substring(124, 133), 2),
        isClassB: true
      }
    }

    if (messageType === 5) {
      if (bits.length < 424) return null
      return {
        messageType,
        mmsi,
        imoNumber: parseInt(bits.substring(40, 70), 2),
        callSign: decodeAisString(bits.substring(70, 112)),
        vesselName: decodeAisString(bits.substring(112, 232)),
        vesselType: parseInt(bits.substring(232, 240), 2),
        destination: decodeAisString(bits.substring(302, 422))
      }
    }

    if (messageType === 24) {
      if (bits.length < 40) return null
      const partNumber = parseInt(bits.substring(38, 40), 2)

      if (partNumber === 0) {
        if (bits.length < 160) return null
        return {
          messageType,
          mmsi,
          partNumber,
          vesselName: decodeAisString(bits.substring(40, 160)),
          isClassB: true
        }
      } else if (partNumber === 1) {
        if (bits.length < 168) return null
        return {
          messageType,
          mmsi,
          partNumber,
          vesselType: parseInt(bits.substring(40, 48), 2),
          callSign: decodeAisString(bits.substring(48, 90)),
          isClassB: true
        }
      }
    }

    return null
  }
}

export const sharedAssembler = new AisStreamAssembler()
