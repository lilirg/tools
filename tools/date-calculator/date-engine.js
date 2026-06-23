/**
 * Date Calculator - 日期计算引擎
 * 基于 dayjs 提供日期计算、格式化、时区转换等核心功能
 *
 * 依赖: dayjs, DateCalcConfig
 * dayjs 插件: utc, timezone, customParseFormat, advancedFormat, isLeapYear, isBetween, duration, relativeTime
 */
;(function (global) {
  'use strict'

  var dayjs = global.dayjs
  var Config = global.DateCalcConfig

  if (!dayjs) {
    console.error('DateEngine: dayjs is required')
    return
  }

  var DateEngine = {
    // ============================================
    // 日期差计算
    // ============================================
    /**
     * 计算两个日期之间的差值
     * @param {Date|string|number} date1 - 起始日期
     * @param {Date|string|number} date2 - 结束日期
     * @returns {Object|null} { years, months, days, hours, minutes, seconds, totalDays, totalHours, totalMinutes, totalSeconds }
     */
    dateDiff: function (date1, date2) {
      var d1 = this._toDayjs(date1)
      var d2 = this._toDayjs(date2)

      if (!d1 || !d2 || !d1.isValid() || !d2.isValid()) return null

      // 确保 d1 <= d2
      if (d1.isAfter(d2)) {
        var tmp = d1
        d1 = d2
        d2 = tmp
      }

      var diffMs = d2.valueOf() - d1.valueOf()

      // 总天数/小时/分钟/秒
      var totalSeconds = Math.floor(diffMs / 1000)
      var totalMinutes = Math.floor(totalSeconds / 60)
      var totalHours = Math.floor(totalMinutes / 60)
      var totalDays = Math.floor(totalHours / 24)

      // 精确的年月日计算
      var years = d2.year() - d1.year()
      var months = d2.month() - d1.month()
      var days = d2.date() - d1.date()

      if (days < 0) {
        months--
        // 获取上个月的天数
        var prevMonth = d2.subtract(1, 'month')
        days += prevMonth.daysInMonth()
      }

      if (months < 0) {
        years--
        months += 12
      }

      // 剩余时间（时/分/秒）
      var hours = d2.hour() - d1.hour()
      var minutes = d2.minute() - d1.minute()
      var seconds = d2.second() - d1.second()

      if (seconds < 0) {
        minutes--
        seconds += 60
      }
      if (minutes < 0) {
        hours--
        minutes += 60
      }
      if (hours < 0) {
        hours += 24
      }

      return {
        years: years,
        months: months,
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        totalDays: totalDays,
        totalHours: totalHours,
        totalMinutes: totalMinutes,
        totalSeconds: totalSeconds
      }
    },

    // ============================================
    // 日期加减
    // ============================================
    /**
     * 日期加减
     * @param {Date|string|number} date - 基准日期
     * @param {number} amount - 数量（正数加，负数减）
     * @param {string} unit - 单位: day/week/month/year
     * @returns {dayjs|null} 计算后的 dayjs 对象
     */
    dateAdd: function (date, amount, unit) {
      var d = this._toDayjs(date)
      if (!d || !d.isValid()) return null

      var unitMap = {
        'day': 'day',
        'week': 'week',
        'month': 'month',
        'year': 'year'
      }

      var u = unitMap[unit] || 'day'
      return d.add(amount, u)
    },

    // ============================================
    // 工作日计算
    // ============================================
    /**
     * 计算两个日期之间的工作日天数
     * @param {Date|string|number} start - 开始日期
     * @param {Date|string|number} end - 结束日期
     * @returns {number} 工作日天数
     */
    businessDaysDiff: function (start, end) {
      var d1 = this._toDayjs(start)
      var d2 = this._toDayjs(end)

      if (!d1 || !d2 || !d1.isValid() || !d2.isValid()) return 0

      if (d1.isAfter(d2)) {
        var tmp = d1
        d1 = d2
        d2 = tmp
      }

      var count = 0
      var current = d1.startOf('day')

      while (current.isBefore(d2) || current.isSame(d2, 'day')) {
        var dayOfWeek = current.day()
        // 周一到周五为工作日
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++
        }
        current = current.add(1, 'day')
      }

      return count
    },

    // ============================================
    // 时间戳转日期
    // ============================================
    /**
     * 时间戳转可读日期
     * @param {number} timestamp - 时间戳
     * @param {boolean} isMs - 是否为毫秒级时间戳（默认 true）
     * @returns {Object|null} { date, formats: { ... } }
     */
    timestampToDate: function (timestamp, isMs) {
      if (typeof timestamp !== 'number') return null

      var ts = isMs !== false ? timestamp : timestamp * 1000
      var d = dayjs(ts)

      if (!d.isValid()) return null

      return {
        date: d.toDate(),
        formats: {
          'YYYY-MM-DD': d.format('YYYY-MM-DD'),
          'YYYY/MM/DD': d.format('YYYY/MM/DD'),
          'YYYY-MM-DD HH:mm:ss': d.format('YYYY-MM-DD HH:mm:ss'),
          'YYYY/MM/DD HH:mm:ss': d.format('YYYY/MM/DD HH:mm:ss'),
          'YYYY年MM月DD日 HH:mm:ss': d.format('YYYY年MM月DD日 HH:mm:ss'),
          'ISO 8601': d.toISOString(),
          'UTC': d.utc().format('YYYY-MM-DD HH:mm:ss') + ' UTC',
          'Locale': d.format('YYYY-MM-DD HH:mm:ss')
        }
      }
    },

    // ============================================
    // 日期转时间戳
    // ============================================
    /**
     * 日期转时间戳
     * @param {Date|string|number} date - 日期
     * @returns {Object|null} { seconds: number, milliseconds: number }
     */
    dateToTimestamp: function (date) {
      var d = this._toDayjs(date)
      if (!d || !d.isValid()) return null

      return {
        seconds: Math.floor(d.valueOf() / 1000),
        milliseconds: d.valueOf()
      }
    },

    // ============================================
    // 时区转换
    // ============================================
    /**
     * 时区转换
     * @param {Date|string|number} date - 源日期
     * @param {string} fromZone - 源时区
     * @param {string} toZone - 目标时区
     * @returns {Object|null} { sourceDate, targetDate, sourceFormatted, targetFormatted, offsetHours }
     */
    timezoneConvert: function (date, fromZone, toZone) {
      var d = this._toDayjs(date)
      if (!d || !d.isValid()) return null

      var fromOffset = Config.TIMEZONE_OFFSETS[fromZone]
      var toOffset = Config.TIMEZONE_OFFSETS[toZone]

      if (fromOffset === undefined || toOffset === undefined) return null

      // 计算偏移差（小时）
      var offsetDiff = toOffset - fromOffset
      var offsetMs = offsetDiff * 60 * 60 * 1000

      var targetDate = new Date(d.valueOf() + offsetMs)
      var targetDayjs = dayjs(targetDate)

      return {
        sourceDate: d.toDate(),
        targetDate: targetDate,
        sourceFormatted: d.format('YYYY-MM-DD HH:mm:ss') + ' ' + fromZone,
        targetFormatted: targetDayjs.format('YYYY-MM-DD HH:mm:ss') + ' ' + toZone,
        offsetHours: offsetDiff
      }
    },

    // ============================================
    // 年龄计算
    // ============================================
    /**
     * 年龄计算（精确到天）
     * @param {Date|string|number} birthDate - 出生日期
     * @param {Date|string|number} [referenceDate] - 参考日期（默认今天）
     * @returns {Object|null} { years, months, days, totalDays, nextBirthday, daysToNextBirthday }
     */
    ageCalculate: function (birthDate, referenceDate) {
      var birth = this._toDayjs(birthDate)
      var ref = referenceDate ? this._toDayjs(referenceDate) : dayjs()

      if (!birth || !ref || !birth.isValid() || !ref.isValid()) return null
      if (birth.isAfter(ref)) return null

      var diff = this.dateDiff(birth.toDate(), ref.toDate())

      // 计算下一个生日
      var nextBirthday = dayjs(ref.format('YYYY') + '-' + (birth.month() + 1) + '-' + birth.date())
      if (nextBirthday.isBefore(ref) || nextBirthday.isSame(ref, 'day')) {
        nextBirthday = nextBirthday.add(1, 'year')
      }

      var daysToNextBirthday = nextBirthday.diff(ref, 'day')

      return {
        years: diff.years,
        months: diff.months,
        days: diff.days,
        totalDays: diff.totalDays,
        nextBirthday: nextBirthday.toDate(),
        daysToNextBirthday: daysToNextBirthday
      }
    },

    // ============================================
    // 时间段计算
    // ============================================
    /**
     * 时间段计算
     * @param {string} startTime - 开始时间 (HH:mm 或 HH:mm:ss)
     * @param {string} endTime - 结束时间 (HH:mm 或 HH:mm:ss)
     * @returns {Object|null} { hours, minutes, seconds, totalMinutes, totalSeconds }
     */
    timeDuration: function (startTime, endTime) {
      var startParts = startTime.split(':').map(Number)
      var endParts = endTime.split(':').map(Number)

      if (startParts.length < 2 || endParts.length < 2) return null

      var startSeconds = startParts[0] * 3600 + (startParts[1] || 0) * 60 + (startParts[2] || 0)
      var endSeconds = endParts[0] * 3600 + (endParts[1] || 0) * 60 + (endParts[2] || 0)

      // 如果结束时间小于开始时间，视为跨天
      if (endSeconds < startSeconds) {
        endSeconds += 24 * 3600
      }

      var diffSeconds = endSeconds - startSeconds
      var hours = Math.floor(diffSeconds / 3600)
      var minutes = Math.floor((diffSeconds % 3600) / 60)
      var seconds = diffSeconds % 60

      return {
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        totalMinutes: Math.floor(diffSeconds / 60),
        totalSeconds: diffSeconds
      }
    },

    // ============================================
    // 闰年判断
    // ============================================
    /**
     * 判断是否为闰年
     * @param {number} year - 年份
     * @returns {boolean}
     */
    isLeapYear: function (year) {
      return dayjs(new Date(year, 0, 1)).isLeapYear()
    },

    // ============================================
    // 获取某月天数
    // ============================================
    /**
     * 获取某月的天数
     * @param {number} year - 年份
     * @param {number} month - 月份 (1-12)
     * @returns {number}
     */
    daysInMonth: function (year, month) {
      return dayjs(new Date(year, month - 1, 1)).daysInMonth()
    },

    // ============================================
    // 日期格式化
    // ============================================
    /**
     * 日期格式化
     * @param {Date|string|number} date - 日期
     * @param {string} format - 格式模板（dayjs 格式）
     * @returns {string}
     */
    formatDate: function (date, format) {
      var d = this._toDayjs(date)
      if (!d || !d.isValid()) return ''

      format = format || Config.DEFAULTS.dateFormat
      return d.format(format)
    },

    // ============================================
    // 获取当前时间
    // ============================================
    /**
     * 获取当前时间的 dayjs 对象
     * @returns {dayjs}
     */
    now: function () {
      return dayjs()
    },

    // ============================================
    // 内部工具方法
    // ============================================

    /**
     * 转换为 dayjs 对象
     * @param {Date|string|number} val
     * @returns {dayjs|null}
     */
    _toDayjs: function (val) {
      if (!val && val !== 0) return null
      if (val instanceof Date) return dayjs(val)
      if (typeof val === 'string') {
        // 尝试解析 YYYY-MM-DD HH:mm:ss 格式
        var d = dayjs(val, 'YYYY-MM-DD HH:mm:ss')
        if (d.isValid()) return d
        d = dayjs(val, 'YYYY-MM-DD')
        if (d.isValid()) return d
        d = dayjs(val, 'YYYY/MM/DD')
        if (d.isValid()) return d
        d = dayjs(val, 'YYYY/MM/DD HH:mm:ss')
        if (d.isValid()) return d
        // 尝试标准解析
        d = dayjs(val)
        if (d.isValid()) return d
        return null
      }
      if (typeof val === 'number') return dayjs(val)
      return null
    }
  }

  // 暴露到全局
  global.DateEngine = DateEngine

})(typeof window !== 'undefined' ? window : this)