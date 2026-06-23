/**
 * Image Tool - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var ImageConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1920,
      format: 'original',
      maxFileSize: 20 * 1024 * 1024, // 20MB
      maxHistory: 20
    },

    // ===== 输出格式选项 =====
    FORMAT_OPTIONS: [
      { value: 'original', label: '保持原格式' },
      { value: 'image/png', label: 'PNG' },
      { value: 'image/jpeg', label: 'JPEG' },
      { value: 'image/webp', label: 'WebP' },
      { value: 'image/bmp', label: 'BMP' }
    ],

    // ===== 质量预设 =====
    QUALITY_PRESETS: [
      { value: 100, label: '无损 (100%)' },
      { value: 90, label: '高质量 (90%)' },
      { value: 80, label: '良好 (80%)' },
      { value: 60, label: '中等 (60%)' },
      { value: 40, label: '低质量 (40%)' },
      { value: 20, label: '极低 (20%)' }
    ],

    // ===== 尺寸预设 =====
    SIZE_PRESETS: [
      { value: 4096, label: '4096px (4K)' },
      { value: 1920, label: '1920px (全高清)' },
      { value: 1280, label: '1280px (HD)' },
      { value: 800, label: '800px' },
      { value: 480, label: '480px' },
      { value: 0, label: '不限制' }
    ],

    // ===== 支持的文件类型 =====
    SUPPORTED_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif'],

    // ===== 支持的文件扩展名 =====
    SUPPORTED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'],

    // ===== 文件大小单位 =====
    SIZE_UNITS: ['B', 'KB', 'MB', 'GB'],

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20,

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'img_history',
      lastQuality: 'img_last_quality',
      lastFormat: 'img_last_format',
      lastMaxWidth: 'img_last_max_width',
      lastMaxHeight: 'img_last_max_height'
    }
  }

  // 暴露到全局
  global.ImageConfig = ImageConfig

})(typeof window !== 'undefined' ? window : this)