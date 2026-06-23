/**
 * Text Encoder - 哈希计算引擎
 * 提供 MD5、SHA-1、SHA-256、SHA-512 哈希计算
 * 优先使用 SubtleCrypto API，提供同步 MD5 作为备选
 */
;(function (global) {
  'use strict'

  // ============================================
  // 同步 MD5 实现（备选方案）
  // ============================================
  var SyncMD5 = {
    _hexChars: '0123456789abcdef',

    _md5Cycle: function (x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3]

      // 第一轮
      a = this._ff(a, b, c, d, k[0], 7, -680876936)
      d = this._ff(d, a, b, c, k[1], 12, -389564586)
      c = this._ff(c, d, a, b, k[2], 17, 606105819)
      b = this._ff(b, c, d, a, k[3], 22, -1044525330)
      a = this._ff(a, b, c, d, k[4], 7, -176418897)
      d = this._ff(d, a, b, c, k[5], 12, 1200080426)
      c = this._ff(c, d, a, b, k[6], 17, -1473231341)
      b = this._ff(b, c, d, a, k[7], 22, -45705983)
      a = this._ff(a, b, c, d, k[8], 7, 1770035416)
      d = this._ff(d, a, b, c, k[9], 12, -1958414417)
      c = this._ff(c, d, a, b, k[10], 17, -42063)
      b = this._ff(b, c, d, a, k[11], 22, -1990404162)
      a = this._ff(a, b, c, d, k[12], 7, 1804603682)
      d = this._ff(d, a, b, c, k[13], 12, -40341101)
      c = this._ff(c, d, a, b, k[14], 17, -1502002290)
      b = this._ff(b, c, d, a, k[15], 22, 1236535329)

      // 第二轮
      a = this._gg(a, b, c, d, k[1], 5, -165796510)
      d = this._gg(d, a, b, c, k[6], 9, -1069501632)
      c = this._gg(c, d, a, b, k[11], 14, 643717713)
      b = this._gg(b, c, d, a, k[0], 20, -373897302)
      a = this._gg(a, b, c, d, k[5], 5, -701558691)
      d = this._gg(d, a, b, c, k[10], 9, 38016083)
      c = this._gg(c, d, a, b, k[15], 14, -660478335)
      b = this._gg(b, c, d, a, k[4], 20, -405537848)
      a = this._gg(a, b, c, d, k[9], 5, 568446438)
      d = this._gg(d, a, b, c, k[14], 9, -1019803690)
      c = this._gg(c, d, a, b, k[3], 14, -187363961)
      b = this._gg(b, c, d, a, k[8], 20, 1163531501)
      a = this._gg(a, b, c, d, k[13], 5, -1444681467)
      d = this._gg(d, a, b, c, k[2], 9, -51403784)
      c = this._gg(c, d, a, b, k[7], 14, 1735328473)
      b = this._gg(b, c, d, a, k[12], 20, -1926607734)

      // 第三轮
      a = this._hh(a, b, c, d, k[5], 4, -378558)
      d = this._hh(d, a, b, c, k[8], 11, -2022574463)
      c = this._hh(c, d, a, b, k[11], 16, 1839030562)
      b = this._hh(b, c, d, a, k[14], 23, -35309556)
      a = this._hh(a, b, c, d, k[1], 4, -1530992060)
      d = this._hh(d, a, b, c, k[4], 11, 1272893353)
      c = this._hh(c, d, a, b, k[7], 16, -155497632)
      b = this._hh(b, c, d, a, k[10], 23, -1094730640)
      a = this._hh(a, b, c, d, k[13], 4, 681279174)
      d = this._hh(d, a, b, c, k[0], 11, -358537222)
      c = this._hh(c, d, a, b, k[3], 16, -722521979)
      b = this._hh(b, c, d, a, k[6], 23, 76029189)
      a = this._hh(a, b, c, d, k[9], 4, -640364487)
      d = this._hh(d, a, b, c, k[12], 11, -421815835)
      c = this._hh(c, d, a, b, k[15], 16, 530742520)
      b = this._hh(b, c, d, a, k[2], 23, -995338651)

      // 第四轮
      a = this._ii(a, b, c, d, k[0], 6, -198630844)
      d = this._ii(d, a, b, c, k[7], 10, 1126891415)
      c = this._ii(c, d, a, b, k[14], 15, -1416354905)
      b = this._ii(b, c, d, a, k[5], 21, -57434055)
      a = this._ii(a, b, c, d, k[12], 6, 1700485571)
      d = this._ii(d, a, b, c, k[3], 10, -1894986606)
      c = this._ii(c, d, a, b, k[10], 15, -1051523)
      b = this._ii(b, c, d, a, k[1], 21, -2054922799)
      a = this._ii(a, b, c, d, k[8], 6, 1873313359)
      d = this._ii(d, a, b, c, k[15], 10, -30611744)
      c = this._ii(c, d, a, b, k[6], 15, -1560198380)
      b = this._ii(b, c, d, a, k[13], 21, 1309151649)
      a = this._ii(a, b, c, d, k[4], 6, -145523070)
      d = this._ii(d, a, b, c, k[11], 10, -1120210379)
      c = this._ii(c, d, a, b, k[2], 15, 718787259)
      b = this._ii(b, c, d, a, k[9], 21, -343485551)

      x[0] = this._add32(a, x[0])
      x[1] = this._add32(b, x[1])
      x[2] = this._add32(c, x[2])
      x[3] = this._add32(d, x[3])
    },

    _add32: function (a, b) {
      return (a + b) & 0xFFFFFFFF
    },

    _ff: function (a, b, c, d, x, s, t) {
      var n = a + ((b & c) | (~b & d)) + x + t
      return this._add32((n << s) | (n >>> (32 - s)), b)
    },

    _gg: function (a, b, c, d, x, s, t) {
      var n = a + ((b & d) | (c & ~d)) + x + t
      return this._add32((n << s) | (n >>> (32 - s)), b)
    },

    _hh: function (a, b, c, d, x, s, t) {
      var n = a + (b ^ c ^ d) + x + t
      return this._add32((n << s) | (n >>> (32 - s)), b)
    },

    _ii: function (a, b, c, d, x, s, t) {
      var n = a + (c ^ (b | ~d)) + x + t
      return this._add32((n << s) | (n >>> (32 - s)), b)
    },

    _strToBytes: function (str) {
      var bytes = []
      for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i)
        if (code < 0x80) {
          bytes.push(code)
        } else if (code < 0x800) {
          bytes.push(0xC0 | (code >> 6))
          bytes.push(0x80 | (code & 0x3F))
        } else if (code < 0xD800 || code >= 0xE000) {
          bytes.push(0xE0 | (code >> 12))
          bytes.push(0x80 | ((code >> 6) & 0x3F))
          bytes.push(0x80 | (code & 0x3F))
        } else {
          i++
          var code2 = str.charCodeAt(i)
          var cp = 0x10000 + ((code - 0xD800) << 10) + (code2 - 0xDC00)
          bytes.push(0xF0 | (cp >> 18))
          bytes.push(0x80 | ((cp >> 12) & 0x3F))
          bytes.push(0x80 | ((cp >> 6) & 0x3F))
          bytes.push(0x80 | (cp & 0x3F))
        }
      }
      return bytes
    },

    _bytesToWords: function (bytes) {
      var words = []
      for (var i = 0; i < bytes.length; i += 4) {
        words.push(
          (bytes[i] << 24) |
          ((bytes[i + 1] || 0) << 16) |
          ((bytes[i + 2] || 0) << 8) |
          (bytes[i + 3] || 0)
        )
      }
      return words
    },

    _wordsToHex: function (words) {
      var hex = ''
      for (var i = 0; i < words.length; i++) {
        var w = words[i]
        hex += this._hexChars[(w >> 28) & 0x0F] +
               this._hexChars[(w >> 24) & 0x0F] +
               this._hexChars[(w >> 20) & 0x0F] +
               this._hexChars[(w >> 16) & 0x0F] +
               this._hexChars[(w >> 12) & 0x0F] +
               this._hexChars[(w >> 8) & 0x0F] +
               this._hexChars[(w >> 4) & 0x0F] +
               this._hexChars[w & 0x0F]
      }
      return hex
    },

    hash: function (text) {
      var bytes = this._strToBytes(text)
      var origLen = bytes.length * 8

      // 填充
      bytes.push(0x80)
      while ((bytes.length * 8) % 512 !== 448) {
        bytes.push(0x00)
      }

      // 追加长度
      for (var i = 0; i < 8; i++) {
        bytes.push((origLen >>> ((7 - i) * 8)) & 0xFF)
      }

      var words = this._bytesToWords(bytes)
      var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476]

      for (var i = 0; i < words.length; i += 16) {
        var block = words.slice(i, i + 16)
        var state = h.slice()
        this._md5Cycle(state, block)
        h[0] = this._add32(h[0], state[0])
        h[1] = this._add32(h[1], state[1])
        h[2] = this._add32(h[2], state[2])
        h[3] = this._add32(h[3], state[3])
      }

      return this._wordsToHex(h)
    }
  }

  // ============================================
  // HashEngine 主对象
  // ============================================
  var HashEngine = {
    _supportsSubtleCrypto: function () {
      return !!(global.crypto && global.crypto.subtle && global.crypto.subtle.digest)
    },

    _textToArrayBuffer: function (text) {
      var encoder = new TextEncoder()
      return encoder.encode(text)
    },

    _arrayBufferToHex: function (buffer) {
      var bytes = new Uint8Array(buffer)
      var hex = ''
      for (var i = 0; i < bytes.length; i++) {
        hex += ('00' + bytes[i].toString(16)).slice(-2)
      }
      return hex
    },

    // ============================================
    // 通用哈希计算（使用 SubtleCrypto）
    // ============================================
    _digest: function (algorithm, text) {
      if (this._supportsSubtleCrypto()) {
        try {
          var data = this._textToArrayBuffer(text)
          return global.crypto.subtle.digest(algorithm, data).then(function (buffer) {
            return this._arrayBufferToHex(buffer)
          }.bind(this))
        } catch (e) {
          return Promise.reject(new Error('SubtleCrypto 计算失败: ' + e.message))
        }
      }
      return Promise.reject(new Error('浏览器不支持 SubtleCrypto API'))
    },

    // ============================================
    // MD5 哈希
    // ============================================
    md5: function (text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('输入必须是字符串'))
      }

      // 优先使用 SubtleCrypto
      if (this._supportsSubtleCrypto()) {
        try {
          return this._digest('MD5', text)
        } catch (e) {
          // 降级到同步实现
        }
      }

      // 使用同步 MD5 实现
      try {
        return Promise.resolve(SyncMD5.hash(text))
      } catch (e) {
        return Promise.reject(new Error('MD5 计算失败: ' + e.message))
      }
    },

    // ============================================
    // SHA-1 哈希
    // ============================================
    sha1: function (text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('输入必须是字符串'))
      }
      return this._digest('SHA-1', text)
    },

    // ============================================
    // SHA-256 哈希
    // ============================================
    sha256: function (text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('输入必须是字符串'))
      }
      return this._digest('SHA-256', text)
    },

    // ============================================
    // SHA-512 哈希
    // ============================================
    sha512: function (text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('输入必须是字符串'))
      }
      return this._digest('SHA-512', text)
    },

    // ============================================
    // HMAC 计算
    // ============================================
    hmac: function (text, key, algorithm) {
      if (typeof text !== 'string' || typeof key !== 'string') {
        return Promise.reject(new TypeError('输入和密钥必须是字符串'))
      }

      if (!this._supportsSubtleCrypto()) {
        return Promise.reject(new Error('浏览器不支持 SubtleCrypto API'))
      }

      var algoMap = {
        'md5': { hash: 'MD5' },
        'sha1': { hash: 'SHA-1' },
        'sha256': { hash: 'SHA-256' },
        'sha512': { hash: 'SHA-512' }
      }

      var algo = algoMap[algorithm] || algoMap['sha256']

      try {
        var keyData = this._textToArrayBuffer(key)
        var textData = this._textToArrayBuffer(text)

        return global.crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: { name: algo.hash } },
          false,
          ['sign']
        ).then(function (cryptoKey) {
          return global.crypto.subtle.sign('HMAC', cryptoKey, textData)
        }).then(function (signature) {
          return this._arrayBufferToHex(signature)
        }.bind(this))
      } catch (e) {
        return Promise.reject(new Error('HMAC 计算失败: ' + e.message))
      }
    },

    // ============================================
    // 同步 MD5（直接调用）
    // ============================================
    md5Sync: function (text) {
      if (typeof text !== 'string') {
        return { error: '输入必须是字符串' }
      }
      try {
        return SyncMD5.hash(text)
      } catch (e) {
        return { error: 'MD5 计算失败: ' + e.message }
      }
    }
  }

  // 暴露到全局
  global.HashEngine = HashEngine

})(typeof window !== 'undefined' ? window : this)