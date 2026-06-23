/**
 * Date Calculator - UI 交互层
 * 处理所有 UI 交互、Tab 切换、表单验证、结果展示、历史记录
 *
 * 依赖: DateCalcConfig, DateEngine, HolidayData, dayjs
 */
;(function (global) {
  'use strict'

  var Config = global.DateCalcConfig
  var Engine = global.DateEngine
  var Holiday = global.HolidayData
  var dayjs = global.dayjs

  // ============================================
  // Toast 提示
  // ============================================
  var DToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'dc-toast dc-toast-' + type
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
    _key: 'datecalc_history',
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
  // 日期计算器主应用
  // ============================================
  function DateCalculatorApp() {
    this._init()
  }

  DateCalculatorApp.prototype = {
    constructor: DateCalculatorApp,

    _init: function () {
      this._cacheDOM()
      this._initTabs()
      this._initDatePickers()
      this._initTimezones()
      this._initHolidayYears()
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

        // Tab1 - 日期计算
        date1: document.getElementById('date1'),
        date2: document.getElementById('date2'),
        calcDiffBtn: document.getElementById('calcDiffBtn'),
        diffResult: document.getElementById('diffResult'),
        diffYears: document.getElementById('diffYears'),
        diffMonths: document.getElementById('diffMonths'),
        diffDays: document.getElementById('diffDays'),
        diffHours: document.getElementById('diffHours'),
        diffMinutes: document.getElementById('diffMinutes'),
        diffSeconds: document.getElementById('diffSeconds'),
        diffTotalDays: document.getElementById('diffTotalDays'),
        diffTotalHours: document.getElementById('diffTotalHours'),

        addDate: document.getElementById('addDate'),
        addAmount: document.getElementById('addAmount'),
        addUnit: document.getElementById('addUnit'),
        addDirection: document.getElementById('addDirection'),
        calcAddBtn: document.getElementById('calcAddBtn'),
        addResult: document.getElementById('addResult'),
        addResultText: document.getElementById('addResultText'),

        bizStart: document.getElementById('bizStart'),
        bizEnd: document.getElementById('bizEnd'),
        calcBizBtn: document.getElementById('calcBizBtn'),
        bizResult: document.getElementById('bizResult'),
        bizDays: document.getElementById('bizDays'),

        birthDate: document.getElementById('birthDate'),
        calcAgeBtn: document.getElementById('calcAgeBtn'),
        ageResult: document.getElementById('ageResult'),
        ageYears: document.getElementById('ageYears'),
        ageMonths: document.getElementById('ageMonths'),
        ageDays: document.getElementById('ageDays'),
        ageTotalDays: document.getElementById('ageTotalDays'),
        ageNextBirthday: document.getElementById('ageNextBirthday'),
        ageDaysToNext: document.getElementById('ageDaysToNext'),

        // Tab2 - 时间戳转换
        tsInput: document.getElementById('tsInput'),
        tsType: document.getElementById('tsType'),
        convertTsBtn: document.getElementById('convertTsBtn'),
        tsResult: document.getElementById('tsResult'),
        tsFormats: document.getElementById('tsFormats'),

        dateToTsInput: document.getElementById('dateToTsInput'),
        convertDateBtn: document.getElementById('convertDateBtn'),
        dateTsResult: document.getElementById('dateTsResult'),
        tsSeconds: document.getElementById('tsSeconds'),
        tsMilliseconds: document.getElementById('tsMilliseconds'),

        // Tab3 - 时区转换
        tzFrom: document.getElementById('tzFrom'),
        tzTo: document.getElementById('tzTo'),
        tzDateTime: document.getElementById('tzDateTime'),
        convertTzBtn: document.getElementById('convertTzBtn'),
        tzResult: document.getElementById('tzResult'),
        tzSource: document.getElementById('tzSource'),
        tzTarget: document.getElementById('tzTarget'),
        tzOffset: document.getElementById('tzOffset'),

        // Tab4 - 节假日查询
        holidayYear: document.getElementById('holidayYear'),
        holidayList: document.getElementById('holidayList'),
        holidayDate: document.getElementById('holidayDate'),
        checkHolidayBtn: document.getElementById('checkHolidayBtn'),
        holidayCheckResult: document.getElementById('holidayCheckResult'),
        nextHolidayBtn: document.getElementById('nextHolidayBtn'),
        nextHolidayResult: document.getElementById('nextHolidayResult'),

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
    // 初始化日期选择器（默认今天）
    // ============================================
    _initDatePickers: function () {
      var today = dayjs().format('YYYY-MM-DD')
      var now = dayjs().format('YYYY-MM-DDTHH:mm')

      var dateInputs = [
        this.$.date1, this.$.date2,
        this.$.addDate,
        this.$.bizStart, this.$.bizEnd,
        this.$.birthDate,
        this.$.holidayDate
      ]

      dateInputs.forEach(function (input) {
        if (input) {
          if (input.type === 'datetime-local') {
            input.value = now
          } else {
            input.value = today
          }
        }
      })

      // 时间戳转换的日期时间输入
      if (this.$.dateToTsInput) {
        this.$.dateToTsInput.value = now
      }

      // 时区转换的日期时间输入
      if (this.$.tzDateTime) {
        this.$.tzDateTime.value = now
      }
    },

    // ============================================
    // 初始化时区选择
    // ============================================
    _initTimezones: function () {
      var self = this
      var tzSelects = [this.$.tzFrom, this.$.tzTo]

      tzSelects.forEach(function (select) {
        if (!select) return
        select.innerHTML = ''
        Config.TIMEZONES.forEach(function (tz) {
          var option = document.createElement('option')
          option.value = tz.value
          option.textContent = tz.label
          select.appendChild(option)
        })
      })

      // 默认值
      if (this.$.tzFrom) this.$.tzFrom.value = 'Asia/Shanghai'
      if (this.$.tzTo) this.$.tzTo.value = 'UTC'
    },

    // ============================================
    // 初始化节假日年份选择
    // ============================================
    _initHolidayYears: function () {
      var select = this.$.holidayYear
      if (!select) return

      var years = Holiday.getAvailableYears()
      var currentYear = dayjs().year()

      select.innerHTML = ''
      years.forEach(function (year) {
        var option = document.createElement('option')
        option.value = year
        option.textContent = year + '年'
        if (year === currentYear) option.selected = true
        select.appendChild(option)
      })
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== Tab1: 日期差计算 =====
      if (this.$.calcDiffBtn) {
        this.$.calcDiffBtn.addEventListener('click', function () {
          self._calcDateDiff()
        })
      }

      // ===== Tab1: 日期加减 =====
      if (this.$.calcAddBtn) {
        this.$.calcAddBtn.addEventListener('click', function () {
          self._calcDateAdd()
        })
      }

      // ===== Tab1: 工作日计算 =====
      if (this.$.calcBizBtn) {
        this.$.calcBizBtn.addEventListener('click', function () {
          self._calcBusinessDays()
        })
      }

      // ===== Tab1: 年龄计算 =====
      if (this.$.calcAgeBtn) {
        this.$.calcAgeBtn.addEventListener('click', function () {
          self._calcAge()
        })
      }

      // ===== Tab2: 时间戳转日期 =====
      if (this.$.convertTsBtn) {
        this.$.convertTsBtn.addEventListener('click', function () {
          self._convertTimestamp()
        })
      }

      // ===== Tab2: 日期转时间戳 =====
      if (this.$.convertDateBtn) {
        this.$.convertDateBtn.addEventListener('click', function () {
          self._convertDateToTs()
        })
      }

      // ===== Tab3: 时区转换 =====
      if (this.$.convertTzBtn) {
        this.$.convertTzBtn.addEventListener('click', function () {
          self._convertTimezone()
        })
      }

      // ===== Tab4: 节假日查询 =====
      if (this.$.holidayYear) {
        this.$.holidayYear.addEventListener('change', function () {
          self._showHolidayList()
        })
      }

      if (this.$.checkHolidayBtn) {
        this.$.checkHolidayBtn.addEventListener('click', function () {
          self._checkHoliday()
        })
      }

      if (this.$.nextHolidayBtn) {
        this.$.nextHolidayBtn.addEventListener('click', function () {
          self._findNextHoliday()
        })
      }

      // 初始加载节假日列表
      setTimeout(function () {
        self._showHolidayList()
      }, 100)
    },

    // ============================================
    // 日期差计算
    // ============================================
    _calcDateDiff: function () {
      var date1 = this.$.date1.value
      var date2 = this.$.date2.value

      if (!date1 || !date2) {
        DToast.warning('请选择两个日期')
        return
      }

      var result = Engine.dateDiff(date1, date2)
      if (!result) {
        DToast.error('日期格式无效')
        return
      }

      this.$.diffYears.textContent = result.years
      this.$.diffMonths.textContent = result.months
      this.$.diffDays.textContent = result.days
      this.$.diffHours.textContent = result.hours
      this.$.diffMinutes.textContent = result.minutes
      this.$.diffSeconds.textContent = result.seconds
      this.$.diffTotalDays.textContent = result.totalDays.toLocaleString()
      this.$.diffTotalHours.textContent = result.totalHours.toLocaleString()
      this.$.diffResult.classList.add('show')

      // 添加历史记录
      HistoryManager.add({
        type: 'dateDiff',
        title: '日期差: ' + date1 + ' → ' + date2,
        detail: result.years + '年' + result.months + '月' + result.days + '天'
      })
      this._loadHistory()
    },

    // ============================================
    // 日期加减
    // ============================================
    _calcDateAdd: function () {
      var date = this.$.addDate.value
      var amount = parseInt(this.$.addAmount.value, 10)
      var unit = this.$.addUnit.value
      var direction = this.$.addDirection.value

      if (!date || isNaN(amount)) {
        DToast.warning('请输入有效的日期和数量')
        return
      }

      if (direction === 'before') {
        amount = -amount
      }

      var result = Engine.dateAdd(date, amount, unit)
      if (!result) {
        DToast.error('计算失败')
        return
      }

      var formatted = result.format('YYYY-MM-DD')
      var dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][result.day()]
      this.$.addResultText.textContent = formatted + '（周' + dayOfWeek + '）'
      this.$.addResult.classList.add('show')

      HistoryManager.add({
        type: 'dateAdd',
        title: '日期加减: ' + date + ' ' + (direction === 'before' ? '-' : '+') + amount + unit,
        detail: formatted
      })
      this._loadHistory()
    },

    // ============================================
    // 工作日计算
    // ============================================
    _calcBusinessDays: function () {
      var start = this.$.bizStart.value
      var end = this.$.bizEnd.value

      if (!start || !end) {
        DToast.warning('请选择开始和结束日期')
        return
      }

      var days = Engine.businessDaysDiff(start, end)
      this.$.bizDays.textContent = days
      this.$.bizResult.classList.add('show')

      HistoryManager.add({
        type: 'businessDays',
        title: '工作日: ' + start + ' → ' + end,
        detail: days + '个工作日'
      })
      this._loadHistory()
    },

    // ============================================
    // 年龄计算
    // ============================================
    _calcAge: function () {
      var birth = this.$.birthDate.value

      if (!birth) {
        DToast.warning('请选择出生日期')
        return
      }

      var result = Engine.ageCalculate(birth)
      if (!result) {
        DToast.error('出生日期不能晚于今天')
        return
      }

      this.$.ageYears.textContent = result.years
      this.$.ageMonths.textContent = result.months
      this.$.ageDays.textContent = result.days
      this.$.ageTotalDays.textContent = result.totalDays.toLocaleString()
      this.$.ageNextBirthday.textContent = dayjs(result.nextBirthday).format('YYYY年MM月DD日')
      this.$.ageDaysToNext.textContent = result.daysToNextBirthday
      this.$.ageResult.classList.add('show')

      HistoryManager.add({
        type: 'age',
        title: '年龄计算: ' + birth,
        detail: result.years + '岁' + result.months + '月' + result.days + '天'
      })
      this._loadHistory()
    },

    // ============================================
    // 时间戳转日期
    // ============================================
    _convertTimestamp: function () {
      var ts = this.$.tsInput.value.trim()
      var isMs = this.$.tsType.value === 'ms'

      if (!ts) {
        DToast.warning('请输入时间戳')
        return
      }

      var timestamp = parseInt(ts, 10)
      if (isNaN(timestamp)) {
        DToast.error('时间戳格式无效')
        return
      }

      var result = Engine.timestampToDate(timestamp, isMs)
      if (!result) {
        DToast.error('时间戳转换失败')
        return
      }

      var html = ''
      for (var key in result.formats) {
        if (result.formats.hasOwnProperty(key)) {
          html += '<div class="format-item"><span class="format-label">' + key + '</span><span class="format-value">' + result.formats[key] + '</span></div>'
        }
      }
      this.$.tsFormats.innerHTML = html
      this.$.tsResult.classList.add('show')

      HistoryManager.add({
        type: 'tsToDate',
        title: '时间戳转日期: ' + ts,
        detail: result.formats['YYYY-MM-DD HH:mm:ss']
      })
      this._loadHistory()
    },

    // ============================================
    // 日期转时间戳
    // ============================================
    _convertDateToTs: function () {
      var dateStr = this.$.dateToTsInput.value

      if (!dateStr) {
        DToast.warning('请选择日期时间')
        return
      }

      var result = Engine.dateToTimestamp(dateStr)
      if (!result) {
        DToast.error('日期格式无效')
        return
      }

      this.$.tsSeconds.textContent = result.seconds
      this.$.tsMilliseconds.textContent = result.milliseconds
      this.$.dateTsResult.classList.add('show')

      HistoryManager.add({
        type: 'dateToTs',
        title: '日期转时间戳: ' + dateStr,
        detail: '秒: ' + result.seconds
      })
      this._loadHistory()
    },

    // ============================================
    // 时区转换
    // ============================================
    _convertTimezone: function () {
      var fromZone = this.$.tzFrom.value
      var toZone = this.$.tzTo.value
      var dateTime = this.$.tzDateTime.value

      if (!dateTime) {
        DToast.warning('请选择日期时间')
        return
      }

      if (fromZone === toZone) {
        DToast.warning('源时区和目标时区相同')
        return
      }

      var result = Engine.timezoneConvert(dateTime, fromZone, toZone)
      if (!result) {
        DToast.error('时区转换失败')
        return
      }

      this.$.tzSource.textContent = result.sourceFormatted
      this.$.tzTarget.textContent = result.targetFormatted
      var offsetSign = result.offsetHours >= 0 ? '+' : ''
      this.$.tzOffset.textContent = offsetSign + result.offsetHours + ' 小时'
      this.$.tzResult.classList.add('show')

      HistoryManager.add({
        type: 'timezone',
        title: '时区转换: ' + fromZone + ' → ' + toZone,
        detail: result.targetFormatted
      })
      this._loadHistory()
    },

    // ============================================
    // 显示节假日列表
    // ============================================
    _showHolidayList: function () {
      var year = parseInt(this.$.holidayYear.value, 10)
      var holidays = Holiday.getHolidaysByYear(year)
      var workdays = Holiday.getWorkdaysByYear(year)

      if (!holidays || holidays.length === 0) {
        this.$.holidayList.innerHTML = '<div class="empty-hint">暂无该年份的节假日数据</div>'
        return
      }

      var html = ''
      holidays.forEach(function (h) {
        var dateStr = dayjs(h.date).format('YYYY年MM月DD日')
        var dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dayjs(h.date).day()]
        var periodStr = ''
        if (h.period) {
          periodStr = '（' + dayjs(h.period[0]).format('MM/DD') + ' - ' + dayjs(h.period[1]).format('MM/DD') + '）'
        }
        html += '<div class="holiday-item">' +
          '<span class="holiday-name">' + h.name + '</span>' +
          '<span class="holiday-date">' + dateStr + ' 周' + dayOfWeek + '</span>' +
          '<span class="holiday-days">' + h.days + '天' + periodStr + '</span>' +
          '</div>'
      })

      // 调休工作日
      if (workdays && workdays.length > 0) {
        html += '<div class="workday-section"><h4>📌 调休工作日</h4>'
        workdays.forEach(function (wd) {
          var wdDate = dayjs(wd)
          var wdDay = ['日', '一', '二', '三', '四', '五', '六'][wdDate.day()]
          html += '<span class="workday-tag">' + wdDate.format('MM/DD') + '（周' + wdDay + '）</span>'
        })
        html += '</div>'
      }

      this.$.holidayList.innerHTML = html
    },

    // ============================================
    // 检查日期是否为节假日
    // ============================================
    _checkHoliday: function () {
      var date = this.$.holidayDate.value

      if (!date) {
        DToast.warning('请选择日期')
        return
      }

      var result = Holiday.isWorkday(date)
      if (!result) {
        DToast.error('查询失败')
        return
      }

      var icon = result.isWorkday ? '💼' : '🎉'
      var status = result.isWorkday ? '工作日' : '非工作日'
      var detail = ''

      if (result.isHoliday) {
        detail = '（' + result.name + '）'
      } else if (result.isWeekend) {
        detail = '（周末）'
      }

      this.$.holidayCheckResult.innerHTML =
        '<div class="check-result ' + (result.isWorkday ? 'workday' : 'holiday') + '">' +
        icon + ' ' + status + ' ' + detail +
        '</div>'
    },

    // ============================================
    // 查找下一个节假日
    // ============================================
    _findNextHoliday: function () {
      var result = Holiday.getNextHoliday(new Date())
      if (!result) {
        this.$.nextHolidayResult.innerHTML = '<div class="empty-hint">暂无节假日数据</div>'
        return
      }

      var dateStr = dayjs(result.date).format('YYYY年MM月DD日')
      var dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dayjs(result.date).day()]

      this.$.nextHolidayResult.innerHTML =
        '<div class="next-holiday-card">' +
        '<div class="next-holiday-name">🎊 ' + result.name + '</div>' +
        '<div class="next-holiday-date">' + dateStr + '（周' + dayOfWeek + '）</div>' +
        '<div class="next-holiday-countdown">距离还有 <strong>' + result.daysLeft + '</strong> 天</div>' +
        '</div>'
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
          'dateDiff': '📅',
          'dateAdd': '➕',
          'businessDays': '💼',
          'age': '🎂',
          'tsToDate': '⏰',
          'dateToTs': '⏱️',
          'timezone': '🌍'
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
  global.DateCalculatorApp = DateCalculatorApp

  document.addEventListener('DOMContentLoaded', function () {
    global._dateCalcApp = new DateCalculatorApp()
  })

})(typeof window !== 'undefined' ? window : this)