/*
 * === HDM - Heading - magnetic ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3
 *        |   | |
 * $--HDM,x.x,M*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Heading degrees, magnetic
 * 2. M = Magnetic
 * 3. Checksum
 */


import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'HDM' = 'HDM'
export const sentenceName = 'Heading - magnetic'


export interface HDMPacket extends PacketStub<typeof sentenceId> {
  heading: number
}


export function decodeSentence(stub: PacketStub, fields: string[]): HDMPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    heading: parseFloatSafe(fields[1])
  }
}
