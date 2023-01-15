import { logger } from '@libp2p/logger'
import { codes } from '../errors.js'
import {
  setDelayedInterval,
  clearDelayedInterval
// @ts-expect-error set-delayed-interval does not export types
} from 'set-delayed-interval'
import { namespaceToCid } from './utils.js'
import {
  RELAY_RENDEZVOUS_NS
} from './constants.js'
import type { AddressSorter } from '@libp2p/interface-peer-store'
import type { Startable } from '@libp2p/interfaces/startable'
import type { Components } from '../components.js'

const log = logger('libp2p:relay')

export interface RelayAdvertiseConfig {
  bootDelay?: number
  enabled?: boolean
  ttl?: number
}

export interface HopConfig {
  enabled?: boolean
  active?: boolean
}

export interface AutoRelayConfig {
  enabled?: boolean

  /**
   * maximum number of relays to listen
   */
  maxListeners: number
}

export interface RelayInit {
  addressSorter?: AddressSorter
  maxListeners?: number
  onError?: (error: Error, msg?: string) => void
  hop: HopConfig
  advertise: RelayAdvertiseConfig
}

export class Relay implements Startable {
  private readonly components: Components
  private readonly init: RelayInit
  private timeout?: any
  private started: boolean

  /**
   * Creates an instance of Relay
   */
  constructor (components: Components, init: RelayInit) {
    this.components = components
    this.started = false
    this.init = init
    this._advertiseService = this._advertiseService.bind(this)
  }

  isStarted () {
    return this.started
  }

  /**
   * Start Relay service
   */
  async start () {
    // Advertise service if HOP enabled
    if (this.init.hop.enabled !== false && this.init.advertise.enabled !== false) {
      this.timeout = setDelayedInterval(
        this._advertiseService, this.init.advertise.ttl, this.init.advertise.bootDelay
      )
    }

    this.started = true
  }

  /**
   * Stop Relay service
   */
  async stop () {
    if (this.timeout != null) {
      clearDelayedInterval(this.timeout)
    }

    this.started = false
  }

  /**
   * Advertise hop relay service in the network.
   */
  async _advertiseService () {
    try {
      const cid = await namespaceToCid(RELAY_RENDEZVOUS_NS)
      await this.components.contentRouting.provide(cid)
    } catch (err: any) {
      if (err.code === codes.ERR_NO_ROUTERS_AVAILABLE) {
        log.error('a content router, such as a DHT, must be provided in order to advertise the relay service', err)
        // Stop the advertise
        await this.stop()
      } else {
        log.error(err)
      }
    }
  }
}
