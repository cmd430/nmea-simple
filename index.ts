import { decodeSentence as decodeAPB, type APBPacket } from './codecs/APB'
import { decodeSentence as decodeBWC, type BWCPacket } from './codecs/BWC'
import { decodeSentence as decodeDBT, type DBTPacket } from './codecs/DBT'
import { decodeSentence as decodeDPT, type DPTPacket } from './codecs/DPT'
import { decodeSentence as decodeDTM, type DTMPacket } from './codecs/DTM'
import { decodeSentence as decodeGGA, type GGAPacket } from './codecs/GGA'
import { decodeSentence as decodeGLL, type GLLPacket } from './codecs/GLL'
import { decodeSentence as decodeGNS, type GNSPacket } from './codecs/GNS'
import { decodeSentence as decodeGSA, type GSAPacket } from './codecs/GSA'
import { decodeSentence as decodeGST, type GSTPacket } from './codecs/GST'
import { decodeSentence as decodeGSV, type GSVPacket } from './codecs/GSV'
import { decodeSentence as decodeHDG, type HDGPacket } from './codecs/HDG'
import { decodeSentence as decodeHDM, type HDMPacket } from './codecs/HDM'
import { decodeSentence as decodeHDT, type HDTPacket } from './codecs/HDT'
import { decodeSentence as decodeMTK, type MTKPacket } from './codecs/MTK'
import { decodeSentence as decodeMWV, type MWVPacket } from './codecs/MWV'
import { decodeSentence as decodeRDID, type RDIDPacket } from './codecs/RDID'
import { decodeSentence as decodeRMC, type RMCPacket } from './codecs/RMC'
import { decodeSentence as decodeVHW, type VHWPacket } from './codecs/VHW'
import { decodeSentence as decodeVTG, type VTGPacket } from './codecs/VTG'
import { decodeSentence as decodeZDA, type ZDAPacket } from './codecs/ZDA'

import { parseStub, type PacketStub } from './codecs/PacketStub'
import { decodeSentence as decodeUnknown, type UnknownPacket } from './codecs/UnknownPacket'
import { validNmeaChecksum } from './helpers'


export type Packet = APBPacket | BWCPacket | DBTPacket | DPTPacket | DTMPacket | GGAPacket | GLLPacket | GNSPacket | GSAPacket | GSTPacket | GSVPacket | HDGPacket | HDMPacket | HDTPacket | MTKPacket | MWVPacket | RDIDPacket | RMCPacket | VHWPacket | VTGPacket | ZDAPacket
export type { APBPacket, BWCPacket, DBTPacket, DPTPacket, DTMPacket, GGAPacket, GLLPacket, GNSPacket, GSAPacket, GSTPacket, GSVPacket, HDGPacket, HDMPacket, HDTPacket, MTKPacket, MWVPacket, RDIDPacket, RMCPacket, VHWPacket, VTGPacket, ZDAPacket }

export function assertPacketIs<IdType extends string, PacketType extends PacketStub = Packet>(packetId: IdType, packet: PacketType): asserts packet is (PacketType & { sentenceId: IdType }) {
  if (packet.sentenceId !== packetId) {
    throw new Error(`Was expecting packetId of '${packetId}'. Found '${packet.sentenceId}' instead.`)
  }
}

type Decoder = (stub: PacketStub, parts: string[]) => Packet


const decoders: { [sentenceId: string]: Decoder } = {
  APB: decodeAPB,
  BWC: decodeBWC,
  DBT: decodeDBT,
  DPT: decodeDPT,
  DTM: decodeDTM,
  GGA: decodeGGA,
  GLL: decodeGLL,
  GNS: decodeGNS,
  GSA: decodeGSA,
  GST: decodeGST,
  GSV: decodeGSV,
  HDG: decodeHDG,
  HDM: decodeHDM,
  HDT: decodeHDT,
  MTK: decodeMTK,
  MWV: decodeMWV,
  RDID: decodeRDID,
  RMC: decodeRMC,
  VHW: decodeVHW,
  VTG: decodeVTG,
  ZDA: decodeZDA
}


export interface PacketFactory<PacketType> {
  assemble: (stub: PacketStub, fields: string[]) => PacketType | null
  ableToParseBadChecksum: boolean
}


export class DefaultPacketFactory<CustomPacketType = null> implements PacketFactory<Packet | CustomPacketType> {
  ableToParseBadChecksum: boolean

  constructor(ableToParseBadChecksum = false) {
    this.ableToParseBadChecksum = ableToParseBadChecksum
  }

  static getParser(stub: PacketStub): Decoder | undefined {

    // Override for $PMTK314 and similar sentences
    if (stub.sentenceId.slice(0, 3) === 'MTK') {
      return decodeMTK
    }

    return decoders[stub.sentenceId]
  }

  assemble(stub: PacketStub, fields: string[]): Packet | CustomPacketType | null {
    const parser = DefaultPacketFactory.getParser(stub)

    if (parser) {
      return parser(stub, fields)
    }
    else {
      return this.assembleCustomPacket(stub, fields)
    }
  }

  assembleCustomPacket(stub: PacketStub, fields: string[]): CustomPacketType | null {
    return null
  }
}

const DEFAULT_PACKET_FACTORY = new DefaultPacketFactory()


export function parseGenericPacket<PacketType>(sentence: string, factory: PacketFactory<PacketType>): PacketType {
  let chxOk = true

  if (!validNmeaChecksum(sentence)) {
    if (!factory.ableToParseBadChecksum) {
      throw Error(`Invalid sentence: '${sentence}'.`)
    }

    chxOk = false
  }

  const fields = sentence?.split('*')?.[0]?.split(',') ?? []
  const stub = parseStub(fields[0] ?? '', chxOk)
  const packet = factory.assemble(stub, fields)

  if (!packet) {
    throw Error(`No known parser for sentence ID '${stub.sentenceId}'.`)
  }

  return packet
}


export function parseNmeaSentence(sentence: string): Packet {
  return parseGenericPacket(sentence, DEFAULT_PACKET_FACTORY)
}


// Unsafe parsing

export type UnsafePacket = Packet | UnknownPacket

export class UnsafePacketFactory extends DefaultPacketFactory<UnknownPacket> {
  constructor() {
    super(true)
  }

  override assembleCustomPacket(stub: PacketStub<string>, fields: string[]): UnknownPacket | null {
    return decodeUnknown(stub, fields)
  }
}

const UNSAFE_PACKET_FACTORY = new UnsafePacketFactory()


export function parseUnsafeNmeaSentence(sentence: string): UnsafePacket {
  return parseGenericPacket(sentence, UNSAFE_PACKET_FACTORY)
}


export function getUnsafePacketId(packet: UnsafePacket): string {
  return (packet.sentenceId === '?') ? packet.originalPacketId : packet.sentenceId
}
