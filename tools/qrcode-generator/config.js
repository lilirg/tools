/**
 * QRCode Generator - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var QRConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      text: '',
      width: 280,
      margin: 10,
      fgColor: '#000000',
      bgColor: '#ffffff',
      eccLevel: 'M', // L, M, Q, H
      logoImage: null,
      logoSize: 60,
      dotStyle: 'square', // square, rounded, diamond
      cornerStyle: 'square', // square, rounded, circle
      gradient: false,
      gradientColors: ['#667eea', '#764ba2'],
      customPattern: false,
      patternType: 'default', // default, dots, lines
    },

    // ===== 纠错等级映射 =====
    ECC_MAP: {
      'L': 1,  // 低 (7%)
      'M': 0,  // 中 (15%)
      'Q': 3,  // 较高 (25%)
      'H': 2   // 高 (30%)
    },

    // ===== 纠错等级标签 =====
    ECC_LABELS: {
      'L': '低 (7%)',
      'M': '中 (15%)',
      'Q': '较高 (25%)',
      'H': '高 (30%)'
    },

    // ===== 预设颜色 =====
    PRESET_COLORS: [
      { name: '经典黑', fg: '#000000', bg: '#ffffff' },
      { name: '深蓝', fg: '#1a365d', bg: '#ffffff' },
      { name: '翡翠绿', fg: '#065f46', bg: '#ffffff' },
      { name: '玫瑰红', fg: '#9b1c31', bg: '#ffffff' },
      { name: '紫色', fg: '#5b21b6', bg: '#ffffff' },
      { name: '橙色', fg: '#c2410c', bg: '#ffffff' },
      { name: '深灰', fg: '#1f2937', bg: '#ffffff' },
      { name: '暗黑', fg: '#ffffff', bg: '#1a1a2e' },
      { name: '海洋', fg: '#0ea5e9', bg: '#f0f9ff' },
      { name: '森林', fg: '#059669', bg: '#ecfdf5' },
      { name: '日落', fg: '#d97706', bg: '#fffbeb' },
      { name: '渐变紫', fg: '#8b5cf6', bg: '#f5f3ff' },
    ],

    // ===== 尺寸选项 =====
    SIZE_OPTIONS: [160, 200, 240, 280, 320, 360, 400, 480, 560],

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20
  }

  // 暴露到全局
  global.QRConfig = QRConfig

})(typeof window !== 'undefined' ? window : this)