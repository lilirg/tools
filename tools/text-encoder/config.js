/**
 * Text Encoder - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var TextEncoderConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      encodeType: 'base64',
      hashAlgorithms: ['md5'],
      maxHistory: 20
    },

    // ===== 编码类型 =====
    ENCODE_TYPES: [
      { label: 'Base64', value: 'base64' },
      { label: 'URL 编码', value: 'url' },
      { label: 'HTML 实体', value: 'html' },
      { label: 'Unicode 转义', value: 'unicode' },
      { label: 'ROT13', value: 'rot13' }
    ],

    // ===== 哈希算法 =====
    HASH_ALGORITHMS: [
      { label: 'MD5', value: 'md5' },
      { label: 'SHA-1', value: 'sha1' },
      { label: 'SHA-256', value: 'sha256' },
      { label: 'SHA-512', value: 'sha512' }
    ],

    // ===== 预设文本样本 =====
    PRESET_SAMPLES: [
      { label: '英文文本', value: 'Hello, World! This is a sample text for testing.' },
      { label: '中文文本', value: '你好，世界！这是一段用于测试的示例文本。' },
      { label: '混合文本', value: 'Hello 你好 123 !@# 测试 Test' },
      { label: 'JSON 数据', value: '{"name":"张三","age":30,"city":"北京"}' },
      { label: 'URL 链接', value: 'https://example.com/path?query=value&lang=zh-CN' },
      { label: 'HTML 代码', value: '<div class="container"><p>Hello World</p></div>' }
    ],

    // ===== 统计标签映射 =====
    STATS_LABELS: {
      charCount: '总字符数（含空格）',
      charCountNoSpace: '总字符数（不含空格）',
      wordCount: '单词数',
      lineCount: '行数',
      byteCount: '字节数（UTF-8）',
      cjkCount: '中文字符数',
      letterCount: '英文字母数',
      digitCount: '数字数',
      punctuationCount: '标点符号数',
      spaceCount: '空格数',
      uniqueWords: '唯一词数'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20
  }

  // 暴露到全局
  global.TextEncoderConfig = TextEncoderConfig

})(typeof window !== 'undefined' ? window : this)