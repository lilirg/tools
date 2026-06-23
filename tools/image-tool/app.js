/**
 * Image Tool - UI 交互层
 * 处理所有 UI 交互、事件绑定、历史记录管理
 *
 * 依赖: ImageConfig, ImageEngine
 */
;(function (global) {
  'use strict'

  var Config = global.ImageConfig
  var Engine = global.ImageEngine

  // ============================================
  // Toast 提示
  // ============================================
  var IMGToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'img-toast img-toast-' + type
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
  // 图片工具主应用
  // ============================================
  function ImageToolApp() {
    this._init()
  }

  ImageToolApp.prototype = {
    constructor: ImageToolApp,

    _init: function () {
      this._cacheDOM()
      this._initOptions()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // 拖拽上传区域
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        uploadBtn: document.getElementById('uploadBtn'),

        // 图片列表
        imageList: document.getElementById('imageList'),
        imageCount: document.getElementById('imageCount'),

        // 选项
        qualityRange: document.getElementById('qualityRange'),
        qualityValue: document.getElementById('qualityValue'),
        formatSelect: document.getElementById('formatSelect'),
        maxWidthSelect: document.getElementById('maxWidthSelect'),
        maxHeightSelect: document.getElementById('maxHeightSelect'),

        // 操作按钮
        processAllBtn: document.getElementById('processAllBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),

        // 结果区域
        resultsContainer: document.getElementById('resultsContainer'),
        resultsGrid: document.getElementById('resultsGrid'),
        totalOriginalSize: document.getElementById('totalOriginalSize'),
        totalOutputSize: document.getElementById('totalOutputSize'),
        totalSavings: document.getElementById('totalSavings'),
        downloadAllBtn: document.getElementById('downloadAllBtn'),

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

      // 质量预设
      Config.QUALITY_PRESETS.forEach(function (preset) {
        var option = document.createElement('option')
        option.value = preset.value
        option.textContent = preset.label
        self.$.qualityRange.appendChild(option)
      })

      // 格式选项
      Config.FORMAT_OPTIONS.forEach(function (opt) {
        var option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        self.$.formatSelect.appendChild(option)
      })

      // 尺寸预设
      Config.SIZE_PRESETS.forEach(function (preset) {
        var option = document.createElement('option')
        option.value = preset.value
        option.textContent = preset.label
        self.$.maxWidthSelect.appendChild(option)
      })
      Config.SIZE_PRESETS.forEach(function (preset) {
        var option = document.createElement('option')
        option.value = preset.value
        option.textContent = preset.label
        self.$.maxHeightSelect.appendChild(option)
      })

      // 设置默认值
      this.$.qualityRange.value = Config.DEFAULTS.quality
      this.$.maxWidthSelect.value = Config.DEFAULTS.maxWidth
      this.$.maxHeightSelect.value = Config.DEFAULTS.maxHeight
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        var lastQuality = localStorage.getItem(Config.STORAGE_KEYS.lastQuality)
        if (lastQuality !== null) {
          this.$.qualityRange.value = lastQuality
        }

        var lastFormat = localStorage.getItem(Config.STORAGE_KEYS.lastFormat)
        if (lastFormat !== null) {
          this.$.formatSelect.value = lastFormat
        }

        var lastMaxWidth = localStorage.getItem(Config.STORAGE_KEYS.lastMaxWidth)
        if (lastMaxWidth !== null) {
          this.$.maxWidthSelect.value = lastMaxWidth
        }

        var lastMaxHeight = localStorage.getItem(Config.STORAGE_KEYS.lastMaxHeight)
        if (lastMaxHeight !== null) {
          this.$.maxHeightSelect.value = lastMaxHeight
        }
      } catch (e) {}
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 上传按钮 =====
      if (this.$.uploadBtn) {
        this.$.uploadBtn.addEventListener('click', function () {
          self.$.fileInput.click()
        })
      }

      // ===== 文件选择 =====
      if (this.$.fileInput) {
        this.$.fileInput.addEventListener('change', function () {
          self._addFiles(this.files)
          this.value = ''
        })
      }

      // ===== 拖拽上传 =====
      if (this.$.dropZone) {
        this.$.dropZone.addEventListener('dragover', function (e) {
          e.preventDefault()
          e.stopPropagation()
          this.classList.add('drag-over')
        })

        this.$.dropZone.addEventListener('dragleave', function (e) {
          e.preventDefault()
          e.stopPropagation()
          this.classList.remove('drag-over')
        })

        this.$.dropZone.addEventListener('drop', function (e) {
          e.preventDefault()
          e.stopPropagation()
          this.classList.remove('drag-over')
          self._addFiles(e.dataTransfer.files)
        })
      }

      // ===== 质量选择 =====
      if (this.$.qualityRange) {
        this.$.qualityRange.addEventListener('change', function () {
          self._saveState()
        })
      }

      // ===== 格式选择 =====
      if (this.$.formatSelect) {
        this.$.formatSelect.addEventListener('change', function () {
          self._saveState()
        })
      }

      // ===== 尺寸选择 =====
      if (this.$.maxWidthSelect) {
        this.$.maxWidthSelect.addEventListener('change', function () {
          self._saveState()
        })
      }
      if (this.$.maxHeightSelect) {
        this.$.maxHeightSelect.addEventListener('change', function () {
          self._saveState()
        })
      }

      // ===== 全部处理 =====
      if (this.$.processAllBtn) {
        this.$.processAllBtn.addEventListener('click', function () {
          self._processAll()
        })
      }

      // ===== 清空所有 =====
      if (this.$.clearAllBtn) {
        this.$.clearAllBtn.addEventListener('click', function () {
          self._clearAll()
        })
      }

      // ===== 全部下载 =====
      if (this.$.downloadAllBtn) {
        this.$.downloadAllBtn.addEventListener('click', function () {
          self._downloadAll()
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          IMGToast.success('历史记录已清空')
        })
      }
    },

    // ============================================
    // 添加文件
    // ============================================
    _addFiles: function (files) {
      var self = this
      var addedCount = 0

      for (var i = 0; i < files.length; i++) {
        var file = files[i]

        if (!Engine.isSupportedType(file)) {
          IMGToast.warning('跳过不支持的文件: ' + file.name)
          continue
        }

        if (file.size > Config.DEFAULTS.maxFileSize) {
          IMGToast.warning('跳过超大文件: ' + file.name + ' (' + Engine.formatSize(file.size) + ')')
          continue
        }

        Engine.loadImage(file).then(function (imageData) {
          self._addImageCard(imageData)
          addedCount++
          self._updateImageCount()
        }).catch(function (err) {
          IMGToast.error(file.name + ': ' + err.message)
        })
      }
    },

    // ============================================
    // 添加图片卡片
    // ============================================
    _addImageCard: function (imageData) {
      var self = this
      var card = document.createElement('div')
      card.className = 'img-card'
      card.dataset.name = imageData.name
      card.dataset.type = imageData.type
      card.dataset.width = imageData.width
      card.dataset.height = imageData.height
      card.dataset.size = imageData.size

      card.innerHTML =
        '<div class="img-card-preview">' +
          '<img src="' + imageData.dataUrl + '" alt="' + imageData.name + '">' +
        '</div>' +
        '<div class="img-card-info">' +
          '<div class="img-card-name" title="' + imageData.name + '">' + imageData.name + '</div>' +
          '<div class="img-card-dims">' + imageData.width + ' × ' + imageData.height + '</div>' +
          '<div class="img-card-size">' + Engine.formatSize(imageData.size) + '</div>' +
        '</div>' +
        '<button class="img-card-remove" title="移除">×</button>' +
        '<div class="img-card-status">等待处理</div>'

      // 移除按钮
      var removeBtn = card.querySelector('.img-card-remove')
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        card.remove()
        self._updateImageCount()
        self._updateResultsVisibility()
      })

      this.$.imageList.appendChild(card)
      this._updateImageCount()
    },

    // ============================================
    // 更新图片数量
    // ============================================
    _updateImageCount: function () {
      var count = this.$.imageList.children.length
      this.$.imageCount.textContent = count + ' 张图片'
      this.$.processAllBtn.disabled = count === 0
      this.$.clearAllBtn.disabled = count === 0
    },

    // ============================================
    // 获取选项
    // ============================================
    _getOptions: function () {
      return {
        quality: parseInt(this.$.qualityRange.value, 10),
        format: this.$.formatSelect.value,
        maxWidth: parseInt(this.$.maxWidthSelect.value, 10),
        maxHeight: parseInt(this.$.maxHeightSelect.value, 10)
      }
    },

    // ============================================
    // 处理所有图片
    // ============================================
    _processAll: function () {
      var self = this
      var cards = this.$.imageList.querySelectorAll('.img-card')
      if (cards.length === 0) {
        IMGToast.warning('请先添加图片')
        return
      }

      var options = this._getOptions()
      var results = []
      var processed = 0

      // 禁用按钮
      this.$.processAllBtn.disabled = true
      this.$.processAllBtn.textContent = '处理中...'

      cards.forEach(function (card, index) {
        var img = card.querySelector('img')
        var imageData = {
          image: new Image(),
          dataUrl: img.src,
          name: card.dataset.name,
          type: card.dataset.type,
          size: parseInt(card.dataset.size, 10)
        }

        imageData.image.onload = function () {
          imageData.image.naturalWidth = parseInt(card.dataset.width, 10)
          imageData.image.naturalHeight = parseInt(card.dataset.height, 10)

          Engine.processImage(imageData, options).then(function (result) {
            result.originalName = imageData.name
            result.filename = Engine.generateFilename(
              imageData.name,
              result.format,
              '_compressed'
            )
            results.push(result)

            // 更新卡片状态
            var statusEl = card.querySelector('.img-card-status')
            statusEl.textContent = '✅ 已完成'
            statusEl.className = 'img-card-status status-done'

            processed++
            if (processed === cards.length) {
              self._onAllProcessed(results)
            }
          }).catch(function (err) {
            var statusEl = card.querySelector('.img-card-status')
            statusEl.textContent = '❌ ' + err.message
            statusEl.className = 'img-card-status status-error'

            processed++
            if (processed === cards.length) {
              self._onAllProcessed(results)
            }
          })
        }

        imageData.image.src = img.src
      })
    },

    // ============================================
    // 全部处理完成
    // ============================================
    _onAllProcessed: function (results) {
      this.$.processAllBtn.disabled = false
      this.$.processAllBtn.textContent = '🚀 全部处理'

      if (results.length === 0) {
        IMGToast.warning('没有成功处理的图片')
        return
      }

      this._renderResults(results)
      this._updateStats(results)
      this._addHistory(results)
      IMGToast.success('处理完成: ' + results.length + ' 张图片')
    },

    // ============================================
    // 渲染结果
    // ============================================
    _renderResults: function (results) {
      var self = this
      this.$.resultsGrid.innerHTML = ''

      results.forEach(function (result) {
        var item = document.createElement('div')
        item.className = 'result-item'

        // 对比预览
        item.innerHTML =
          '<div class="result-compare">' +
            '<div class="result-original">' +
              '<div class="result-label">原图</div>' +
              '<div class="result-size">' + Engine.formatSize(result.originalSize) + '</div>' +
            '</div>' +
            '<div class="result-arrow">→</div>' +
            '<div class="result-processed">' +
              '<div class="result-label">处理后</div>' +
              '<div class="result-size">' + Engine.formatSize(result.outputSize) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="result-preview">' +
            '<img src="' + result.dataUrl + '" alt="' + result.originalName + '">' +
          '</div>' +
          '<div class="result-details">' +
            '<div class="result-detail-row">' +
              '<span>尺寸</span>' +
              '<span>' + result.originalWidth + '×' + result.originalHeight + ' → ' + result.width + '×' + result.height + '</span>' +
            '</div>' +
            '<div class="result-detail-row">' +
              '<span>格式</span>' +
              '<span>' + result.format.replace('image/', '').toUpperCase() + '</span>' +
            '</div>' +
            '<div class="result-detail-row">' +
              '<span>压缩率</span>' +
              '<span class="' + (parseFloat(result.compressionRatio) > 0 ? 'saving-positive' : 'saving-negative') + '">' +
                (parseFloat(result.compressionRatio) > 0 ? '-' : '+') + Math.abs(result.compressionRatio) + '%' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="result-actions">' +
            '<button class="btn btn-primary btn-small download-single" data-url="' + result.dataUrl + '" data-filename="' + result.filename + '">⬇ 下载</button>' +
            '<button class="btn btn-default btn-small copy-single" data-url="' + result.dataUrl + '">📋 复制</button>' +
          '</div>'

        // 下载单个
        var downloadBtn = item.querySelector('.download-single')
        downloadBtn.addEventListener('click', function () {
          Engine.downloadImage(result.dataUrl, result.filename)
        })

        // 复制单个
        var copyBtn = item.querySelector('.copy-single')
        copyBtn.addEventListener('click', function () {
          self._copyDataUrl(result.dataUrl)
        })

        self.$.resultsGrid.appendChild(item)
      })

      this.$.resultsContainer.style.display = 'block'
    },

    // ============================================
    // 更新统计信息
    // ============================================
    _updateStats: function (results) {
      var totalOriginal = 0
      var totalOutput = 0

      results.forEach(function (result) {
        totalOriginal += result.originalSize
        totalOutput += result.outputSize
      })

      this.$.totalOriginalSize.textContent = Engine.formatSize(totalOriginal)
      this.$.totalOutputSize.textContent = Engine.formatSize(totalOutput)

      var savings = totalOriginal - totalOutput
      this.$.totalSavings.textContent = Engine.formatSize(savings)
      this.$.totalSavings.className = savings > 0 ? 'saving-positive' : 'saving-negative'

      this.$.downloadAllBtn.disabled = false
    },

    // ============================================
    // 更新结果区域可见性
    // ============================================
    _updateResultsVisibility: function () {
      if (this.$.imageList.children.length === 0) {
        this.$.resultsContainer.style.display = 'none'
      }
    },

    // ============================================
    // 复制 DataURL
    // ============================================
    _copyDataUrl: function (dataUrl) {
      var self = this
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dataUrl).then(function () {
          IMGToast.success('已复制到剪贴板')
        }).catch(function () {
          self._fallbackCopy(dataUrl)
        })
      } else {
        this._fallbackCopy(dataUrl)
      }
    },

    // ============================================
    // 降级复制
    // ============================================
    _fallbackCopy: function (text) {
      var textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        IMGToast.success('已复制到剪贴板')
      } catch (e) {
        IMGToast.error('复制失败')
      }
      document.body.removeChild(textarea)
    },

    // ============================================
    // 下载全部
    // ============================================
    _downloadAll: function () {
      var items = []
      this.$.resultsGrid.querySelectorAll('.result-item').forEach(function (item) {
        var btn = item.querySelector('.download-single')
        items.push({
          dataUrl: btn.dataset.url,
          filename: btn.dataset.filename
        })
      })

      if (items.length === 0) {
        IMGToast.warning('没有可下载的图片')
        return
      }

      Engine.downloadAll(items)
      IMGToast.success('开始下载 ' + items.length + ' 张图片')
    },

    // ============================================
    // 清空所有
    // ============================================
    _clearAll: function () {
      this.$.imageList.innerHTML = ''
      this.$.resultsGrid.innerHTML = ''
      this.$.resultsContainer.style.display = 'none'
      this._updateImageCount()
      this.$.downloadAllBtn.disabled = true
    },

    // ============================================
    // 保存状态
    // ============================================
    _saveState: function () {
      try {
        localStorage.setItem(Config.STORAGE_KEYS.lastQuality, this.$.qualityRange.value)
        localStorage.setItem(Config.STORAGE_KEYS.lastFormat, this.$.formatSelect.value)
        localStorage.setItem(Config.STORAGE_KEYS.lastMaxWidth, this.$.maxWidthSelect.value)
        localStorage.setItem(Config.STORAGE_KEYS.lastMaxHeight, this.$.maxHeightSelect.value)
      } catch (e) {}
    },

    // ============================================
    // 添加历史记录
    // ============================================
    _addHistory: function (results) {
      var totalOriginal = 0
      var totalOutput = 0
      results.forEach(function (r) {
        totalOriginal += r.originalSize
        totalOutput += r.outputSize
      })

      var savings = totalOriginal - totalOutput
      var savingsPercent = totalOriginal > 0
        ? ((savings / totalOriginal) * 100).toFixed(1)
        : 0

      HistoryManager.add({
        title: '🖼️ 图片处理 (' + results.length + ' 张)',
        detail: Engine.formatSize(totalOriginal) + ' → ' + Engine.formatSize(totalOutput) +
                ' (节省 ' + savingsPercent + '%)'
      })
      this._loadHistory()
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
  global.ImageToolApp = ImageToolApp

  document.addEventListener('DOMContentLoaded', function () {
    global._imageToolApp = new ImageToolApp()
  })

})(typeof window !== 'undefined' ? window : this)