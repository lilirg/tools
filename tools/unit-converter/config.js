/**
 * Unit Converter - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var UnitConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      category: 'length',
      precision: 4,
      maxHistory: 20,
      smartDetect: true
    },

    // ===== 类别图标映射 =====
    CATEGORY_ICONS: {
      length: '📏',
      weight: '⚖️',
      temperature: '🌡️',
      area: '📐',
      volume: '🧪',
      data: '💾',
      speed: '🚀',
      time: '⏱️',
      angle: '📐',
      pressure: '💨',
      energy: '⚡',
      power: '🔌'
    },

    // ===== 类别中文名 =====
    CATEGORY_LABELS: {
      length: '长度',
      weight: '重量/质量',
      temperature: '温度',
      area: '面积',
      volume: '体积/容积',
      data: '数据存储',
      speed: '速度',
      time: '时间',
      angle: '角度',
      pressure: '压力',
      energy: '能量',
      power: '功率'
    },

    // ===== 类别排序 =====
    CATEGORY_ORDER: [
      'length', 'weight', 'temperature', 'area', 'volume',
      'data', 'speed', 'time', 'angle', 'pressure', 'energy', 'power'
    ],

    // ===== 精度选项 =====
    PRECISION_OPTIONS: [
      { label: '0 位小数', value: 0 },
      { label: '1 位小数', value: 1 },
      { label: '2 位小数', value: 2 },
      { label: '3 位小数', value: 3 },
      { label: '4 位小数', value: 4 },
      { label: '6 位小数', value: 6 },
      { label: '8 位小数', value: 8 },
      { label: '10 位小数', value: 10 }
    ],

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20,

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'uc_history',
      lastCategory: 'uc_last_category',
      lastFromUnit: 'uc_last_from_unit',
      lastToUnit: 'uc_last_to_unit',
      precision: 'uc_precision',
      smartDetect: 'uc_smart_detect'
    }
  }

  // 暴露到全局
  global.UnitConfig = UnitConfig

})(typeof window !== 'undefined' ? window : this)