import { Status } from './pb/index.js'
import type { ReservationStore as IReservationStore, ReservationStatus } from './interfaces.js'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { PeerId } from '@libp2p/interface-peer-id'

interface Reservation {
  addr: Multiaddr
  expire: Date
}

export class ReservationStore implements IReservationStore {
  private readonly reservations = new Map<string, Reservation>()

  constructor (private readonly limit = 15) {
  }

  async reserve (peer: PeerId, addr: Multiaddr): Promise<{status: ReservationStatus, expire?: number}> {
    if (this.reservations.size >= this.limit && !this.reservations.has(peer.toString())) {
      return { status: Status.RESERVATION_REFUSED, expire: undefined }
    }
    const expire = new Date()
    expire.setHours(expire.getHours() + 12)
    this.reservations.set(peer.toString(), { addr, expire })
    return { status: Status.OK, expire: expire.getTime() }
  }

  async removeReservation (peer: PeerId) {
    this.reservations.delete(peer.toString())
  }

  async hasReservation (dst: PeerId) {
    return this.reservations.has(dst.toString())
  }
}
