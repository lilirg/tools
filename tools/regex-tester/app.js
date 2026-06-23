/**
 * Regex Tester - UI 交互层
 * 处理所有 UI 交互、实时匹配、替换测试、模板选择
 *
 * 依赖: RegexConfig, RegexEngine
 */
;(function (global) {
  'use strict'

  var Config = global.RegexConfig
  var RegexEngine = global.RegexEngine

  // ============================================
  // Toast 提示
  // ============================================
  var RTToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'rt-toast rt-toast-' + type
      toast.textContent = message
      document.body.appendChild(toast)

      setTimeout(function () { toast.classList.add('show') }, 10)
      setTimeout(function () {
        toast.classList.remove('show')
        toast.classList.add('hide')
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast)
        }, 300)
      }, 2500)
    },
    success: function (msg) { this.show(msg, 'success') },
    error: function (msg) { this.show(msg, 'error') },
    warning: function (msg) { this.show(msg, 'warning') },
    info: function (msg) { this.show(msg, 'info') }
  }

  // ============================================
  // 历史记录管理
  // ============================================
  var HistoryManager = {
    _key: Config.STORAGE_KEYS.history,
    _items: [],

    load: function () {
      try {
        var data = localStorage.getItem(this._key)
        this._items = data ? JSON.parse(data) : []
      } catch (e) {
        this._items = []
      }
      return this._items
    },

    save: function () {
      try {
        localStorage.setItem(this._key, JSON.stringify(this._items))
      } catch (e) {}
    },

    add: function (record) {
      this.load()
      record.time = Date.now()
      this._items.unshift(record)
      if (this._items.length > Config.MAX_HISTORY) {
        this._items = this._items.slice(0, Config.MAX_HISTORY)
      }
      this.save()
    },

    remove: function (index) {
      this.load()
      if (index >= 0 && index < this._items.length) {
        this._items.splice(index, 1)
        this.save()
      }
    },

    getAll: function () {
      this.load()
      return this._items
    },

    clear: function () {
      this._items = []
      this.save()
    }
  }

  // ============================================
  // 正则测试主应用
  // ============================================
  function RegexTesterApp() {
    this._init()
  }

  RegexTesterApp.prototype = {
    constructor: RegexTesterApp,

    _init: function () {
      this._cacheDOM()
      this._initTemplates()
      this._initFlags()
      this._initSyntaxReference()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
      this._doTest()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // 正则输入
        patternInput: document.getElementById('patternInput'),
        patternDisplay: document.getElementById('patternDisplay'),

        // 修饰符
        flagCheckboxes: document.querySelectorAll('.rt-flag-checkbox'),

        // 测试文本
        testText: document.getElementById('testText'),
        testHighlight: document.getElementById('testHighlight'),

        // 替换
        replacementInput: document.getElementById('replacementInput'),
        replaceBtn: document.getElementById('replaceBtn'),
        replaceResult: document.getElementById('replaceResult'),
        replaceCount: document.getElementById('replaceCount'),

        // 模板
        templateSelect: document.getElementById('templateSelect'),

        // 匹配结果
        matchCount: document.getElementById('matchCount'),
        matchList: document.getElementById('matchList'),

        // 语法参考
        syntaxToggle: document.getElementById('syntaxToggle'),
        syntaxContent: document.getElementById('syntaxContent'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // 初始化模板
    // ============================================
    _initTemplates: function () {
      var select = this.$.templateSelect
      if (!select) return

      select.innerHTML = '<option value="">📝 选择常用模板...</option>'
      var templates = RegexEngine.getTemplateList()
      templates.forEach(function (tpl) {
        var option = document.createElement('option')
        option.value = tpl.pattern + '|' + tpl.flags
        option.textContent = tpl.label
        option.title = tpl.desc
        select.appendChild(option)
      })
    },

    // ============================================
    // 初始化修饰符
    // ============================================
    _initFlags: function () {
      var container = document.getElementById('flagToggles')
      if (!container) return

      container.innerHTML = ''
      Config.FLAGS.forEach(function (flag) {
        var label = document.createElement('label')
        label.className = 'rt-flag-label'
        label.title = flag.desc

        var checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = 'rt-flag-checkbox'
        checkbox.value = flag.value
        if (flag.value === 'g') checkbox.checked = true

        var span = document.createElement('span')
        span.textContent = flag.label

        label.appendChild(checkbox)
        label.appendChild(span)
        container.appendChild(label)
      })

      // 更新引用
      this.$.flagCheckboxes = document.querySelectorAll('.rt-flag-checkbox')
    },

    // ============================================
    // 初始化语法参考
    // ============================================
    _initSyntaxReference: function () {
      var container = this.$.syntaxContent
      if (!container) return

      var refs = RegexEngine.getSyntaxReference()
      var html = ''

      refs.forEach(function (section) {
        html += '<div class="rt-syntax-section">'
        html += '<h4>' + section.category + '</h4>'
        html += '<table class="rt-syntax-table">'
        section.items.forEach(function (item) {
          html += '<tr>' +
            '<td class="rt-syntax-code"><code>' + item.syntax + '</code></td>' +
            '<td class="rt-syntax-desc">' + item.desc + '</td>' +
            '</tr>'
        })
        html += '</table>'
        html += '</div>'
      })

      container.innerHTML = html
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        var lastPattern = localStorage.getItem(Config.STORAGE_KEYS.lastPattern)
        if (lastPattern && this.$.patternInput) {
          this.$.patternInput.value = lastPattern
        }

        var lastFlags = localStorage.getItem(Config.STORAGE_KEYS.lastFlags)
        if (lastFlags && this.$.flagCheckboxes) {
          this.$.flagCheckboxes.forEach(function (cb) {
            cb.checked = lastFlags.indexOf(cb.value) >= 0
          })
        }

        var lastTestText = localStorage.getItem(Config.STORAGE_KEYS.lastTestText)
        if (lastTestText && this.$.testText) {
          this.$.testText.value = lastTestText
        }
      } catch (e) {}
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 正则输入（实时匹配） =====
      if (this.$.patternInput) {
        var patternTimer
        this.$.patternInput.addEventListener('input', function () {
          clearTimeout(patternTimer)
          patternTimer = setTimeout(function () {
            self._updatePatternDisplay()
            self._doTest()
            self._saveState()
          }, 200)
        })
      }

      // ===== 修饰符变化 =====
      this.$.flagCheckboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
          self._doTest()
          self._saveState()
        })
      })

      // ===== 测试文本变化（实时匹配） =====
      if (this.$.testText) {
        var textTimer
        this.$.testText.addEventListener('input', function () {
          clearTimeout(textTimer)
          textTimer = setTimeout(function () {
            self._doTest()
            self._saveState()
          }, 200)
        })
      }

      // ===== 模板选择 =====
      if (this.$.templateSelect) {
        this.$.templateSelect.addEventListener('change', function () {
          var value = this.value
          if (!value) return

          var parts = value.split('|')
          if (parts.length === 2) {
            self.$.patternInput.value = parts[0]
            // 设置修饰符
            var flags = parts[1]
            self.$.flagCheckboxes.forEach(function (cb) {
              cb.checked = flags.indexOf(cb.value) >= 0
            })
            self._updatePatternDisplay()
            self._doTest()
            self._saveState()
            RTToast.info('已加载模板')
          }
        })
      }

      // ===== 替换 =====
      if (this.$.replaceBtn) {
        this.$.replaceBtn.addEventListener('click', function () {
          self._doReplace()
        })
      }

      // ===== 语法参考折叠 =====
      if (this.$.syntaxToggle) {
        this.$.syntaxToggle.addEventListener('click', function () {
          var content = self.$.syntaxContent
          if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block'
            this.textContent = '📖 语法参考 (点击收起)'
          } else {
            content.style.display = 'none'
            this.textContent = '📖 语法参考 (点击展开)'
          }
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          RTToast.success('历史记录已清空')
        })
      }
    },

    // ============================================
    // 更新正则显示
    // ============================================
    _updatePatternDisplay: function () {
      if (!this.$.patternDisplay) return

      var pattern = this.$.patternInput.value
      var flags = this._getFlags()

      if (pattern) {
        this.$.patternDisplay.textContent = '/' + pattern + '/' + flags
        this.$.patternDisplay.className = 'rt-pattern-display'
      } else {
        this.$.patternDisplay.textContent = '输入正则表达式开始测试...'
        this.$.patternDisplay.className = 'rt-pattern-display rt-pattern-hint'
      }
    },

    // ============================================
    // 获取当前修饰符
    // ============================================
    _getFlags: function () {
      var flags = ''
      this.$.flagCheckboxes.forEach(function (cb) {
        if (cb.checked) {
          flags += cb.value
        }
      })
      return flags
    },

    // ============================================
    // 执行匹配测试
    // ============================================
    _doTest: function () {
      var pattern = this.$.patternInput.value
      var flags = this._getFlags()
      var text = this.$.testText.value

      // 更新正则显示
      this._updatePatternDisplay()

      // 执行匹配
      var result = RegexEngine.testRegex(pattern, flags, text)

      // 更新高亮
      if (this.$.testHighlight) {
        if (result.error) {
          this.$.testHighlight.innerHTML = RegexEngine.highlightMatches(text, [])
          this.$.testHighlight.innerHTML += '<div class="rt-error-overlay">' + result.error + '</div>'
        } else {
          this.$.testHighlight.innerHTML = RegexEngine.highlightMatches(text, result.matches)
        }
      }

      // 更新匹配计数
      if (this.$.matchCount) {
        if (result.error) {
          this.$.matchCount.textContent = '❌ ' + result.error
          this.$.matchCount.className = 'rt-match-count rt-match-error'
        } else {
          this.$.matchCount.textContent = '找到 ' + result.count + ' 处匹配'
          this.$.matchCount.className = 'rt-match-count rt-match-ok'
        }
      }

      // 更新匹配列表
      this._updateMatchList(result.matches)
    },

    // ============================================
    // 更新匹配列表
    // ============================================
    _updateMatchList: function (matches) {
      var container = this.$.matchList
      if (!container) return

      if (!matches || matches.length === 0) {
        container.innerHTML = '<span class="rt-empty">无匹配结果</span>'
        return
      }

      var html = ''
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i]
        html += '<div class="rt-match-item" data-index="' + i + '">'
        html += '<div class="rt-match-header">'
        html += '<span class="rt-match-num">#' + (i + 1) + '</span>'
        html += '<span class="rt-match-pos">位置: ' + m.index + '-' + (m.index + m.length) + '</span>'
        html += '</div>'
        html += '<div class="rt-match-value">' + RegexEngine._escapeHtml(m.fullMatch) + '</div>'

        if (m.groups && m.groups.length > 0) {
          html += '<div class="rt-match-groups">'
          m.groups.forEach(function (g) {
            html += '<span class="rt-group-item">' +
              '<span class="rt-group-label">$' + g.index + ':</span> ' +
              '<span class="rt-group-value">' + (g.value !== null ? RegexEngine._escapeHtml(g.value) : '<em>null</em>') + '</span>' +
              '</span>'
          })
          html += '</div>'
        }

        html += '</div>'
      }

      container.innerHTML = html
    },

    // ============================================
    // 执行替换
    // ============================================
    _doReplace: function () {
      var pattern = this.$.patternInput.value
      var flags = this._getFlags()
      var replacement = this.$.replacementInput.value
      var text = this.$.testText.value

      if (!pattern) {
        RTToast.warning('请输入正则表达式')
        return
      }
      if (!text) {
        RTToast.warning('请输入测试文本')
        return
      }

      var result = RegexEngine.replaceRegex(pattern, flags, replacement, text)

      if (result.error) {
        RTToast.error(result.error)
        return
      }

      if (this.$.replaceResult) {
        this.$.replaceResult.textContent = result.result
      }
      if (this.$.replaceCount) {
        this.$.replaceCount.textContent = '替换了 ' + result.count + ' 处'
      }

      RTToast.success('替换完成，共替换 ' + result.count + ' 处')

      // 添加历史记录
      HistoryManager.add({
        type: 'replace',
        title: '正则替换',
        detail: '/' + pattern + '/' + flags + ' → ' + replacement
      })
      this._loadHistory()
    },

    // ============================================
    // 保存状态
    // ============================================
    _saveState: function () {
      try {
        if (this.$.patternInput) {
          localStorage.setItem(Config.STORAGE_KEYS.lastPattern, this.$.patternInput.value)
        }
        if (this.$.flagCheckboxes) {
          var flags = this._getFlags()
          localStorage.setItem(Config.STORAGE_KEYS.lastFlags, flags)
        }
        if (this.$.testText) {
          localStorage.setItem(Config.STORAGE_KEYS.lastTestText, this.$.testText.value)
        }
      } catch (e) {}
    },

    // ============================================
    // 历史记录
    // ============================================
    _loadHistory: function () {
      var items = HistoryManager.getAll()
      var container = this.$.historyList
      var self = this

      if (!container) return

      if (items.length === 0) {
        container.innerHTML = '<span class="rt-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'rt-history-item'

        var icon = item.type === 'replace' ? '🔄' : '📋'

        var title = document.createElement('div')
        title.className = 'rt-history-title'
        title.textContent = icon + ' ' + item.title
        div.appendChild(title)

        var detail = document.createElement('div')
        detail.className = 'rt-history-detail'
        detail.textContent = item.detail
        div.appendChild(detail)

        var removeBtn = document.createElement('button')
        removeBtn.className = 'rt-history-remove'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          HistoryManager.remove(index)
          self._loadHistory()
        })
        div.appendChild(removeBtn)

        container.appendChild(div)
      })
    }
  }

  // ============================================
  // 初始化
  // ============================================
  global.RegexTesterApp = RegexTesterApp

  document.addEventListener('DOMContentLoaded', function () {
    global._regexTesterApp = new RegexTesterApp()
  })

})(typeof window !== 'undefined' ? window : this)