var aes = require('crypto-js').AES
var debug = require('debug')('secure-webrtc-swarm')
var enc = require('crypto-js').enc.Utf8
var randword = require('secure-randword')
var Swarm = require('webrtc-swarm')

module.exports = Main

Main.generateMnemonic = function (length) {
  return randword(length || 3).join('-')
}

function Main (hub, opts) {
  if (!(this instanceof Main)) return new Main(hub, opts)
  if (!hub) throw new Error('`signalhub` instance required, see: https://github.com/mafintosh/signalhub')
  opts = opts || {}
  var mnemonic = opts.mnemonic || this.generateMnemonic(opts.mnemonicLength)

  opts = Object.assign(opts, {
    wrap: function (data, channel) {
      if (!data.signal || channel === '/all') return data
      let signal = JSON.stringify(data.signal)
      data.signal = aes.encrypt(signal, mnemonic).toString()
      return data
    },
    unwrap: function (data, channel) {
      if (!data.signal) return data
      try {
        var signal = (aes.decrypt(data.signal, mnemonic)).toString(enc)
        data.signal = JSON.parse(signal)
      } catch (e) {
        debug(e)
        return
      }
      return data
    }
  })

  var swarm = new Swarm(hub, opts)
  swarm.mnemonic = mnemonic
  return swarm
}
