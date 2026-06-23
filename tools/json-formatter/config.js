/**
 * JSON Formatter - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var JsonConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      indent: 2,
      viewMode: 'code',
      maxSize: 1024 * 100, // 100KB 限制
      maxHistory: 20
    },

    // ===== 缩进选项 =====
    INDENT_OPTIONS: [
      { label: '2 空格', value: 2 },
      { label: '4 空格', value: 4 },
      { label: '8 空格', value: 8 },
      { label: 'Tab', value: 'tab' }
    ],

    // ===== 视图模式 =====
    VIEW_MODES: [
      { label: '代码视图', value: 'code' },
      { label: '树形视图', value: 'tree' }
    ],

    // ===== 对比模式 =====
    DIFF_MODES: [
      { label: '并排对比', value: 'side-by-side' },
      { label: '行内对比', value: 'inline' }
    ],

    // ===== 最大 JSON 大小（字节） =====
    MAX_JSON_SIZE: 1024 * 100,

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'jf_history',
      lastIndent: 'jf_last_indent',
      lastViewMode: 'jf_last_view_mode'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20
  }

  // 暴露到全局
  global.JsonConfig = JsonConfig

})(typeof window !== 'undefined' ? window : this)