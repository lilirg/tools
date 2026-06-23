/**
 * Markdown Editor - UI 交互层
 * 处理所有 UI 交互、事件绑定、历史记录管理
 *
 * 依赖: MarkdownConfig, MarkdownEngine
 */
;(function (global) {
  'use strict'

  var Config = global.MarkdownConfig
  var Engine = global.MarkdownEngine

  // ============================================
  // Toast 提示
  // ============================================
  var MDToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'md-toast md-toast-' + type
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
  // Markdown 编辑器主应用
  // ============================================
  function MarkdownEditorApp() {
    this._init()
  }

  MarkdownEditorApp.prototype = {
    constructor: MarkdownEditorApp,

    _init: function () {
      this._cacheDOM()
      this._initOptions()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
      this._autoSaveDraft()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // 编辑器
        editor: document.getElementById('editor'),
        preview: document.getElementById('preview'),
        previewContainer: document.getElementById('previewContainer'),

        // 工具栏
        toolbar: document.getElementById('toolbar'),
        boldBtn: document.getElementById('boldBtn'),
        italicBtn: document.getElementById('italicBtn'),
        headingBtn: document.getElementById('headingBtn'),
        linkBtn: document.getElementById('linkBtn'),
        imageBtn: document.getElementById('imageBtn'),
        codeBtn: document.getElementById('codeBtn'),
        listBtn: document.getElementById('listBtn'),
        orderedListBtn: document.getElementById('orderedListBtn'),
        quoteBtn: document.getElementById('quoteBtn'),
        tableBtn: document.getElementById('tableBtn'),

        // 操作按钮
        templateSelect: document.getElementById('templateSelect'),
        themeSelect: document.getElementById('themeSelect'),
        fontSizeSelect: document.getElementById('fontSizeSelect'),
        autoPreviewToggle: document.getElementById('autoPreviewToggle'),
        previewBtn: document.getElementById('previewBtn'),
        exportHtmlBtn: document.getElementById('exportHtmlBtn'),
        clearBtn: document.getElementById('clearBtn'),
        wordCount: document.getElementById('wordCount'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // 初始化选项
    // ============================================
    _initOptions: function () {
      var self = this

      // 模板
      Config.TEMPLATES.forEach(function (tpl) {
        var option = document.createElement('option')
        option.value = tpl.name
        option.textContent = tpl.name
        self.$.templateSelect.appendChild(option)
      })

      // 主题
      Config.THEME_OPTIONS.forEach(function (opt) {
        var option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        self.$.themeSelect.appendChild(option)
      })

      // 字号
      Config.FONT_SIZE_OPTIONS.forEach(function (opt) {
        var option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        self.$.fontSizeSelect.appendChild(option)
      })

      // 设置默认值
      this.$.themeSelect.value = Config.DEFAULTS.theme
      this.$.fontSizeSelect.value = Config.DEFAULTS.fontSize
      this.$.autoPreviewToggle.checked = Config.DEFAULTS.autoPreview
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        // 恢复主题
        var savedTheme = localStorage.getItem(Config.STORAGE_KEYS.theme)
        if (savedTheme) {
          this.$.themeSelect.value = savedTheme
          this._applyTheme(savedTheme)
        }

        // 恢复字号
        var savedFontSize = localStorage.getItem(Config.STORAGE_KEYS.fontSize)
        if (savedFontSize) {
          this.$.fontSizeSelect.value = savedFontSize
          this.$.editor.style.fontSize = savedFontSize + 'px'
        }

        // 恢复自动预览
        var savedAutoPreview = localStorage.getItem(Config.STORAGE_KEYS.autoPreview)
        if (savedAutoPreview !== null) {
          this.$.autoPreviewToggle.checked = savedAutoPreview === 'true'
        }

        // 恢复草稿
        var draft = localStorage.getItem(Config.STORAGE_KEYS.draft)
        if (draft) {
          this.$.editor.value = draft
          this._updatePreview()
          this._updateWordCount()
        }
      } catch (e) {}
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 编辑器输入 =====
      if (this.$.editor) {
        this.$.editor.addEventListener('input', function () {
          if (self.$.autoPreviewToggle.checked) {
            self._updatePreview()
          }
          self._updateWordCount()
          self._autoSaveDraft()
        })

        // Tab 键插入空格
        this.$.editor.addEventListener('keydown', function (e) {
          if (e.key === 'Tab') {
            e.preventDefault()
            var start = this.selectionStart
            var end = this.selectionEnd
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end)
            this.selectionStart = this.selectionEnd = start + 2
          }
        })
      }

      // ===== 工具栏按钮 =====
      if (this.$.boldBtn) {
        this.$.boldBtn.addEventListener('click', function () {
          self._wrapSelection('**', '**', '粗体文字')
        })
      }
      if (this.$.italicBtn) {
        this.$.italicBtn.addEventListener('click', function () {
          self._wrapSelection('*', '*', '斜体文字')
        })
      }
      if (this.$.headingBtn) {
        this.$.headingBtn.addEventListener('click', function () {
          self._insertAtLineStart('## ', '二级标题')
        })
      }
      if (this.$.linkBtn) {
        this.$.linkBtn.addEventListener('click', function () {
          self._insertLink()
        })
      }
      if (this.$.imageBtn) {
        this.$.imageBtn.addEventListener('click', function () {
          self._insertImage()
        })
      }
      if (this.$.codeBtn) {
        this.$.codeBtn.addEventListener('click', function () {
          self._wrapSelection('`', '`', 'code')
        })
      }
      if (this.$.listBtn) {
        this.$.listBtn.addEventListener('click', function () {
          self._insertAtLineStart('- ', '列表项')
        })
      }
      if (this.$.orderedListBtn) {
        this.$.orderedListBtn.addEventListener('click', function () {
          self._insertAtLineStart('1. ', '列表项')
        })
      }
      if (this.$.quoteBtn) {
        this.$.quoteBtn.addEventListener('click', function () {
          self._insertAtLineStart('> ', '引用内容')
        })
      }
      if (this.$.tableBtn) {
        this.$.tableBtn.addEventListener('click', function () {
          self._insertTable()
        })
      }

      // ===== 模板选择 =====
      if (this.$.templateSelect) {
        this.$.templateSelect.addEventListener('change', function () {
          var name = this.value
          var tpl = Config.TEMPLATES.find(function (t) { return t.name === name })
          if (tpl) {
            self.$.editor.value = tpl.content
            self._updatePreview()
            self._updateWordCount()
            MDToast.success('已加载模板: ' + name)
          }
        })
      }

      // ===== 主题切换 =====
      if (this.$.themeSelect) {
        this.$.themeSelect.addEventListener('change', function () {
          self._applyTheme(this.value)
          try { localStorage.setItem(Config.STORAGE_KEYS.theme, this.value) } catch (e) {}
        })
      }

      // ===== 字号切换 =====
      if (this.$.fontSizeSelect) {
        this.$.fontSizeSelect.addEventListener('change', function () {
          self.$.editor.style.fontSize = this.value + 'px'
          try { localStorage.setItem(Config.STORAGE_KEYS.fontSize, this.value) } catch (e) {}
        })
      }

      // ===== 自动预览开关 =====
      if (this.$.autoPreviewToggle) {
        this.$.autoPreviewToggle.addEventListener('change', function () {
          try { localStorage.setItem(Config.STORAGE_KEYS.autoPreview, this.checked) } catch (e) {}
          if (this.checked) {
            self._updatePreview()
          }
        })
      }

      // ===== 预览按钮 =====
      if (this.$.previewBtn) {
        this.$.previewBtn.addEventListener('click', function () {
          self._updatePreview()
          MDToast.success('预览已更新')
        })
      }

      // ===== 导出 HTML =====
      if (this.$.exportHtmlBtn) {
        this.$.exportHtmlBtn.addEventListener('click', function () {
          self._exportHTML()
        })
      }

      // ===== 清空 =====
      if (this.$.clearBtn) {
        this.$.clearBtn.addEventListener('click', function () {
          if (self.$.editor.value && confirm('确定要清空内容吗？')) {
            self.$.editor.value = ''
            self._updatePreview()
            self._updateWordCount()
            self._clearDraft()
            MDToast.success('已清空')
          }
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          MDToast.success('历史记录已清空')
        })
      }
    },

    // ============================================
    // 包裹选中文本
    // ============================================
    _wrapSelection: function (before, after, placeholder) {
      var editor = this.$.editor
      var start = editor.selectionStart
      var end = editor.selectionEnd
      var selected = editor.value.substring(start, end) || placeholder

      editor.value = editor.value.substring(0, start) + before + selected + after + editor.value.substring(end)
      editor.selectionStart = start + before.length
      editor.selectionEnd = start + before.length + selected.length
      editor.focus()

      this._triggerInput()
    },

    // ============================================
    // 在行首插入
    // ============================================
    _insertAtLineStart: function (prefix, placeholder) {
      var editor = this.$.editor
      var start = editor.selectionStart
      var lineStart = editor.value.lastIndexOf('\n', start - 1) + 1
      var line = editor.value.substring(lineStart, start)

      editor.value = editor.value.substring(0, lineStart) + prefix + line + editor.value.substring(start)
      editor.selectionStart = editor.selectionEnd = start + prefix.length
      editor.focus()

      this._triggerInput()
    },

    // ============================================
    // 插入链接
    // ============================================
    _insertLink: function () {
      var editor = this.$.editor
      var start = editor.selectionStart
      var end = editor.selectionEnd
      var selected = editor.value.substring(start, end) || '链接文字'

      var linkText = '[链接文字](url)'
      editor.value = editor.value.substring(0, start) + linkText + editor.value.substring(end)
      editor.selectionStart = start + 1
      editor.selectionEnd = start + 1 + 4
      editor.focus()

      this._triggerInput()
    },

    // ============================================
    // 插入图片
    // ============================================
    _insertImage: function () {
      var editor = this.$.editor
      var start = editor.selectionStart
      var end = editor.selectionEnd

      var imgText = '![图片描述](image-url)'
      editor.value = editor.value.substring(0, start) + imgText + editor.value.substring(end)
      editor.selectionStart = start + 2
      editor.selectionEnd = start + 2 + 4
      editor.focus()

      this._triggerInput()
    },

    // ============================================
    // 插入表格
    // ============================================
    _insertTable: function () {
      var editor = this.$.editor
      var start = editor.selectionStart

      var table = '\n| 表头 1 | 表头 2 | 表头 3 |\n|--------|--------|--------|\n| 单元格 | 单元格 | 单元格 |\n| 单元格 | 单元格 | 单元格 |\n'

      editor.value = editor.value.substring(0, start) + table + editor.value.substring(start)
      editor.selectionStart = editor.selectionEnd = start + table.length
      editor.focus()

      this._triggerInput()
    },

    // ============================================
    // 触发输入事件
    // ============================================
    _triggerInput: function () {
      var event = new Event('input', { bubbles: true })
      this.$.editor.dispatchEvent(event)
    },

    // ============================================
    // 更新预览
    // ============================================
    _updatePreview: function () {
      var markdown = this.$.editor.value
      var html = Engine.render(markdown)
      this.$.preview.innerHTML = html
    },

    // ============================================
    // 更新字数统计
    // ============================================
    _updateWordCount: function () {
      var stats = Engine.getStats(this.$.editor.value)
      this.$.wordCount.textContent = stats.chars + ' 字 | ' + stats.words + ' 词 | ' + stats.lines + ' 行'
    },

    // ============================================
    // 应用主题
    // ============================================
    _applyTheme: function (theme) {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme')
      } else {
        document.body.classList.remove('dark-theme')
      }
    },

    // ============================================
    // 导出 HTML
    // ============================================
    _exportHTML: function () {
      var markdown = this.$.editor.value
      if (!markdown) {
        MDToast.warning('内容为空，无法导出')
        return
      }

      var html = Engine.exportHTML(markdown)
      var title = Engine.extractTitle(markdown)

      // 下载 HTML 文件
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      var url = URL.createObjectURL(blob)
      var link = document.createElement('a')
      link.download = title + '.html'
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // 添加历史记录
      HistoryManager.add({
        title: '📝 导出 HTML: ' + title,
        detail: Engine.getStats(markdown).chars + ' 字'
      })
      this._loadHistory()

      MDToast.success('HTML 已导出')
    },

    // ============================================
    // 自动保存草稿
    // ============================================
    _autoSaveDraft: function () {
      var self = this
      if (this._saveTimer) {
        clearTimeout(this._saveTimer)
      }
      this._saveTimer = setTimeout(function () {
        try {
          localStorage.setItem(Config.STORAGE_KEYS.draft, self.$.editor.value)
        } catch (e) {}
      }, Config.DEFAULTS.autoSaveDelay)
    },

    // ============================================
    // 清除草稿
    // ============================================
    _clearDraft: function () {
      try {
        localStorage.removeItem(Config.STORAGE_KEYS.draft)
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
        container.innerHTML = '<span class="history-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'history-item'

        var title = document.createElement('div')
        title.className = 'history-title'
        title.textContent = item.title
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
  global.MarkdownEditorApp = MarkdownEditorApp

  document.addEventListener('DOMContentLoaded', function () {
    global._markdownEditorApp = new MarkdownEditorApp()
  })

})(typeof window !== 'undefined' ? window : this)