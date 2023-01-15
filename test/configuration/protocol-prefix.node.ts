/* eslint-env mocha */

import { expect } from 'aegir/chai'
import mergeOptions from 'merge-options'
import { validateConfig } from '../../src/config.js'
import { createLibp2pNode, Libp2pNode } from '../../src/libp2p.js'
import { baseOptions } from './utils.js'

describe('Protocol prefix is configurable', () => {
  let libp2p: Libp2pNode

  afterEach(async () => {
    if (libp2p != null) {
      await libp2p.stop()
    }
  })

  it('protocolPrefix is provided', async () => {
    const testProtocol = 'test-protocol'
    libp2p = await createLibp2pNode(mergeOptions(baseOptions, {
      identify: {
        protocolPrefix: testProtocol
      },
      ping: {
        protocolPrefix: testProtocol
      },
      fetch: {
        protocolPrefix: testProtocol
      }
    }))
    await libp2p.start()

    const protocols = await libp2p.peerStore.protoBook.get(libp2p.peerId)
    expect(protocols).to.include.members([
      `/${testProtocol}/fetch/0.0.1`,
      '/libp2p/circuit/relay/0.2.0/hop',
      `/${testProtocol}/id/1.0.0`,
      `/${testProtocol}/id/push/1.0.0`,
      `/${testProtocol}/ping/1.0.0`
    ])
  })

  it('protocolPrefix is not provided', async () => {
    libp2p = await createLibp2pNode(validateConfig(baseOptions))
    await libp2p.start()

    const protocols = await libp2p.peerStore.protoBook.get(libp2p.peerId)
    expect(protocols).to.include.members([
      '/libp2p/circuit/relay/0.2.0/hop',
      '/ipfs/id/1.0.0',
      '/ipfs/id/push/1.0.0',
      '/ipfs/ping/1.0.0',
      '/libp2p/fetch/0.0.1'
    ])
  })
})
