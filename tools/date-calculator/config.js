/**
 * Date Calculator - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var DateCalcConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      dateFormat: 'YYYY-MM-DD',
      timezone: 'Asia/Shanghai',
      maxHistory: 20
    },

    // ===== 预设日期格式 =====
    DATE_FORMATS: [
      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
      { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
      { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
      { label: 'MM-DD-YYYY', value: 'MM-DD-YYYY' },
      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
      { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' },
      { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
      { label: 'YYYY/MM/DD HH:mm:ss', value: 'YYYY/MM/DD HH:mm:ss' },
      { label: 'YYYY-MM-DDTHH:mm:ssZ', value: 'YYYY-MM-DDTHH:mm:ssZ' }
    ],

    // ===== 时区列表 =====
    TIMEZONES: [
      { label: 'UTC (协调世界时)', value: 'UTC' },
      { label: 'Asia/Shanghai (中国标准时间)', value: 'Asia/Shanghai' },
      { label: 'Asia/Tokyo (日本标准时间)', value: 'Asia/Tokyo' },
      { label: 'Asia/Seoul (韩国标准时间)', value: 'Asia/Seoul' },
      { label: 'Asia/Singapore (新加坡时间)', value: 'Asia/Singapore' },
      { label: 'Asia/Hong_Kong (香港时间)', value: 'Asia/Hong_Kong' },
      { label: 'Asia/Taipei (台北时间)', value: 'Asia/Taipei' },
      { label: 'Asia/Kolkata (印度标准时间)', value: 'Asia/Kolkata' },
      { label: 'Asia/Dubai (迪拜时间)', value: 'Asia/Dubai' },
      { label: 'Europe/London (格林威治标准时间)', value: 'Europe/London' },
      { label: 'Europe/Paris (中欧时间)', value: 'Europe/Paris' },
      { label: 'Europe/Berlin (柏林时间)', value: 'Europe/Berlin' },
      { label: 'Europe/Moscow (莫斯科时间)', value: 'Europe/Moscow' },
      { label: 'America/New_York (美国东部时间)', value: 'America/New_York' },
      { label: 'America/Chicago (美国中部时间)', value: 'America/Chicago' },
      { label: 'America/Denver (美国山地时间)', value: 'America/Denver' },
      { label: 'America/Los_Angeles (美国太平洋时间)', value: 'America/Los_Angeles' },
      { label: 'America/Sao_Paulo (巴西时间)', value: 'America/Sao_Paulo' },
      { label: 'Australia/Sydney (澳大利亚东部时间)', value: 'Australia/Sydney' },
      { label: 'Pacific/Auckland (新西兰时间)', value: 'Pacific/Auckland' }
    ],

    // ===== 时区偏移量（小时） =====
    TIMEZONE_OFFSETS: {
      'UTC': 0,
      'Asia/Shanghai': 8,
      'Asia/Tokyo': 9,
      'Asia/Seoul': 9,
      'Asia/Singapore': 8,
      'Asia/Hong_Kong': 8,
      'Asia/Taipei': 8,
      'Asia/Kolkata': 5.5,
      'Asia/Dubai': 4,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Europe/Berlin': 1,
      'Europe/Moscow': 3,
      'America/New_York': -5,
      'America/Chicago': -6,
      'America/Denver': -7,
      'America/Los_Angeles': -8,
      'America/Sao_Paulo': -3,
      'Australia/Sydney': 11,
      'Pacific/Auckland': 13
    },

    // ===== 单位映射 =====
    UNITS: {
      'day': '天',
      'week': '周',
      'month': '月',
      'year': '年'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20
  }

  // 暴露到全局
  global.DateCalcConfig = DateCalcConfig

})(typeof window !== 'undefined' ? window : this)