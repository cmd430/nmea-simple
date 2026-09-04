/*
 * === HDT - Heading - true ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3
 *        |   | |
 * $--HDT,x.x,T*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Heading degrees, true
 * 2. T = True
 * 3. Checksum
 */


import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'HDT' = 'HDT'
export const sentenceName = 'Heading - true'


export interface HDTPacket extends PacketStub<typeof sentenceId> {
  heading: number
}


export function decodeSentence(stub: PacketStub, fields: string[]): HDTPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    heading: parseFloatSafe(fields[1])
  }
}
