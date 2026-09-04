/*
 * === DBT - Depth below transducer ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3   4 5   6 7
 *        |   | |   | |   | |
 * $--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Depth, feet
 * 2. f = feet
 * 3. Depth, meters
 * 4. M = meters
 * 5. Depth, Fathoms
 * 6. F = Fathoms
 * 7. Checksum
 */

import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'DBT' = 'DBT'
export const sentenceName = 'Depth below transducer'


export interface DBTPacket extends PacketStub<typeof sentenceId> {
  depthFeet: number
  depthMeters: number
  depthFathoms: number
}


export function decodeSentence(stub: PacketStub, fields: string[]): DBTPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    depthFeet: parseFloatSafe(fields[1]),
    depthMeters: parseFloatSafe(fields[3]),
    depthFathoms: parseFloatSafe(fields[5])
  }
}
