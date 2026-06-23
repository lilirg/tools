/**
 * Unit Converter - UI 交互层
 * 处理所有 UI 交互、事件绑定、历史记录管理
 *
 * 依赖: UnitConfig, ConversionData, ConverterEngine
 */
;(function (global) {
  'use strict'

  var Config = global.UnitConfig
  var Engine = global.ConverterEngine

  // ============================================
  // Toast 提示
  // ============================================
  var UCToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'uc-toast uc-toast-' + type
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
  // 单位换算器主应用
  // ============================================
  function UnitConverterApp() {
    this._init()
  }

  UnitConverterApp.prototype = {
    constructor: UnitConverterApp,

    _init: function () {
      this._cacheDOM()
      this._initCategories()
      this._initPrecision()
      this._initSmartDetect()
      this._loadSavedState()
      this._bindEvents()
      this._loadHistory()
      this._doConvert()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // 类别 Tab
        categoryTabs: document.querySelectorAll('.cat-tab'),
        categoryTabsContainer: document.getElementById('categoryTabs'),

        // 单位选择
        fromUnit: document.getElementById('fromUnit'),
        toUnit: document.getElementById('toUnit'),

        // 输入
        inputValue: document.getElementById('inputValue'),

        // 交换按钮
        swapBtn: document.getElementById('swapBtn'),

        // 结果
        resultValue: document.getElementById('resultValue'),
        resultFormula: document.getElementById('resultFormula'),
        resultCard: document.getElementById('resultCard'),

        // 精度
        precisionSelect: document.getElementById('precisionSelect'),

        // 智能识别
        smartDetectToggle: document.getElementById('smartDetectToggle'),

        // 操作按钮
        copyBtn: document.getElementById('copyBtn'),
        clearBtn: document.getElementById('clearBtn'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // 初始化类别 Tab
    // ============================================
    _initCategories: function () {
      var container = this.$.categoryTabsContainer
      if (!container) return

      var categories = Engine.getCategories()
      var html = ''

      categories.forEach(function (cat, index) {
        var icon = Engine.getCategoryIcon(cat)
        var label = Engine.getCategoryLabel(cat)
        html += '<button class="cat-tab' + (index === 0 ? ' active' : '') + '" data-category="' + cat + '">' +
          icon + ' ' + label +
          '</button>'
      })

      container.innerHTML = html

      // 更新引用
      this.$.categoryTabs = container.querySelectorAll('.cat-tab')
    },

    // ============================================
    // 初始化精度选择
    // ============================================
    _initPrecision: function () {
      var select = this.$.precisionSelect
      if (!select) return

      select.innerHTML = ''
      Config.PRECISION_OPTIONS.forEach(function (opt) {
        var option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        select.appendChild(option)
      })

      // 设置默认值
      select.value = Config.DEFAULTS.precision
    },

    // ============================================
    // 初始化智能识别开关
    // ============================================
    _initSmartDetect: function () {
      var toggle = this.$.smartDetectToggle
      if (!toggle) return

      // 从 localStorage 恢复状态
      try {
        var saved = localStorage.getItem(Config.STORAGE_KEYS.smartDetect)
        if (saved !== null) {
          toggle.checked = saved === 'true'
        } else {
          toggle.checked = Config.DEFAULTS.smartDetect
        }
      } catch (e) {
        toggle.checked = Config.DEFAULTS.smartDetect
      }
    },

    // ============================================
    // 加载保存的状态
    // ============================================
    _loadSavedState: function () {
      try {
        var lastCategory = localStorage.getItem(Config.STORAGE_KEYS.lastCategory)
        if (lastCategory) {
          var tabs = this.$.categoryTabs
          tabs.forEach(function (tab) {
            tab.classList.remove('active')
            if (tab.dataset.category === lastCategory) {
              tab.classList.add('active')
            }
          })
        }

        // 加载当前类别的单位
        this._loadUnitsForActiveCategory()

        var lastFrom = localStorage.getItem(Config.STORAGE_KEYS.lastFromUnit)
        var lastTo = localStorage.getItem(Config.STORAGE_KEYS.lastToUnit)
        var activeCat = this._getActiveCategory()

        if (lastFrom && this._unitExists(activeCat, lastFrom)) {
          this.$.fromUnit.value = lastFrom
        }
        if (lastTo && this._unitExists(activeCat, lastTo)) {
          this.$.toUnit.value = lastTo
        }

        var savedPrecision = localStorage.getItem(Config.STORAGE_KEYS.precision)
        if (savedPrecision !== null) {
          this.$.precisionSelect.value = savedPrecision
        }
      } catch (e) {}
    },

    // ============================================
    // 检查单位是否存在
    // ============================================
    _unitExists: function (category, unitKey) {
      var units = Engine.getUnits(category)
      for (var i = 0; i < units.length; i++) {
        if (units[i].key === unitKey) return true
      }
      return false
    },

    // ============================================
    // 加载当前类别的单位
    // ============================================
    _loadUnitsForActiveCategory: function () {
      var category = this._getActiveCategory()
      var units = Engine.getUnits(category)

      var fromSelect = this.$.fromUnit
      var toSelect = this.$.toUnit

      fromSelect.innerHTML = ''
      toSelect.innerHTML = ''

      units.forEach(function (unit) {
        var opt1 = document.createElement('option')
        opt1.value = unit.key
        opt1.textContent = unit.name + ' (' + unit.symbol + ')'
        fromSelect.appendChild(opt1)

        var opt2 = document.createElement('option')
        opt2.value = unit.key
        opt2.textContent = unit.name + ' (' + unit.symbol + ')'
        toSelect.appendChild(opt2)
      })

      // 默认选择：第一个和第二个单位
      if (units.length >= 2) {
        fromSelect.selectedIndex = 0
        toSelect.selectedIndex = 1
      } else if (units.length === 1) {
        fromSelect.selectedIndex = 0
        toSelect.selectedIndex = 0
      }
    },

    // ============================================
    // 获取当前活跃类别
    // ============================================
    _getActiveCategory: function () {
      var tabs = this.$.categoryTabs
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].classList.contains('active')) {
          return tabs[i].dataset.category
        }
      }
      return Config.DEFAULTS.category
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== 类别切换 =====
      this.$.categoryTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          self._switchCategory(this.dataset.category)
        })
      })

      // ===== 输入值变化 =====
      if (this.$.inputValue) {
        this.$.inputValue.addEventListener('input', function () {
          self._doConvert()
        })
      }

      // ===== 源单位变化 =====
      if (this.$.fromUnit) {
        this.$.fromUnit.addEventListener('change', function () {
          self._doConvert()
          self._saveState()
        })
      }

      // ===== 目标单位变化 =====
      if (this.$.toUnit) {
        this.$.toUnit.addEventListener('change', function () {
          self._doConvert()
          self._saveState()
        })
      }

      // ===== 交换按钮 =====
      if (this.$.swapBtn) {
        this.$.swapBtn.addEventListener('click', function () {
          self._swapUnits()
        })
      }

      // ===== 精度变化 =====
      if (this.$.precisionSelect) {
        this.$.precisionSelect.addEventListener('change', function () {
          self._doConvert()
          self._saveState()
        })
      }

      // ===== 智能识别开关 =====
      if (this.$.smartDetectToggle) {
        this.$.smartDetectToggle.addEventListener('change', function () {
          try {
            localStorage.setItem(Config.STORAGE_KEYS.smartDetect, this.checked)
          } catch (e) {}
          if (this.checked) {
            self._trySmartDetect()
          }
        })
      }

      // ===== 复制结果 =====
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

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          UCToast.success('历史记录已清空')
        })
      }

      // ===== 键盘快捷键 =====
      if (this.$.inputValue) {
        this.$.inputValue.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            self._doConvert()
          }
        })
      }
    },

    // ============================================
    // 切换类别
    // ============================================
    _switchCategory: function (category) {
      // 更新 Tab 状态
      this.$.categoryTabs.forEach(function (tab) {
        tab.classList.remove('active')
        if (tab.dataset.category === category) {
          tab.classList.add('active')
        }
      })

      // 重新加载单位
      this._loadUnitsForActiveCategory()

      // 隐藏结果
      this.$.resultCard.classList.remove('show')

      // 保存状态
      this._saveState()

      // 尝试智能识别
      this._trySmartDetect()

      // 执行换算
      this._doConvert()
    },

    // ============================================
    // 交换源/目标单位
    // ============================================
    _swapUnits: function () {
      var fromVal = this.$.fromUnit.value
      var toVal = this.$.toUnit.value

      this.$.fromUnit.value = toVal
      this.$.toUnit.value = fromVal

      this._doConvert()
      this._saveState()
    },

    // ============================================
    // 执行换算
    // ============================================
    _doConvert: function () {
      var value = this.$.inputValue.value
      var fromUnit = this.$.fromUnit.value
      var toUnit = this.$.toUnit.value
      var category = this._getActiveCategory()
      var precision = parseInt(this.$.precisionSelect.value, 10)

      if (!value || value === '') {
        this.$.resultCard.classList.remove('show')
        return
      }

      var result = Engine.convert(value, fromUnit, toUnit, category)

      if (result.error) {
        this.$.resultValue.textContent = '—'
        this.$.resultFormula.textContent = result.error
        this.$.resultCard.classList.add('show')
        return
      }

      // 格式化结果
      var formatted = Engine.formatResult(result.value, precision)
      this.$.resultValue.textContent = formatted

      // 生成公式
      var formula = Engine.getFormula(
        result.fromValue,
        fromUnit,
        toUnit,
        category,
        formatted
      )
      this.$.resultFormula.textContent = formula

      this.$.resultCard.classList.add('show')

      // 保存当前换算结果用于复制
      this._lastResult = {
        value: formatted,
        fromValue: result.fromValue,
        fromSymbol: result.fromUnit.symbol,
        toSymbol: result.toUnit.symbol,
        formula: formula
      }
    },

    // ============================================
    // 尝试智能识别
    // ============================================
    _trySmartDetect: function () {
      if (!this.$.smartDetectToggle.checked) return

      var input = this.$.inputValue.value
      if (!input) return

      var detected = Engine.smartDetect(input)
      if (!detected) return

      // 检查检测到的类别是否与当前类别匹配
      var currentCat = this._getActiveCategory()
      if (detected.category !== currentCat) {
        // 切换到检测到的类别
        this.$.categoryTabs.forEach(function (tab) {
          tab.classList.remove('active')
          if (tab.dataset.category === detected.category) {
            tab.classList.add('active')
          }
        })

        // 重新加载单位
        this._loadUnitsForActiveCategory()
      }

      // 设置源单位为检测到的单位
      var units = Engine.getUnits(detected.category)
      for (var i = 0; i < units.length; i++) {
        if (units[i].key === detected.unitKey) {
          this.$.fromUnit.value = detected.unitKey
          break
        }
      }

      // 设置输入值为纯数值
      this.$.inputValue.value = detected.value

      // 保存状态
      this._saveState()

      // 执行换算
      this._doConvert()

      UCToast.info('已识别: ' + detected.value + ' ' + Engine.getUnitInfo(detected.category, detected.unitKey).symbol)
    },

    // ============================================
    // 复制结果
    // ============================================
    _copyResult: function () {
      if (!this._lastResult) {
        UCToast.warning('暂无结果可复制')
        return
      }

      var text = this._lastResult.fromValue + ' ' + this._lastResult.fromSymbol +
        ' = ' + this._lastResult.value + ' ' + this._lastResult.toSymbol

      this._copyText(text, '换算结果已复制到剪贴板')

      // 添加历史记录
      HistoryManager.add({
        title: Engine.getCategoryLabel(this._getActiveCategory()) + ' 换算',
        detail: text
      })
      this._loadHistory()
    },

    // ============================================
    // 复制文本
    // ============================================
    _copyText: function (text, successMsg) {
      var self = this
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          UCToast.success(successMsg || '已复制到剪贴板')
        }).catch(function () {
          self._fallbackCopy(text, successMsg)
        })
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
        UCToast.success(successMsg || '已复制到剪贴板')
      } catch (e) {
        UCToast.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    },

    // ============================================
    // 清空所有
    // ============================================
    _clearAll: function () {
      this.$.inputValue.value = ''
      this.$.resultCard.classList.remove('show')
      this._lastResult = null
      this.$.inputValue.focus()
    },

    // ============================================
    // 保存状态到 localStorage
    // ============================================
    _saveState: function () {
      try {
        localStorage.setItem(Config.STORAGE_KEYS.lastCategory, this._getActiveCategory())
        localStorage.setItem(Config.STORAGE_KEYS.lastFromUnit, this.$.fromUnit.value)
        localStorage.setItem(Config.STORAGE_KEYS.lastToUnit, this.$.toUnit.value)
        localStorage.setItem(Config.STORAGE_KEYS.precision, this.$.precisionSelect.value)
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
        title.textContent = '📐 ' + item.title
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
  global.UnitConverterApp = UnitConverterApp

  document.addEventListener('DOMContentLoaded', function () {
    global._unitConverterApp = new UnitConverterApp()
  })

})(typeof window !== 'undefined' ? window : this)