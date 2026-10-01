import { type PacketStub, initStubFields } from './PacketStub'
import { sharedAssembler, type FlatAisData } from './AisBase'

export const sentenceId: 'VDO' = 'VDO'
export const sentenceName = 'AIS VHF Own-ship Unwanted Report / Data'

export interface VDOPacket extends PacketStub<typeof sentenceId>, FlatAisData {
    totalFragments: number
    fragmentNumber: number
    messageId: number | null
    channel: string
}

export function decodeSentence(stub: PacketStub, fields: string[]): VDOPacket {
    const totalFragments = parseInt(fields[1]!, 10)
    const fragmentNumber = parseInt(fields[2]!, 10)
    const messageId = fields[3]! ? parseInt(fields[3]!, 10) : null
    const channel = fields[4]!
    const payload = fields[5]!
    const fillBits = parseInt(fields[6]!, 10)

    const decodedBits = sharedAssembler.processAndDecode(
        sentenceId, messageId, channel, totalFragments, fragmentNumber, payload, fillBits
    )

    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        totalFragments,
        fragmentNumber,
        messageId,
        channel,
        ...decodedBits
    }
}
