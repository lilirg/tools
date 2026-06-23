/**
 * Color Picker - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var ColorConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      color: '#1677ff',
      format: 'hex',
      paletteType: 'complementary',
      paletteCount: 5,
      maxHistory: 20,
      maxFavorites: 50
    },

    // ===== 颜色格式 =====
    COLOR_FORMATS: [
      { label: 'HEX', value: 'hex' },
      { label: 'RGB', value: 'rgb' },
      { label: 'HSL', value: 'hsl' },
      { label: 'HSV', value: 'hsv' }
    ],

    // ===== 配色方案类型 =====
    PALETTE_TYPES: [
      { label: '互补色', value: 'complementary', icon: '🔶' },
      { label: '单色系', value: 'monochromatic', icon: '🎨' },
      { label: '三色系', value: 'triadic', icon: '🔺' },
      { label: '四色系', value: 'tetradic', icon: '🔷' },
      { label: '类似色', value: 'analogous', icon: '🌈' }
    ],

    // ===== 预设颜色样本 =====
    PRESET_COLORS: [
      '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#38D9A9',
      '#4DABF7', '#748FFC', '#9775FA', '#DA77F2', '#F783AC',
      '#495057', '#868E96', '#ADB5BD', '#DEE2E6', '#F8F9FA',
      '#C92A2A', '#E67700', '#5C940D', '#2B8A3E', '#0B7285',
      '#1864AB', '#364FC7', '#6741D9', '#9C36B5', '#A61E4D'
    ],

    // ===== 色相条默认渐变 =====
    HUE_GRADIENT_COLORS: [
      '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'
    ],

    // ===== Canvas 尺寸 =====
    CANVAS: {
      hueBar: { width: 300, height: 20 },
      saturationPanel: { width: 300, height: 200 }
    },

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      favorites: 'cp_favorites',
      history: 'cp_history',
      lastColor: 'cp_last_color',
      lastFormat: 'cp_last_format',
      lastPaletteType: 'cp_last_palette_type'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20,

    // ===== 最大收藏数量 =====
    MAX_FAVORITES: 50
  }

  // 暴露到全局
  global.ColorConfig = ColorConfig

})(typeof window !== 'undefined' ? window : this)