/**
 * JSON Formatter - 差异对比引擎
 * 递归比较两个 JSON 对象，生成差异结果
 *
 * 依赖: JsonConfig
 */
;(function (global) {
  'use strict'

  var DiffEngine = {
    // ============================================
    // 差异类型
    // ============================================
    TYPES: {
      UNCHANGED: 'unchanged',
      ADDED: 'added',
      REMOVED: 'removed',
      MODIFIED: 'modified'
    },

    // ============================================
    // 核心差异比较
    // ============================================

    /**
     * 比较两个值
     * @param {*} obj1 - 旧值
     * @param {*} obj2 - 新值
     * @param {string} path - 当前路径
     * @returns {Array} 差异结果数组
     */
    diff: function (obj1, obj2, path) {
      path = path || ''
      var results = []

      if (obj1 === obj2) {
        // 相同引用或值
        return results
      }

      if (obj1 === null || obj2 === null || typeof obj1 !== typeof obj2) {
        // 类型不同或一方为 null
        results.push({
          type: this.TYPES.MODIFIED,
          path: path,
          oldValue: obj1,
          newValue: obj2
        })
        return results
      }

      if (typeof obj1 !== 'object') {
        // 基本类型
        if (obj1 !== obj2) {
          results.push({
            type: this.TYPES.MODIFIED,
            path: path,
            oldValue: obj1,
            newValue: obj2
          })
        }
        return results
      }

      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        return this._diffArrays(obj1, obj2, path)
      }

      if (Array.isArray(obj1) || Array.isArray(obj2)) {
        // 一个数组一个非数组
        results.push({
          type: this.TYPES.MODIFIED,
          path: path,
          oldValue: obj1,
          newValue: obj2
        })
        return results
      }

      // 两个对象
      return this._diffObjects(obj1, obj2, path)
    },

    /**
     * 比较两个对象
     */
    _diffObjects: function (obj1, obj2, path) {
      var results = []
      var allKeys = {}
      var key

      // 收集所有键
      for (key in obj1) {
        if (obj1.hasOwnProperty(key)) allKeys[key] = true
      }
      for (key in obj2) {
        if (obj2.hasOwnProperty(key)) allKeys[key] = true
      }

      for (key in allKeys) {
        if (allKeys.hasOwnProperty(key)) {
          var childPath = path ? path + '.' + key : key
          var has1 = obj1.hasOwnProperty(key)
          var has2 = obj2.hasOwnProperty(key)

          if (has1 && !has2) {
            results.push({
              type: this.TYPES.REMOVED,
              path: childPath,
              oldValue: obj1[key],
              newValue: undefined
            })
          } else if (!has1 && has2) {
            results.push({
              type: this.TYPES.ADDED,
              path: childPath,
              oldValue: undefined,
              newValue: obj2[key]
            })
          } else {
            var childDiffs = this.diff(obj1[key], obj2[key], childPath)
            results = results.concat(childDiffs)
          }
        }
      }

      return results
    },

    /**
     * 比较两个数组（使用 LCS 算法）
     */
    _diffArrays: function (arr1, arr2, path) {
      var results = []

      // 简单比较：按索引逐个比较
      var maxLen = Math.max(arr1.length, arr2.length)

      for (var i = 0; i < maxLen; i++) {
        var childPath = path + '[' + i + ']'

        if (i >= arr1.length) {
          // 新增
          results.push({
            type: this.TYPES.ADDED,
            path: childPath,
            oldValue: undefined,
            newValue: arr2[i]
          })
        } else if (i >= arr2.length) {
          // 删除
          results.push({
            type: this.TYPES.REMOVED,
            path: childPath,
            oldValue: arr1[i],
            newValue: undefined
          })
        } else {
          var childDiffs = this.diff(arr1[i], arr2[i], childPath)
          results = results.concat(childDiffs)
        }
      }

      return results
    },

    // ============================================
    // 差异结果渲染
    // ============================================

    /**
     * 生成差异高亮 HTML
     * @param {Array} diffs - 差异结果数组
     * @param {string} mode - 'side-by-side' | 'inline'
     * @returns {string} HTML
     */
    generateDiffHTML: function (diffs, mode) {
      mode = mode || 'inline'

      if (!diffs || diffs.length === 0) {
        return '<div class="jf-diff-nochange">✅ 两个 JSON 完全相同</div>'
      }

      if (mode === 'inline') {
        return this._generateInlineDiff(diffs)
      } else {
        return this._generateSideBySideDiff(diffs)
      }
    },

    /**
     * 行内差异模式
     */
    _generateInlineDiff: function (diffs) {
      var html = '<div class="jf-diff-list">'
      html += '<div class="jf-diff-header">' +
        '<span class="jf-diff-stat">共 ' + diffs.length + ' 处差异</span>' +
        '</div>'

      for (var i = 0; i < diffs.length; i++) {
        var d = diffs[i]
        var typeClass = 'jf-diff-' + d.type
        var typeLabel = {
          'added': '新增',
          'removed': '删除',
          'modified': '修改',
          'unchanged': '不变'
        }

        html += '<div class="jf-diff-item ' + typeClass + '">'
        html += '<div class="jf-diff-path">' + this._escapeHtml(d.path) + '</div>'
        html += '<div class="jf-diff-type">' + typeLabel[d.type] + '</div>'

        if (d.type === 'added') {
          html += '<div class="jf-diff-value added">+ ' + this._formatDiffValue(d.newValue) + '</div>'
        } else if (d.type === 'removed') {
          html += '<div class="jf-diff-value removed">- ' + this._formatDiffValue(d.oldValue) + '</div>'
        } else if (d.type === 'modified') {
          html += '<div class="jf-diff-value removed">- ' + this._formatDiffValue(d.oldValue) + '</div>'
          html += '<div class="jf-diff-value added">+ ' + this._formatDiffValue(d.newValue) + '</div>'
        }

        html += '</div>'
      }

      html += '</div>'
      return html
    },

    /**
     * 并排差异模式
     */
    _generateSideBySideDiff: function (diffs) {
      var html = '<div class="jf-diff-side">'
      html += '<div class="jf-diff-side-header">' +
        '<span class="jf-diff-stat">共 ' + diffs.length + ' 处差异</span>' +
        '</div>'

      for (var i = 0; i < diffs.length; i++) {
        var d = diffs[i]
        var typeClass = 'jf-diff-' + d.type
        var typeLabel = {
          'added': '新增',
          'removed': '删除',
          'modified': '修改',
          'unchanged': '不变'
        }

        html += '<div class="jf-diff-side-row ' + typeClass + '">'
        html += '<div class="jf-diff-side-path">' + this._escapeHtml(d.path) + '</div>'
        html += '<div class="jf-diff-side-type">' + typeLabel[d.type] + '</div>'
        html += '<div class="jf-diff-side-old">' +
          (d.type === 'added' ? '' : this._formatDiffValue(d.oldValue)) +
          '</div>'
        html += '<div class="jf-diff-side-new">' +
          (d.type === 'removed' ? '' : this._formatDiffValue(d.newValue)) +
          '</div>'
        html += '</div>'
      }

      html += '</div>'
      return html
    },

    // ============================================
    // 工具方法
    // ============================================

    /**
     * 格式化差异值用于显示
     */
    _formatDiffValue: function (value) {
      if (value === undefined) return '<span class="jf-diff-undefined">undefined</span>'
      if (value === null) return '<span class="jf-null">null</span>'

      if (typeof value === 'string') {
        return '<span class="jf-string">"' + this._escapeHtml(value) + '"</span>'
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return '<span class="jf-number">' + value + '</span>'
      }

      if (typeof value === 'object') {
        try {
          var str = JSON.stringify(value, null, 2)
          if (str.length > 200) {
            str = str.substring(0, 200) + '...'
          }
          return '<span class="jf-diff-object">' + this._escapeHtml(str) + '</span>'
        } catch (e) {
          return String(value)
        }
      }

      return this._escapeHtml(String(value))
    },

    _escapeHtml: function (str) {
      return String(str).replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
    }
  }

  // 暴露到全局
  global.DiffEngine = DiffEngine

})(typeof window !== 'undefined' ? window : this)