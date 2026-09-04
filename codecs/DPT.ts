/*
 * === DPT - Depth of water and transducer offset ===
 *
 * ------------------------------------------------------------------------------
 *        1   2   3   4
 *        |   |   |   |
 * $--DPT,x.x,y.y,z.z*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Depth, meters
 * 2. Offset, meters (positive = up, negative = down)
 * 3. Range scale, optional
 * 4. Checksum
 */

import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'DPT' = 'DPT'
export const sentenceName = 'Depth of water - transducer offset'


export interface DPTPacket extends PacketStub<typeof sentenceId> {
  depth: number
  transducerOffset: number
  rangeScale?: number
  units: 'M'
}


export function decodeSentence(stub: PacketStub, fields: string[]): DPTPacket {
  const range = parseFloatSafe(fields[5])
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    depth: parseFloatSafe(fields[1]),
    transducerOffset: parseFloatSafe(fields[3]),
    rangeScale: range === 0 ? -1 : range,
    units: 'M'
  }
}
