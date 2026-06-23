/**
 * Text Encoder - UI 交互层
 * 处理所有 UI 交互、Tab 切换、编码/解码、哈希计算、文本统计
 *
 * 依赖: TextEncoderConfig, EncodeEngine, HashEngine, StatsEngine
 */
;(function (global) {
  'use strict'

  var Config = global.TextEncoderConfig
  var EncodeEngine = global.EncodeEngine
  var HashEngine = global.HashEngine
  var StatsEngine = global.StatsEngine

  // ============================================
  // Toast 提示
  // ============================================
  var TEToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'te-toast te-toast-' + type
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
    _key: 'te_history',
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
  // 文本编码器主应用
  // ============================================
  function TextEncoderApp() {
    this._init()
  }

  TextEncoderApp.prototype = {
    constructor: TextEncoderApp,

    _init: function () {
      this._cacheDOM()
      this._initTabs()
      this._initEncodeTypes()
      this._initHashAlgorithms()
      this._initPresetSamples()
      this._bindEvents()
      this._loadHistory()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // Tab 相关
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Tab1 - 编码/解码
        encodeInput: document.getElementById('encodeInput'),
        encodeType: document.getElementById('encodeType'),
        encodeBtn: document.getElementById('encodeBtn'),
        decodeBtn: document.getElementById('decodeBtn'),
        encodeResult: document.getElementById('encodeResult'),
        encodeResultText: document.getElementById('encodeResultText'),
        copyEncodeResult: document.getElementById('copyEncodeResult'),
        encodeDirection: document.getElementById('encodeDirection'),

        // Tab2 - 哈希计算
        hashInput: document.getElementById('hashInput'),
        hashAlgorithms: document.querySelectorAll('input[name="hashAlgo"]'),
        calcHashBtn: document.getElementById('calcHashBtn'),
        hashResults: document.getElementById('hashResults'),
        hashResultContainer: document.getElementById('hashResultContainer'),

        // Tab3 - 文本统计
        statsInput: document.getElementById('statsInput'),
        statsGrid: document.getElementById('statsGrid'),

        // 预设样本
        presetSamples: document.getElementById('presetSamples'),

        // 历史记录
        historyList: document.getElementById('historyList')
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
    // 初始化编码类型下拉
    // ============================================
    _initEncodeTypes: function () {
      var select = this.$.encodeType
      if (!select) return

      select.innerHTML = ''
      Config.ENCODE_TYPES.forEach(function (type) {
        var option = document.createElement('option')
        option.value = type.value
        option.textContent = type.label
        select.appendChild(option)
      })
    },

    // ============================================
    // 初始化哈希算法复选框
    // ============================================
    _initHashAlgorithms: function () {
      var container = document.getElementById('hashAlgoList')
      if (!container) return

      container.innerHTML = ''
      Config.HASH_ALGORITHMS.forEach(function (algo, index) {
        var label = document.createElement('label')
        label.className = 'hash-algo-label'

        var checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.name = 'hashAlgo'
        checkbox.value = algo.value
        if (index === 0) checkbox.checked = true

        var span = document.createElement('span')
        span.textContent = algo.label

        label.appendChild(checkbox)
        label.appendChild(span)
        container.appendChild(label)
      })

      // 更新引用
      this.$.hashAlgorithms = document.querySelectorAll('input[name="hashAlgo"]')
    },

    // ============================================
    // 初始化预设样本
    // ============================================
    _initPresetSamples: function () {
      var select = this.$.presetSamples
      if (!select) return

      select.innerHTML = '<option value="">📝 选择预设文本...</option>'
      Config.PRESET_SAMPLES.forEach(function (sample) {
        var option = document.createElement('option')
        option.value = sample.value
        option.textContent = sample.label
        select.appendChild(option)
      })
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 编码/解码 =====
      if (this.$.encodeBtn) {
        this.$.encodeBtn.addEventListener('click', function () {
          self._doEncode()
        })
      }

      if (this.$.decodeBtn) {
        this.$.decodeBtn.addEventListener('click', function () {
          self._doDecode()
        })
      }

      if (this.$.copyEncodeResult) {
        this.$.copyEncodeResult.addEventListener('click', function () {
          self._copyResult('encodeResultText')
        })
      }

      // ===== 哈希计算 =====
      if (this.$.calcHashBtn) {
        this.$.calcHashBtn.addEventListener('click', function () {
          self._doHash()
        })
      }

      // ===== 文本统计（实时） =====
      if (this.$.statsInput) {
        var statsTimer
        this.$.statsInput.addEventListener('input', function () {
          clearTimeout(statsTimer)
          statsTimer = setTimeout(function () {
            self._updateStats()
          }, 200)
        })
      }

      // ===== 预设样本选择 =====
      if (this.$.presetSamples) {
        this.$.presetSamples.addEventListener('change', function () {
          var value = this.value
          if (!value) return

          // 填充到当前活跃 tab 的输入框
          var activeTab = document.querySelector('.tab-content.active')
          if (activeTab) {
            var textarea = activeTab.querySelector('textarea')
            if (textarea) {
              textarea.value = value
              // 触发 input 事件
              var event = new Event('input', { bubbles: true })
              textarea.dispatchEvent(event)
            }
          }
        })
      }

      // ===== 编码/解码快捷键（Enter） =====
      if (this.$.encodeInput) {
        this.$.encodeInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && e.ctrlKey) {
            self._doEncode()
          }
        })
      }

      // ===== 哈希快捷键（Enter） =====
      if (this.$.hashInput) {
        this.$.hashInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && e.ctrlKey) {
            self._doHash()
          }
        })
      }
    },

    // ============================================
    // 执行编码
    // ============================================
    _doEncode: function () {
      var text = this.$.encodeInput.value
      var type = this.$.encodeType.value

      if (!text) {
        TEToast.warning('请输入要编码的文本')
        return
      }

      var result
      switch (type) {
        case 'base64':
          result = EncodeEngine.base64Encode(text)
          break
        case 'url':
          result = EncodeEngine.urlEncode(text)
          break
        case 'html':
          result = EncodeEngine.htmlEncode(text)
          break
        case 'unicode':
          result = EncodeEngine.unicodeEscape(text)
          break
        case 'rot13':
          result = EncodeEngine.rot13(text)
          break
        default:
          result = { error: '不支持的编码类型' }
      }

      if (result && typeof result === 'object' && result.error) {
        TEToast.error(result.error)
        return
      }

      this.$.encodeResultText.textContent = result
      this.$.encodeResult.classList.add('show')

      // 添加历史记录
      HistoryManager.add({
        type: 'encode',
        title: '编码: ' + type,
        detail: text.substring(0, 50) + (text.length > 50 ? '...' : '')
      })
      this._loadHistory()

      TEToast.success('编码完成')
    },

    // ============================================
    // 执行解码
    // ============================================
    _doDecode: function () {
      var text = this.$.encodeInput.value
      var type = this.$.encodeType.value

      if (!text) {
        TEToast.warning('请输入要解码的文本')
        return
      }

      var result
      switch (type) {
        case 'base64':
          result = EncodeEngine.base64Decode(text)
          break
        case 'url':
          result = EncodeEngine.urlDecode(text)
          break
        case 'html':
          result = EncodeEngine.htmlDecode(text)
          break
        case 'unicode':
          result = EncodeEngine.unicodeUnescape(text)
          break
        case 'rot13':
          result = EncodeEngine.rot13(text)
          break
        default:
          result = { error: '不支持的编码类型' }
      }

      if (result && typeof result === 'object' && result.error) {
        TEToast.error(result.error)
        return
      }

      this.$.encodeResultText.textContent = result
      this.$.encodeResult.classList.add('show')

      // 添加历史记录
      HistoryManager.add({
        type: 'decode',
        title: '解码: ' + type,
        detail: text.substring(0, 50) + (text.length > 50 ? '...' : '')
      })
      this._loadHistory()

      TEToast.success('解码完成')
    },

    // ============================================
    // 执行哈希计算
    // ============================================
    _doHash: function () {
      var self = this
      var text = this.$.hashInput.value

      if (!text) {
        TEToast.warning('请输入要计算哈希的文本')
        return
      }

      // 获取选中的算法
      var selectedAlgos = []
      this.$.hashAlgorithms.forEach(function (checkbox) {
        if (checkbox.checked) {
          selectedAlgos.push(checkbox.value)
        }
      })

      if (selectedAlgos.length === 0) {
        TEToast.warning('请至少选择一种哈希算法')
        return
      }

      // 显示加载状态
      this.$.hashResultContainer.innerHTML = '<div class="hash-loading">⏳ 计算中...</div>'
      this.$.hashResults.classList.add('show')

      // 并行计算所有选中的哈希
      var promises = selectedAlgos.map(function (algo) {
        return self._computeHash(algo, text)
      })

      Promise.all(promises).then(function (results) {
        var html = ''
        results.forEach(function (result) {
          if (result.error) {
            html += '<div class="hash-result-item error">' +
              '<div class="hash-result-label">' + result.label + '</div>' +
              '<div class="hash-result-value error">❌ ' + result.error + '</div>' +
              '</div>'
          } else {
            html += '<div class="hash-result-item">' +
              '<div class="hash-result-label">' + result.label + '</div>' +
              '<div class="hash-result-value" data-hash="' + result.value + '">' +
              '<code>' + result.value + '</code>' +
              '<button class="btn btn-small btn-copy-hash" data-hash="' + result.value + '">📋 复制</button>' +
              '</div>' +
              '</div>'
          }
        })

        self.$.hashResultContainer.innerHTML = html

        // 绑定复制按钮
        self.$.hashResultContainer.querySelectorAll('.btn-copy-hash').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var hash = this.dataset.hash
            self._copyText(hash, '哈希值已复制到剪贴板')
          })
        })

        // 添加历史记录
        HistoryManager.add({
          type: 'hash',
          title: '哈希: ' + selectedAlgos.join(', '),
          detail: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        })
        self._loadHistory()

        TEToast.success('哈希计算完成')
      }).catch(function (err) {
        self.$.hashResultContainer.innerHTML = '<div class="hash-loading error">❌ 计算失败: ' + err.message + '</div>'
        TEToast.error('哈希计算失败')
      })
    },

    // ============================================
    // 计算单个哈希
    // ============================================
    _computeHash: function (algo, text) {
      var labelMap = {
        'md5': 'MD5',
        'sha1': 'SHA-1',
        'sha256': 'SHA-256',
        'sha512': 'SHA-512'
      }

      var methodMap = {
        'md5': HashEngine.md5,
        'sha1': HashEngine.sha1,
        'sha256': HashEngine.sha256,
        'sha512': HashEngine.sha512
      }

      var method = methodMap[algo]
      if (!method) {
        return Promise.resolve({ label: labelMap[algo] || algo, error: '不支持的算法' })
      }

      return method.call(HashEngine, text).then(function (value) {
        return { label: labelMap[algo] || algo, value: value }
      }).catch(function (err) {
        return { label: labelMap[algo] || algo, error: err.message }
      })
    },

    // ============================================
    // 更新文本统计
    // ============================================
    _updateStats: function () {
      var text = this.$.statsInput.value
      var stats = StatsEngine.getAllStats(text)
      var grid = this.$.statsGrid

      if (!grid) return

      var html = ''
      var keys = [
        'charCount', 'charCountNoSpace', 'wordCount', 'lineCount',
        'byteCount', 'cjkCount', 'letterCount', 'digitCount',
        'punctuationCount', 'spaceCount', 'uniqueWords'
      ]

      keys.forEach(function (key) {
        var label = Config.STATS_LABELS[key] || key
        var value = stats[key]
        var iconMap = {
          charCount: '📝',
          charCountNoSpace: '📝',
          wordCount: '📖',
          lineCount: '📃',
          byteCount: '💾',
          cjkCount: '🀄',
          letterCount: '🔤',
          digitCount: '🔢',
          punctuationCount: '❗',
          spaceCount: '␣',
          uniqueWords: '🎯'
        }
        var icon = iconMap[key] || '📊'

        html += '<div class="stat-item">' +
          '<div class="stat-icon">' + icon + '</div>' +
          '<div class="stat-value">' + (typeof value === 'number' ? value.toLocaleString() : value) + '</div>' +
          '<div class="stat-label">' + label + '</div>' +
          '</div>'
      })

      grid.innerHTML = html
    },

    // ============================================
    // 复制结果
    // ============================================
    _copyResult: function (elementId) {
      var el = document.getElementById(elementId)
      if (!el) return

      var text = el.textContent
      this._copyText(text, '结果已复制到剪贴板')
    },

    // ============================================
    // 复制文本
    // ============================================
    _copyText: function (text, successMsg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          TEToast.success(successMsg || '已复制到剪贴板')
        }).catch(function () {
          this._fallbackCopy(text, successMsg)
        }.bind(this))
      } else {
        this._fallbackCopy(text, successMsg)
      }
    },

    // ============================================
    // 降级复制方案
    // ============================================
    _fallbackCopy: function (text, successMsg) {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        TEToast.success(successMsg || '已复制到剪贴板')
      } catch (e) {
        TEToast.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
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
        container.innerHTML = '<span class="history-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'history-item'

        var typeIcon = {
          'encode': '🔐',
          'decode': '🔓',
          'hash': '#️⃣',
          'stats': '📊'
        }

        var icon = typeIcon[item.type] || '📋'

        var title = document.createElement('div')
        title.className = 'history-title'
        title.textContent = icon + ' ' + item.title
        div.appendChild(title)

        var detail = document.createElement('div')
        detail.className = 'history-detail'
        detail.textContent = item.detail
        div.appendChild(detail)

        var removeBtn = document.createElement('button')
        removeBtn.className = 'remove-history'
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
  global.TextEncoderApp = TextEncoderApp

  document.addEventListener('DOMContentLoaded', function () {
    global._textEncoderApp = new TextEncoderApp()
  })

})(typeof window !== 'undefined' ? window : this)