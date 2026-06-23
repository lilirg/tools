/**
 * Text Encoder - 文本统计引擎
 * 提供全面的文本统计分析功能
 */
;(function (global) {
  'use strict'

  var StatsEngine = {
    // ============================================
    // 字符数（含空格）
    // ============================================
    charCount: function (text) {
      if (typeof text !== 'string') return 0
      return text.length
    },

    // ============================================
    // 字符数（不含空格）
    // ============================================
    charCountNoSpace: function (text) {
      if (typeof text !== 'string') return 0
      return text.replace(/\s/g, '').length
    },

    // ============================================
    // 词数
    // ============================================
    wordCount: function (text) {
      if (typeof text !== 'string' || text.trim() === '') return 0
      var words = text.trim().split(/[\s\u3000]+/)
      return words.filter(function (w) { return w.length > 0 }).length
    },

    // ============================================
    // 行数
    // ============================================
    lineCount: function (text) {
      if (typeof text !== 'string') return 0
      if (text === '') return 0
      return text.split(/\r\n|\r|\n/).length
    },

    // ============================================
    // 字节数（UTF-8）
    // ============================================
    byteCount: function (text) {
      if (typeof text !== 'string') return 0
      var bytes = 0
      for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i)
        if (code < 0x80) {
          bytes += 1
        } else if (code < 0x800) {
          bytes += 2
        } else if (code < 0xD800 || code >= 0xE000) {
          bytes += 3
        } else {
          i++
          bytes += 4
        }
      }
      return bytes
    },

    // ============================================
    // 中文字符数
    // ============================================
    cjkCount: function (text) {
      if (typeof text !== 'string') return 0
      var count = 0
      for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i)
        if (
          (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 统一表意文字
          (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 扩展A
          (code >= 0xF900 && code <= 0xFAFF) ||   // CJK 兼容表意文字
          (code >= 0x2F800 && code <= 0x2FA1F)    // CJK 兼容表意文字补充
        ) {
          count++
        }
      }
      return count
    },

    // ============================================
    // 英文字母数
    // ============================================
    letterCount: function (text) {
      if (typeof text !== 'string') return 0
      var matches = text.match(/[a-zA-Z]/g)
      return matches ? matches.length : 0
    },

    // ============================================
    // 数字数
    // ============================================
    digitCount: function (text) {
      if (typeof text !== 'string') return 0
      var matches = text.match(/[0-9]/g)
      return matches ? matches.length : 0
    },

    // ============================================
    // 标点符号数
    // ============================================
    punctuationCount: function (text) {
      if (typeof text !== 'string') return 0
      var matches = text.match(/[!\"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~，。、；：？！「」『』【】《》（）—…·～\u3000]/g)
      return matches ? matches.length : 0
    },

    // ============================================
    // 空格数
    // ============================================
    spaceCount: function (text) {
      if (typeof text !== 'string') return 0
      var matches = text.match(/[\s\u3000]/g)
      return matches ? matches.length : 0
    },

    // ============================================
    // 唯一词数
    // ============================================
    uniqueWords: function (text) {
      if (typeof text !== 'string' || text.trim() === '') return 0
      var words = text.trim().split(/[\s\u3000]+/)
      var unique = {}
      var count = 0
      for (var i = 0; i < words.length; i++) {
        var word = words[i].toLowerCase()
        if (word.length > 0 && !unique.hasOwnProperty(word)) {
          unique[word] = true
          count++
        }
      }
      return count
    },

    // ============================================
    // 获取所有统计数据
    // ============================================
    getAllStats: function (text) {
      if (typeof text !== 'string') {
        return {
          charCount: 0,
          charCountNoSpace: 0,
          wordCount: 0,
          lineCount: 0,
          byteCount: 0,
          cjkCount: 0,
          letterCount: 0,
          digitCount: 0,
          punctuationCount: 0,
          spaceCount: 0,
          uniqueWords: 0
        }
      }

      return {
        charCount: this.charCount(text),
        charCountNoSpace: this.charCountNoSpace(text),
        wordCount: this.wordCount(text),
        lineCount: this.lineCount(text),
        byteCount: this.byteCount(text),
        cjkCount: this.cjkCount(text),
        letterCount: this.letterCount(text),
        digitCount: this.digitCount(text),
        punctuationCount: this.punctuationCount(text),
        spaceCount: this.spaceCount(text),
        uniqueWords: this.uniqueWords(text)
      }
    }
  }

  // 暴露到全局
  global.StatsEngine = StatsEngine

})(typeof window !== 'undefined' ? window : this)