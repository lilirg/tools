/**
 * JSON Formatter - JSON 解析/校验/格式化/转换引擎
 *
 * 依赖: JsonConfig
 */
;(function (global) {
  'use strict'

  var Config = global.JsonConfig

  var JsonEngine = {
    // ============================================
    // JSON 解析与校验
    // ============================================

    /**
     * 解析 JSON 文本
     * @param {string} text - JSON 字符串
     * @returns {{data: *, error: string|null, errorPosition: number|null}}
     */
    parseJSON: function (text) {
      if (!text || !text.trim()) {
        return { data: null, error: '请输入 JSON 内容', errorPosition: null }
      }

      try {
        var data = JSON.parse(text)
        return { data: data, error: null, errorPosition: null }
      } catch (e) {
        // 尝试提取错误位置
        var pos = null
        var match = e.message.match(/position\s+(\d+)/i)
        if (match) {
          pos = parseInt(match[1], 10)
        }
        return { data: null, error: e.message, errorPosition: pos }
      }
    },

    /**
     * 校验 JSON 语法
     * @param {string} text
     * @returns {{valid: boolean, error: string|null, position: number|null}}
     */
    validateJSON: function (text) {
      var result = this.parseJSON(text)
      return {
        valid: result.error === null,
        error: result.error,
        position: result.errorPosition
      }
    },

    // ============================================
    // JSON 格式化
    // ============================================

    /**
     * 格式化 JSON
     * @param {string} text - JSON 字符串
     * @param {number|string} indent - 缩进（2/4/8/'tab'）
     * @returns {{result: string, error: string|null}}
     */
    formatJSON: function (text, indent) {
      if (indent === undefined || indent === null) indent = Config.DEFAULTS.indent

      var parsed = this.parseJSON(text)
      if (parsed.error) {
        return { result: null, error: parsed.error }
      }

      var indentStr
      if (indent === 'tab') {
        indentStr = '\t'
      } else {
        indentStr = new Array(parseInt(indent, 10) + 1).join(' ')
      }

      try {
        var formatted = JSON.stringify(parsed.data, null, indentStr)
        return { result: formatted, error: null }
      } catch (e) {
        return { result: null, error: '格式化失败: ' + e.message }
      }
    },

    /**
     * 压缩 JSON（去除空白）
     * @param {string} text
     * @returns {{result: string, error: string|null}}
     */
    compressJSON: function (text) {
      var parsed = this.parseJSON(text)
      if (parsed.error) {
        return { result: null, error: parsed.error }
      }

      try {
        var compressed = JSON.stringify(parsed.data)
        return { result: compressed, error: null }
      } catch (e) {
        return { result: null, error: '压缩失败: ' + e.message }
      }
    },

    // ============================================
    // 语法高亮
    // ============================================

    /**
     * JSON 语法高亮
     * @param {string} json - 格式化的 JSON 字符串
     * @returns {string} 带 HTML 标签的高亮文本
     */
    syntaxHighlight: function (json) {
      if (!json) return ''

      // 转义 HTML
      json = json.replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')

      // 语法高亮
      return json.replace(
        /("(?:[^"\\]|\\.)*")\s*:/g, // key
        '<span class="jf-key">$1</span>:'
      ).replace(
        /("(?:[^"\\]|\\.)*")/g, // string value
        '<span class="jf-string">$1</span>'
      ).replace(
        /\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, // number
        '<span class="jf-number">$1</span>'
      ).replace(
        /\b(true|false)\b/g, // boolean
        '<span class="jf-boolean">$1</span>'
      ).replace(
        /\bnull\b/g, // null
        '<span class="jf-null">null</span>'
      )
    },

    // ============================================
    // 树形视图
    // ============================================

    /**
     * 构建树形视图 HTML
     * @param {*} data - JSON 数据
     * @param {string} key - 当前键名
     * @returns {string} HTML
     */
    buildTreeHTML: function (data, key) {
      var self = this
      key = key || ''

      if (data === null) {
        return '<span class="jf-tree-leaf"><span class="jf-null">null</span></span>'
      }

      if (typeof data === 'boolean') {
        return '<span class="jf-tree-leaf"><span class="jf-boolean">' + data + '</span></span>'
      }

      if (typeof data === 'number') {
        return '<span class="jf-tree-leaf"><span class="jf-number">' + data + '</span></span>'
      }

      if (typeof data === 'string') {
        return '<span class="jf-tree-leaf"><span class="jf-string">"' + this._escapeHtml(data) + '"</span></span>'
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          return '<span class="jf-tree-leaf">[]</span>'
        }
        var html = '<details class="jf-tree-branch" open>' +
          '<summary class="jf-tree-summary">' +
          (key ? '<span class="jf-key">"' + key + '"</span>: ' : '') +
          '<span class="jf-bracket">[</span><span class="jf-count">' + data.length + ' items</span>' +
          '</summary><div class="jf-tree-children">'
        for (var i = 0; i < data.length; i++) {
          html += '<div class="jf-tree-item">' +
            '<span class="jf-index">' + i + '</span>: ' +
            self.buildTreeHTML(data[i]) +
            (i < data.length - 1 ? ',' : '') +
            '</div>'
        }
        html += '</div><span class="jf-bracket">]</span></details>'
        return html
      }

      if (typeof data === 'object') {
        var keys = Object.keys(data)
        if (keys.length === 0) {
          return '<span class="jf-tree-leaf">{}</span>'
        }
        var html = '<details class="jf-tree-branch" open>' +
          '<summary class="jf-tree-summary">' +
          (key ? '<span class="jf-key">"' + key + '"</span>: ' : '') +
          '<span class="jf-bracket">{</span><span class="jf-count">' + keys.length + ' keys</span>' +
          '</summary><div class="jf-tree-children">'
        for (var i = 0; i < keys.length; i++) {
          html += '<div class="jf-tree-item">' +
            '<span class="jf-key">"' + keys[i] + '"</span>: ' +
            self.buildTreeHTML(data[keys[i]], keys[i]) +
            (i < keys.length - 1 ? ',' : '') +
            '</div>'
        }
        html += '</div><span class="jf-bracket">}</span></details>'
        return html
      }

      return '<span class="jf-tree-leaf">' + String(data) + '</span>'
    },

    // ============================================
    // JSON 路径查询
    // ============================================

    /**
     * JSON 路径查询（简易版 jq）
     * 支持: $.key.subkey, $.key[0], $[0].key
     * @param {*} data - JSON 数据
     * @param {string} path - 路径表达式
     * @returns {{result: *, error: string|null}}
     */
    queryJSON: function (data, path) {
      if (!path || !path.trim()) {
        return { result: data, error: null }
      }

      path = path.trim()

      // 去掉开头的 $.
      if (path.startsWith('$.')) {
        path = path.substring(2)
      } else if (path.startsWith('$')) {
        path = path.substring(1)
      }

      if (!path) {
        return { result: data, error: null }
      }

      // 分割路径
      var parts = path.split(/\./).filter(function (p) { return p })
      var current = data

      for (var i = 0; i < parts.length; i++) {
        var part = parts[i]

        // 处理数组索引: key[0] 或 [0]
        var bracketMatch = part.match(/^([^\[]*)\[(\d+)\]$/)
        if (bracketMatch) {
          var key = bracketMatch[1]
          var index = parseInt(bracketMatch[2], 10)

          if (key) {
            if (current === null || typeof current !== 'object' || !(key in current)) {
              return { result: null, error: '路径不存在: ' + parts.slice(0, i + 1).join('.') }
            }
            current = current[key]
          }

          if (!Array.isArray(current)) {
            return { result: null, error: '索引访问需要数组: ' + parts.slice(0, i + 1).join('.') }
          }
          if (index < 0 || index >= current.length) {
            return { result: null, error: '索引越界: ' + index + ', 数组长度: ' + current.length }
          }
          current = current[index]
        } else {
          // 普通对象键
          if (current === null || typeof current !== 'object' || !(part in current)) {
            return { result: null, error: '路径不存在: ' + parts.slice(0, i + 1).join('.') }
          }
          current = current[part]
        }
      }

      return { result: current, error: null }
    },

    // ============================================
    // JSON ↔ CSV 转换
    // ============================================

    /**
     * JSON 转 CSV（仅支持对象数组）
     * @param {string} text - JSON 字符串
     * @returns {{result: string, error: string|null}}
     */
    jsonToCSV: function (text) {
      var parsed = this.parseJSON(text)
      if (parsed.error) {
        return { result: null, error: parsed.error }
      }

      var data = parsed.data

      // 如果不是数组，转为单元素数组
      if (!Array.isArray(data)) {
        data = [data]
      }

      if (data.length === 0) {
        return { result: '', error: null }
      }

      // 收集所有键
      var keys = {}
      for (var i = 0; i < data.length; i++) {
        if (typeof data[i] === 'object' && data[i] !== null) {
          var objKeys = Object.keys(data[i])
          for (var j = 0; j < objKeys.length; j++) {
            keys[objKeys[j]] = true
          }
        }
      }

      var keyList = Object.keys(keys)
      if (keyList.length === 0) {
        return { result: '', error: null }
      }

      // 生成 CSV
      var csv = ''
      // 表头
      csv += keyList.map(function (k) { return self._escapeCSV(k) }).join(',') + '\n'

      // 数据行
      for (var i = 0; i < data.length; i++) {
        var row = []
        for (var j = 0; j < keyList.length; j++) {
          var val = ''
          if (typeof data[i] === 'object' && data[i] !== null && keyList[j] in data[i]) {
            val = String(data[i][keyList[j]])
          }
          row.push(this._escapeCSV(val))
        }
        csv += row.join(',') + '\n'
      }

      return { result: csv, error: null }
    },

    /**
     * CSV 转 JSON
     * @param {string} csv - CSV 字符串
     * @returns {{result: string, error: string|null}}
     */
    csvToJSON: function (csv) {
      if (!csv || !csv.trim()) {
        return { result: null, error: '请输入 CSV 内容' }
      }

      var lines = csv.split(/\r?\n/).filter(function (line) { return line.trim() })
      if (lines.length < 2) {
        return { result: null, error: 'CSV 至少需要表头行和一行数据' }
      }

      var headers = this._parseCSVLine(lines[0])
      var result = []

      for (var i = 1; i < lines.length; i++) {
        var values = this._parseCSVLine(lines[i])
        var obj = {}
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = values[j] || ''
        }
        result.push(obj)
      }

      return { result: JSON.stringify(result, null, 2), error: null }
    },

    // ============================================
    // 内部工具方法
    // ============================================

    _escapeHtml: function (str) {
      return str.replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
    },

    _escapeCSV: function (str) {
      if (str === null || str === undefined) return ''
      str = String(str)
      if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    },

    _parseCSVLine: function (line) {
      var result = []
      var current = ''
      var inQuotes = false

      for (var i = 0; i < line.length; i++) {
        var ch = line[i]
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"'
              i++
            } else {
              inQuotes = false
            }
          } else {
            current += ch
          }
        } else {
          if (ch === '"') {
            inQuotes = true
          } else if (ch === ',') {
            result.push(current)
            current = ''
          } else {
            current += ch
          }
        }
      }
      result.push(current)
      return result
    }
  }

  var self = JsonEngine

  // 暴露到全局
  global.JsonEngine = JsonEngine

})(typeof window !== 'undefined' ? window : this)