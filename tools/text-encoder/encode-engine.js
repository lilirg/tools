/**
 * Text Encoder - 编码/解码引擎
 * 提供各种编码/解码功能
 */
;(function (global) {
  'use strict'

  var EncodeEngine = {
    // ============================================
    // Base64 编码
    // ============================================
    base64Encode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        // 处理 Unicode 字符
        var utf8Bytes = this._utf8ToBytes(text)
        var binary = ''
        for (var i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i])
        }
        return btoa(binary)
      } catch (e) {
        return { error: 'Base64 编码失败: ' + e.message }
      }
    },

    // ============================================
    // Base64 解码
    // ============================================
    base64Decode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        var binary = atob(text)
        var bytes = []
        for (var i = 0; i < binary.length; i++) {
          bytes.push(binary.charCodeAt(i))
        }
        return this._bytesToUtf8(bytes)
      } catch (e) {
        return { error: 'Base64 解码失败: ' + e.message }
      }
    },

    // ============================================
    // URL 编码
    // ============================================
    urlEncode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        return encodeURIComponent(text)
      } catch (e) {
        return { error: 'URL 编码失败: ' + e.message }
      }
    },

    // ============================================
    // URL 解码
    // ============================================
    urlDecode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        return decodeURIComponent(text.replace(/\+/g, ' '))
      } catch (e) {
        return { error: 'URL 解码失败: ' + e.message }
      }
    },

    // ============================================
    // HTML 实体编码
    // ============================================
    htmlEncode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        var div = document.createElement('div')
        div.appendChild(document.createTextNode(text))
        return div.innerHTML
      } catch (e) {
        return { error: 'HTML 编码失败: ' + e.message }
      }
    },

    // ============================================
    // HTML 实体解码
    // ============================================
    htmlDecode: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        var div = document.createElement('div')
        div.innerHTML = text
        return div.textContent || div.innerText || ''
      } catch (e) {
        return { error: 'HTML 解码失败: ' + e.message }
      }
    },

    // ============================================
    // Unicode 转义（\uXXXX）
    // ============================================
    unicodeEscape: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        var result = ''
        for (var i = 0; i < text.length; i++) {
          var code = text.charCodeAt(i)
          if (code < 128) {
            result += text.charAt(i)
          } else {
            result += '\\u' + ('0000' + code.toString(16)).slice(-4)
          }
        }
        return result
      } catch (e) {
        return { error: 'Unicode 转义失败: ' + e.message }
      }
    },

    // ============================================
    // Unicode 反转义
    // ============================================
    unicodeUnescape: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        return text.replace(/\\u([0-9a-fA-F]{4})/g, function (match, hex) {
          return String.fromCharCode(parseInt(hex, 16))
        })
      } catch (e) {
        return { error: 'Unicode 反转义失败: ' + e.message }
      }
    },

    // ============================================
    // ROT13 编码/解码
    // ============================================
    rot13: function (text) {
      try {
        if (typeof text !== 'string') {
          throw new TypeError('输入必须是字符串')
        }
        var result = ''
        for (var i = 0; i < text.length; i++) {
          var char = text.charAt(i)
          var code = text.charCodeAt(i)

          if (code >= 65 && code <= 90) {
            // A-Z
            result += String.fromCharCode(((code - 65 + 13) % 26) + 65)
          } else if (code >= 97 && code <= 122) {
            // a-z
            result += String.fromCharCode(((code - 97 + 13) % 26) + 97)
          } else {
            result += char
          }
        }
        return result
      } catch (e) {
        return { error: 'ROT13 处理失败: ' + e.message }
      }
    },

    // ============================================
    // 辅助方法：UTF-8 字符串转字节数组
    // ============================================
    _utf8ToBytes: function (str) {
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
          // 代理对
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

    // ============================================
    // 辅助方法：字节数组转 UTF-8 字符串
    // ============================================
    _bytesToUtf8: function (bytes) {
      var result = ''
      var i = 0
      while (i < bytes.length) {
        var byte1 = bytes[i]
        if (byte1 < 0x80) {
          result += String.fromCharCode(byte1)
          i++
        } else if (byte1 >= 0xC0 && byte1 < 0xE0) {
          var byte2 = bytes[i + 1]
          result += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F))
          i += 2
        } else if (byte1 >= 0xE0 && byte1 < 0xF0) {
          var byte2 = bytes[i + 1]
          var byte3 = bytes[i + 2]
          result += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F))
          i += 3
        } else {
          var byte2 = bytes[i + 1]
          var byte3 = bytes[i + 2]
          var byte4 = bytes[i + 3]
          var cp = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F)
          cp -= 0x10000
          result += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00)
          i += 4
        }
      }
      return result
    }
  }

  // 暴露到全局
  global.EncodeEngine = EncodeEngine

})(typeof window !== 'undefined' ? window : this)