/**
 * JSON Formatter - UI 交互层
 * 处理所有 UI 交互、Tab 切换、格式化/对比操作
 *
 * 依赖: JsonConfig, JsonEngine, DiffEngine
 */
;(function (global) {
  'use strict'

  var Config = global.JsonConfig
  var JsonEngine = global.JsonEngine
  var DiffEngine = global.DiffEngine

  // ============================================
  // Toast 提示
  // ============================================
  var JFToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'jf-toast jf-toast-' + type
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
  // JSON 格式化主应用
  // ============================================
  function JsonFormatterApp() {
    this._init()
  }

  JsonFormatterApp.prototype = {
    constructor: JsonFormatterApp,

    _init: function () {
      this._cacheDOM()
      this._initTabs()
      this._initIndentOptions()
      this._initViewModes()
      this._initDiffModes()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // Tab 相关
        tabBtns: document.querySelectorAll('.jf-tab-btn'),
        tabContents: document.querySelectorAll('.jf-tab-content'),

        // Tab1 - 格式化
        inputJSON: document.getElementById('inputJSON'),
        outputJSON: document.getElementById('outputJSON'),
        formatBtn: document.getElementById('formatBtn'),
        compressBtn: document.getElementById('compressBtn'),
        validateBtn: document.getElementById('validateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        clearBtn: document.getElementById('clearBtn'),
        indentSelect: document.getElementById('indentSelect'),
        viewModeSelect: document.getElementById('viewModeSelect'),
        errorDisplay: document.getElementById('errorDisplay'),
        queryInput: document.getElementById('queryInput'),
        queryBtn: document.getElementById('queryBtn'),
        queryResult: document.getElementById('queryResult'),

        // Tab2 - 对比
        leftJSON: document.getElementById('leftJSON'),
        rightJSON: document.getElementById('rightJSON'),
        diffBtn: document.getElementById('diffBtn'),
        diffResult: document.getElementById('diffResult'),
        diffModeSelect: document.getElementById('diffModeSelect'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // Tab 切换
    // ============================================
    _initTabs: function () {
      var self = this
      var tabs = this.$.tabBtns
      var contents = this.$.tabContents

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) { t.classList.remove('active') })
          contents.forEach(function (c) { c.classList.remove('active') })

          tab.classList.add('active')
          if (contents[index]) contents[index].classList.add('active')
        })
      })
    },

    // ============================================
    // 初始化选项
    // ============================================
    _initIndentOptions: function () {
      var select = this.$.indentSelect
      if (!select) return

      select.innerHTML = ''
      Config.INDENT_OPTIONS.forEach(function (opt) {
        var option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        select.appendChild(option)
      })
      select.value = Config.DEFAULTS.indent
    },

    _initViewModes: function () {
      var select = this.$.viewModeSelect
      if (!select) return

      select.innerHTML = ''
      Config.VIEW_MODES.forEach(function (mode) {
        var option = document.createElement('option')
        option.value = mode.value
        option.textContent = mode.label
        select.appendChild(option)
      })
    },

    _initDiffModes: function () {
      var select = this.$.diffModeSelect
      if (!select) return

      select.innerHTML = ''
      Config.DIFF_MODES.forEach(function (mode) {
        var option = document.createElement('option')
        option.value = mode.value
        option.textContent = mode.label
        select.appendChild(option)
      })
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        var lastIndent = localStorage.getItem(Config.STORAGE_KEYS.lastIndent)
        if (lastIndent !== null && this.$.indentSelect) {
          this.$.indentSelect.value = lastIndent
        }

        var lastViewMode = localStorage.getItem(Config.STORAGE_KEYS.lastViewMode)
        if (lastViewMode !== null && this.$.viewModeSelect) {
          this.$.viewModeSelect.value = lastViewMode
        }
      } catch (e) {}
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 格式化 =====
      if (this.$.formatBtn) {
        this.$.formatBtn.addEventListener('click', function () {
          self._doFormat()
        })
      }

      // ===== 压缩 =====
      if (this.$.compressBtn) {
        this.$.compressBtn.addEventListener('click', function () {
          self._doCompress()
        })
      }

      // ===== 校验 =====
      if (this.$.validateBtn) {
        this.$.validateBtn.addEventListener('click', function () {
          self._doValidate()
        })
      }

      // ===== 复制 =====
      if (this.$.copyBtn) {
        this.$.copyBtn.addEventListener('click', function () {
          self._copyResult()
        })
      }

      // ===== 清空 =====
      if (this.$.clearBtn) {
        this.$.clearBtn.addEventListener('click', function () {
          self._clearAll()
        })
      }

      // ===== 缩进变化 =====
      if (this.$.indentSelect) {
        this.$.indentSelect.addEventListener('change', function () {
          self._saveState()
        })
      }

      // ===== 视图模式变化 =====
      if (this.$.viewModeSelect) {
        this.$.viewModeSelect.addEventListener('change', function () {
          self._refreshView()
          self._saveState()
        })
      }

      // ===== 路径查询 =====
      if (this.$.queryBtn) {
        this.$.queryBtn.addEventListener('click', function () {
          self._doQuery()
        })
      }
      if (this.$.queryInput) {
        this.$.queryInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            self._doQuery()
          }
        })
      }

      // ===== 对比 =====
      if (this.$.diffBtn) {
        this.$.diffBtn.addEventListener('click', function () {
          self._doDiff()
        })
      }

      // ===== 快捷键 =====
      if (this.$.inputJSON) {
        this.$.inputJSON.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && e.ctrlKey) {
            self._doFormat()
          }
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          JFToast.success('历史记录已清空')
        })
      }
    },

    // ============================================
    // 执行格式化
    // ============================================
    _doFormat: function () {
      var text = this.$.inputJSON.value
      if (!text) {
        JFToast.warning('请输入 JSON 内容')
        return
      }

      if (text.length > Config.MAX_JSON_SIZE) {
        JFToast.error('JSON 内容超过大小限制（' + (Config.MAX_JSON_SIZE / 1024) + 'KB）')
        return
      }

      var indent = this.$.indentSelect ? this.$.indentSelect.value : Config.DEFAULTS.indent
      var result = JsonEngine.formatJSON(text, indent)

      if (result.error) {
        this._showError(result.error)
        return
      }

      this._hideError()
      this._renderOutput(result.result)
      JFToast.success('格式化完成')

      // 添加历史记录
      HistoryManager.add({
        type: 'format',
        title: 'JSON 格式化',
        detail: text.substring(0, 50) + (text.length > 50 ? '...' : '')
      })
      this._loadHistory()
    },

    // ============================================
    // 执行压缩
    // ============================================
    _doCompress: function () {
      var text = this.$.inputJSON.value
      if (!text) {
        JFToast.warning('请输入 JSON 内容')
        return
      }

      var result = JsonEngine.compressJSON(text)
      if (result.error) {
        this._showError(result.error)
        return
      }

      this._hideError()
      this._renderOutput(result.result)
      JFToast.success('压缩完成')

      // 添加历史记录
      HistoryManager.add({
        type: 'compress',
        title: 'JSON 压缩',
        detail: (text.length + ' → ' + result.result.length + ' 字符')
      })
      this._loadHistory()
    },

    // ============================================
    // 执行校验
    // ============================================
    _doValidate: function () {
      var text = this.$.inputJSON.value
      if (!text) {
        JFToast.warning('请输入 JSON 内容')
        return
      }

      var result = JsonEngine.validateJSON(text)
      if (result.valid) {
        JFToast.success('✅ JSON 语法正确')
        this._hideError()
      } else {
        this._showError(result.error)
        JFToast.error('JSON 语法错误')
      }
    },

    // ============================================
    // 渲染输出
    // ============================================
    _renderOutput: function (text) {
      var viewMode = this.$.viewModeSelect ? this.$.viewModeSelect.value : 'code'

      if (viewMode === 'tree') {
        var parsed = JsonEngine.parseJSON(text)
        if (parsed.data) {
          this.$.outputJSON.innerHTML = JsonEngine.buildTreeHTML(parsed.data)
          this.$.outputJSON.className = 'jf-output jf-output-tree'
        }
      } else {
        this.$.outputJSON.innerHTML = JsonEngine.syntaxHighlight(text)
        this.$.outputJSON.className = 'jf-output jf-output-code'
      }

      this._lastOutput = text
    },

    // ============================================
    // 刷新视图
    // ============================================
    _refreshView: function () {
      if (this._lastOutput) {
        this._renderOutput(this._lastOutput)
      }
    },

    // ============================================
    // 路径查询
    // ============================================
    _doQuery: function () {
      var text = this.$.inputJSON.value
      var path = this.$.queryInput.value

      if (!text) {
        JFToast.warning('请先输入 JSON 内容')
        return
      }

      if (!path) {
        JFToast.warning('请输入查询路径')
        return
      }

      var parsed = JsonEngine.parseJSON(text)
      if (parsed.error) {
        this.$.queryResult.innerHTML = '<span class="jf-error">' + parsed.error + '</span>'
        return
      }

      var result = JsonEngine.queryJSON(parsed.data, path)
      if (result.error) {
        this.$.queryResult.innerHTML = '<span class="jf-error">' + result.error + '</span>'
        return
      }

      var formatted = JSON.stringify(result.result, null, 2)
      this.$.queryResult.innerHTML = '<pre class="jf-query-value">' + JsonEngine.syntaxHighlight(formatted) + '</pre>'
    },

    // ============================================
    // 执行对比
    // ============================================
    _doDiff: function () {
      var leftText = this.$.leftJSON.value
      var rightText = this.$.rightJSON.value

      if (!leftText || !rightText) {
        JFToast.warning('请同时输入左右两个 JSON')
        return
      }

      var leftParsed = JsonEngine.parseJSON(leftText)
      var rightParsed = JsonEngine.parseJSON(rightText)

      if (leftParsed.error) {
        JFToast.error('左侧 JSON 错误: ' + leftParsed.error)
        return
      }
      if (rightParsed.error) {
        JFToast.error('右侧 JSON 错误: ' + rightParsed.error)
        return
      }

      var diffs = DiffEngine.diff(leftParsed.data, rightParsed.data)
      var mode = this.$.diffModeSelect ? this.$.diffModeSelect.value : 'inline'
      var html = DiffEngine.generateDiffHTML(diffs, mode)

      this.$.diffResult.innerHTML = html
      JFToast.success('对比完成，发现 ' + diffs.length + ' 处差异')

      // 添加历史记录
      HistoryManager.add({
        type: 'diff',
        title: 'JSON 对比',
        detail: '发现 ' + diffs.length + ' 处差异'
      })
      this._loadHistory()
    },

    // ============================================
    // 复制结果
    // ============================================
    _copyResult: function () {
      if (!this._lastOutput) {
        JFToast.warning('暂无结果可复制')
        return
      }

      this._copyText(this._lastOutput, '结果已复制到剪贴板')
    },

    // ============================================
    // 清空
    // ============================================
    _clearAll: function () {
      this.$.inputJSON.value = ''
      this.$.outputJSON.innerHTML = ''
      this.$.outputJSON.className = 'jf-output'
      this.$.errorDisplay.style.display = 'none'
      this.$.queryResult.innerHTML = ''
      this._lastOutput = null
      this.$.inputJSON.focus()
    },

    // ============================================
    // 错误显示
    // ============================================
    _showError: function (message) {
      if (this.$.errorDisplay) {
        this.$.errorDisplay.textContent = '❌ ' + message
        this.$.errorDisplay.style.display = 'block'
      }
    },

    _hideError: function () {
      if (this.$.errorDisplay) {
        this.$.errorDisplay.style.display = 'none'
      }
    },

    // ============================================
    // 复制文本
    // ============================================
    _copyText: function (text, successMsg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          JFToast.success(successMsg || '已复制到剪贴板')
        }).catch(function () {
          this._fallbackCopy(text, successMsg)
        }.bind(this))
      } else {
        this._fallbackCopy(text, successMsg)
      }
    },

    _fallbackCopy: function (text, successMsg) {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        JFToast.success(successMsg || '已复制到剪贴板')
      } catch (e) {
        JFToast.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    },

    // ============================================
    // 保存状态
    // ============================================
    _saveState: function () {
      try {
        if (this.$.indentSelect) {
          localStorage.setItem(Config.STORAGE_KEYS.lastIndent, this.$.indentSelect.value)
        }
        if (this.$.viewModeSelect) {
          localStorage.setItem(Config.STORAGE_KEYS.lastViewMode, this.$.viewModeSelect.value)
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
        container.innerHTML = '<span class="jf-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'jf-history-item'

        var typeIcon = {
          'format': '🔧',
          'compress': '📦',
          'diff': '🔍'
        }
        var icon = typeIcon[item.type] || '📋'

        var title = document.createElement('div')
        title.className = 'jf-history-title'
        title.textContent = icon + ' ' + item.title
        div.appendChild(title)

        var detail = document.createElement('div')
        detail.className = 'jf-history-detail'
        detail.textContent = item.detail
        div.appendChild(detail)

        var removeBtn = document.createElement('button')
        removeBtn.className = 'jf-history-remove'
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
  global.JsonFormatterApp = JsonFormatterApp

  document.addEventListener('DOMContentLoaded', function () {
    global._jsonFormatterApp = new JsonFormatterApp()
  })

})(typeof window !== 'undefined' ? window : this)