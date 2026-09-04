/*
 * === MTW - Water Temperature ===
 *
 * ------------------------------------------------------------------------------
 *        1   2  3
 *        |   |  |
 * $--MTW,x.x,a,*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 *
 * 1. Water Temperature in Celsius
 * 2. Unit, C (celsius)
 * 3. Checksum
 */

import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'MTW' = 'MTW'
export const sentenceName = 'Water temperature'


export interface MTWPacket extends PacketStub<typeof sentenceId> {
  waterTemperature: number
}


export function decodeSentence(stub: PacketStub, fields: string[]): MTWPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    waterTemperature: parseFloatSafe(fields[1]),
  }
}
