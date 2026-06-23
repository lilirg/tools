/**
 * Regex Tester - 正则匹配/替换引擎
 *
 * 依赖: RegexConfig
 */
;(function (global) {
  'use strict'

  var Config = global.RegexConfig

  var RegexEngine = {
    // ============================================
    // 正则验证
    // ============================================

    /**
     * 验证正则表达式语法
     * @param {string} pattern - 正则表达式模式
     * @returns {{valid: boolean, error: string|null, position: number|null}}
     */
    validateRegex: function (pattern) {
      if (!pattern || !pattern.trim()) {
        return { valid: false, error: '请输入正则表达式', position: null }
      }

      try {
        new RegExp(pattern)
        return { valid: true, error: null, position: null }
      } catch (e) {
        // 尝试提取错误位置
        var pos = null
        var match = e.message.match(/at position (\d+)/)
        if (match) {
          pos = parseInt(match[1], 10)
        }
        return { valid: false, error: e.message, position: pos }
      }
    },

    // ============================================
    // 正则匹配
    // ============================================

    /**
     * 执行正则匹配
     * @param {string} pattern - 正则模式
     * @param {string} flags - 修饰符
     * @param {string} text - 测试文本
     * @returns {{matches: Array, count: number, error: string|null}}
     */
    testRegex: function (pattern, flags, text) {
      if (!pattern) {
        return { matches: [], count: 0, error: '请输入正则表达式' }
      }
      if (!text) {
        return { matches: [], count: 0, error: '请输入测试文本' }
      }

      // 验证正则
      var validation = this.validateRegex(pattern)
      if (!validation.valid) {
        return { matches: [], count: 0, error: validation.error }
      }

      try {
        var regex = new RegExp(pattern, flags)
        var matches = []
        var match

        // 如果没有全局标志，只匹配一次
        if (!regex.global) {
          match = regex.exec(text)
          if (match) {
            matches.push(this._formatMatch(match))
          }
        } else {
          // 全局匹配
          while ((match = regex.exec(text)) !== null) {
            matches.push(this._formatMatch(match))
            // 防止空匹配死循环
            if (match.index === regex.lastIndex) {
              regex.lastIndex++
            }
          }
        }

        return { matches: matches, count: matches.length, error: null }
      } catch (e) {
        return { matches: [], count: 0, error: e.message }
      }
    },

    /**
     * 格式化匹配结果
     */
    _formatMatch: function (match) {
      var groups = []
      for (var i = 1; i < match.length; i++) {
        groups.push({
          index: i,
          value: match[i] !== undefined ? match[i] : null
        })
      }

      return {
        fullMatch: match[0],
        index: match.index,
        length: match[0].length,
        groups: groups
      }
    },

    // ============================================
    // 正则替换
    // ============================================

    /**
     * 执行正则替换
     * @param {string} pattern - 正则模式
     * @param {string} flags - 修饰符
     * @param {string} replacement - 替换文本
     * @param {string} text - 原始文本
     * @returns {{result: string, count: number, error: string|null}}
     */
    replaceRegex: function (pattern, flags, replacement, text) {
      if (!pattern) {
        return { result: null, count: 0, error: '请输入正则表达式' }
      }
      if (!text) {
        return { result: null, count: 0, error: '请输入测试文本' }
      }

      var validation = this.validateRegex(pattern)
      if (!validation.valid) {
        return { result: null, count: 0, error: validation.error }
      }

      try {
        var regex = new RegExp(pattern, flags)
        var count = 0

        var result = text.replace(regex, function () {
          count++
          // 使用用户提供的替换文本
          if (typeof replacement === 'string') {
            return replacement.replace(/\$(\d+)/g, function (m, num) {
              var index = parseInt(num, 10)
              return arguments[index + 1] !== undefined ? arguments[index + 1] : m
            })
          }
          return replacement
        })

        return { result: result, count: count, error: null }
      } catch (e) {
        return { result: null, count: 0, error: e.message }
      }
    },

    // ============================================
    // 捕获组信息
    // ============================================

    /**
     * 获取正则表达式的捕获组信息
     * @param {string} pattern - 正则模式
     * @param {string} flags - 修饰符
     * @returns {{groups: Array, error: string|null}}
     */
    getGroupInfo: function (pattern, flags) {
      var validation = this.validateRegex(pattern)
      if (!validation.valid) {
        return { groups: [], error: validation.error }
      }

      try {
        var regex = new RegExp(pattern, flags)
        var source = regex.source
        var groups = []
        var groupIndex = 0
        var i = 0

        while (i < source.length) {
          if (source[i] === '\\') {
            i += 2
            continue
          }
          if (source[i] === '(') {
            // 检查是否为非捕获组 (?:...)
            if (source[i + 1] === '?' && source[i + 2] === ':') {
              i++
              continue
            }
            // 检查是否为断言 (?=...) (?!...)
            if (source[i + 1] === '?' && (source[i + 2] === '=' || source[i + 2] === '!')) {
              i++
              continue
            }
            groupIndex++
            groups.push({
              index: groupIndex,
              start: i
            })
          }
          i++
        }

        return { groups: groups, error: null }
      } catch (e) {
        return { groups: [], error: e.message }
      }
    },

    // ============================================
    // 匹配高亮
    // ============================================

    /**
     * 在文本中高亮所有匹配
     * @param {string} text - 原始文本
     * @param {Array} matches - 匹配结果数组
     * @returns {string} 带高亮 HTML 标签的文本
     */
    highlightMatches: function (text, matches) {
      if (!text || !matches || matches.length === 0) {
        return this._escapeHtml(text || '')
      }

      var html = ''
      var lastIndex = 0

      for (var i = 0; i < matches.length; i++) {
        var m = matches[i]
        var start = m.index
        var end = m.index + m.length

        // 添加匹配前的文本
        if (start > lastIndex) {
          html += this._escapeHtml(text.substring(lastIndex, start))
        }

        // 添加匹配的文本（高亮）
        html += '<mark class="rt-match" data-index="' + i + '" title="匹配 ' + (i + 1) + ': ' +
          this._escapeHtml(m.fullMatch) + '">' +
          this._escapeHtml(m.fullMatch) + '</mark>'

        lastIndex = end
      }

      // 添加剩余文本
      if (lastIndex < text.length) {
        html += this._escapeHtml(text.substring(lastIndex))
      }

      return html
    },

    // ============================================
    // 工具方法
    // ============================================

    /**
     * 转义正则特殊字符
     * @param {string} text
     * @returns {string}
     */
    escapeRegex: function (text) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },

    /**
     * 获取模板列表
     * @returns {Array}
     */
    getTemplateList: function () {
      return Config.TEMPLATES
    },

    /**
     * 获取语法参考
     * @returns {Array}
     */
    getSyntaxReference: function () {
      return Config.SYNTAX_REFERENCE
    },

    _escapeHtml: function (str) {
      return String(str).replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
    }
  }

  // 暴露到全局
  global.RegexEngine = RegexEngine

})(typeof window !== 'undefined' ? window : this)