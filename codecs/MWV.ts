/*
 * === MWV - Wind speed and angle ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3   4 5
 *        |   | |   | |
 * $--MWV,x.x,a,x.x,a*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 *
 * 1. Wind Angle, 0 to 360 degrees
 * 2. Reference, R = Relative, T = True
 * 3. Wind Speed
 * 4. Wind Speed Units, K/M/N
 * 5. Status, A = Data Valid
 * 6. Checksum
 */

import { parseFloatSafe } from '../helpers'
import { initStubFields, type PacketStub } from './PacketStub'


export const sentenceId: 'MWV' = 'MWV'
export const sentenceName = 'Wind speed and angle'


export interface MWVPacket extends PacketStub<typeof sentenceId> {
  windAngle: number
  reference: 'relative' | 'true'
  speed: number
  units: 'K' | 'M' | 'N'
  status: 'valid' | 'invalid'
}


export function decodeSentence(stub: PacketStub, fields: string[]): MWVPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    windAngle: parseFloatSafe(fields[1]),
    reference: fields[2] === 'R' ? 'relative' : 'true',
    speed: parseFloatSafe(fields[3]),
    units: fields[4] === 'K' ? 'K' : fields[4] === 'M' ? 'M' : 'N',
    status: fields[5] === 'A' ? 'valid' : 'invalid'
  }
}
