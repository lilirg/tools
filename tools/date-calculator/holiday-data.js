/**
 * Date Calculator - 节假日数据模块
 * 提供中国法定节假日数据及查询功能
 *
 * 依赖: dayjs, DateEngine
 */
;(function (global) {
  'use strict'

  var dayjs = global.dayjs
  var DateEngine = global.DateEngine

  if (!dayjs) {
    console.error('HolidayData: dayjs is required')
    return
  }

  // ============================================
  // 中国法定节假日数据 (2024-2026)
  // ============================================
  var HOLIDAYS = {
    // 2024 年
    2024: [
      { name: '元旦', date: '2024-01-01', days: 1, type: 'holiday' },
      { name: '春节', date: '2024-02-10', days: 7, type: 'holiday', period: ['2024-02-10', '2024-02-17'] },
      { name: '清明节', date: '2024-04-04', days: 3, type: 'holiday', period: ['2024-04-04', '2024-04-06'] },
      { name: '劳动节', date: '2024-05-01', days: 5, type: 'holiday', period: ['2024-05-01', '2024-05-05'] },
      { name: '端午节', date: '2024-06-10', days: 3, type: 'holiday', period: ['2024-06-08', '2024-06-10'] },
      { name: '中秋节', date: '2024-09-17', days: 3, type: 'holiday', period: ['2024-09-15', '2024-09-17'] },
      { name: '国庆节', date: '2024-10-01', days: 7, type: 'holiday', period: ['2024-10-01', '2024-10-07'] }
    ],
    // 2024 年调休工作日
    workdays2024: [
      '2024-02-04', '2024-02-18', '2024-04-07', '2024-04-28',
      '2024-05-11', '2024-09-14', '2024-09-29', '2024-10-12'
    ],

    // 2025 年
    2025: [
      { name: '元旦', date: '2025-01-01', days: 1, type: 'holiday' },
      { name: '春节', date: '2025-01-29', days: 7, type: 'holiday', period: ['2025-01-28', '2025-02-03'] },
      { name: '清明节', date: '2025-04-04', days: 3, type: 'holiday', period: ['2025-04-04', '2025-04-06'] },
      { name: '劳动节', date: '2025-05-01', days: 5, type: 'holiday', period: ['2025-05-01', '2025-05-05'] },
      { name: '端午节', date: '2025-05-31', days: 3, type: 'holiday', period: ['2025-05-31', '2025-06-02'] },
      { name: '中秋节', date: '2025-10-06', days: 3, type: 'holiday', period: ['2025-10-04', '2025-10-06'] },
      { name: '国庆节', date: '2025-10-01', days: 7, type: 'holiday', period: ['2025-10-01', '2025-10-07'] }
    ],
    // 2025 年调休工作日
    workdays2025: [
      '2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28',
      '2025-10-11'
    ],

    // 2026 年
    2026: [
      { name: '元旦', date: '2026-01-01', days: 3, type: 'holiday', period: ['2026-01-01', '2026-01-03'] },
      { name: '春节', date: '2026-02-17', days: 7, type: 'holiday', period: ['2026-02-15', '2026-02-21'] },
      { name: '清明节', date: '2026-04-05', days: 3, type: 'holiday', period: ['2026-04-04', '2026-04-06'] },
      { name: '劳动节', date: '2026-05-01', days: 5, type: 'holiday', period: ['2026-05-01', '2026-05-05'] },
      { name: '端午节', date: '2026-06-19', days: 3, type: 'holiday', period: ['2026-06-19', '2026-06-21'] },
      { name: '中秋节', date: '2026-09-25', days: 3, type: 'holiday', period: ['2026-09-25', '2026-09-27'] },
      { name: '国庆节', date: '2026-10-01', days: 7, type: 'holiday', period: ['2026-10-01', '2026-10-07'] }
    ],
    // 2026 年调休工作日
    workdays2026: [
      '2026-02-14', '2026-02-22', '2026-04-03', '2026-04-26',
      '2026-05-09', '2026-09-27', '2026-10-10'
    ]
  }

  // ============================================
  // 节假日名称映射
  // ============================================
  var HOLIDAY_NAMES = {
    '元旦': '元旦节',
    '春节': '春节',
    '清明节': '清明节',
    '劳动节': '五一劳动节',
    '端午节': '端午节',
    '中秋节': '中秋节',
    '国庆节': '国庆节'
  }

  var HolidayData = {
    /**
     * 获取指定年份的节假日列表
     * @param {number} year - 年份
     * @returns {Array} 节假日列表
     */
    getHolidaysByYear: function (year) {
      return HOLIDAYS[year] || []
    },

    /**
     * 获取指定年份的调休工作日列表
     * @param {number} year - 年份
     * @returns {Array} 调休工作日列表
     */
    getWorkdaysByYear: function (year) {
      var key = 'workdays' + year
      return HOLIDAYS[key] || []
    },

    /**
     * 判断指定日期是否为节假日
     * @param {Date|string|number} date - 日期
     * @returns {Object|null} { isHoliday: boolean, name: string, holiday: Object }
     */
    isHoliday: function (date) {
      var d = dayjs(date)
      if (!d || !d.isValid()) return null

      var dateStr = d.format('YYYY-MM-DD')
      var year = d.year()

      var holidays = this.getHolidaysByYear(year)
      for (var i = 0; i < holidays.length; i++) {
        var h = holidays[i]
        if (h.period) {
          var start = dayjs(h.period[0])
          var end = dayjs(h.period[1])
          if ((d.isAfter(start) || d.isSame(start, 'day')) &&
              (d.isBefore(end) || d.isSame(end, 'day'))) {
            return {
              isHoliday: true,
              name: h.name,
              holiday: h
            }
          }
        } else if (dateStr === h.date) {
          return {
            isHoliday: true,
            name: h.name,
            holiday: h
          }
        }
      }

      return {
        isHoliday: false,
        name: null,
        holiday: null
      }
    },

    /**
     * 判断指定日期是否为工作日（考虑调休）
     * @param {Date|string|number} date - 日期
     * @returns {Object|null} { isWorkday: boolean, isWeekend: boolean, isHoliday: boolean, name: string }
     */
    isWorkday: function (date) {
      var d = dayjs(date)
      if (!d || !d.isValid()) return null

      var dateStr = d.format('YYYY-MM-DD')
      var year = d.year()
      var dayOfWeek = d.day()

      // 检查是否为调休工作日（周末上班）
      var workdays = this.getWorkdaysByYear(year)
      for (var i = 0; i < workdays.length; i++) {
        if (workdays[i] === dateStr) {
          return {
            isWorkday: true,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            isHoliday: false,
            name: '调休工作日'
          }
        }
      }

      // 检查是否为节假日
      var holidayResult = this.isHoliday(date)
      if (holidayResult && holidayResult.isHoliday) {
        return {
          isWorkday: false,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isHoliday: true,
          name: holidayResult.name
        }
      }

      // 正常判断：周一到周五为工作日
      var isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      return {
        isWorkday: !isWeekend,
        isWeekend: isWeekend,
        isHoliday: false,
        name: isWeekend ? '周末' : '工作日'
      }
    },

    /**
     * 获取下一个最近的节假日
     * @param {Date|string|number} date - 参考日期
     * @returns {Object|null} { name, date, daysLeft, holiday }
     */
    getNextHoliday: function (date) {
      var d = dayjs(date)
      if (!d || !d.isValid()) return null

      var year = d.year()
      // 检查当前年份和下一年的节假日
      var yearsToCheck = [year, year + 1]

      var nextHoliday = null
      var minDiff = Infinity

      for (var y = 0; y < yearsToCheck.length; y++) {
        var holidays = this.getHolidaysByYear(yearsToCheck[y])
        for (var i = 0; i < holidays.length; i++) {
          var h = holidays[i]
          var holidayDate = dayjs(h.date)
          var diff = holidayDate.diff(d, 'day')

          if (diff >= 0 && diff < minDiff) {
            minDiff = diff
            nextHoliday = {
              name: h.name,
              date: h.date,
              daysLeft: diff,
              holiday: h
            }
          }
        }
      }

      return nextHoliday
    },

    /**
     * 获取节假日名称
     * @param {string} key - 节假日键名
     * @returns {string}
     */
    getHolidayName: function (key) {
      return HOLIDAY_NAMES[key] || key
    },

    /**
     * 获取所有可用的年份
     * @returns {Array}
     */
    getAvailableYears: function () {
      var years = []
      for (var key in HOLIDAYS) {
        if (HOLIDAYS.hasOwnProperty(key) && /^\d{4}$/.test(key)) {
          years.push(parseInt(key, 10))
        }
      }
      return years.sort()
    }
  }

  // 暴露到全局
  global.HolidayData = HolidayData

})(typeof window !== 'undefined' ? window : this)