/*
 * === MTK - Configuration packet ===
 *
 * ------------------------------------------------------------------------------
 *       1   2 ... n n+1
 *       |   |     | |
 * $--MTKxxx,a,...,a*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Packet type (000-999)
 * 2. - n. Data fields meaning and quantity vary depending on the packet type
 * n+1. Checksum
 */


import { parseIntSafe, parseNumberOrString } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'MTK' = 'MTK'
export const sentenceName = 'Configuration packet'


export interface MTKPacket extends PacketStub<typeof sentenceId> {
  packetType: number
  data: (string | number)[]
}


export function decodeSentence(stub: PacketStub, fields: string[]): MTKPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    packetType: parseIntSafe(stub.sentenceId.slice(3)),
    data: fields.slice(1).map<string|number>(parseNumberOrString)
  }
}
