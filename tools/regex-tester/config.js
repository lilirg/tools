/**
 * Regex Tester - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var RegexConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      flags: 'g',
      maxHistory: 20
    },

    // ===== 修饰符选项 =====
    FLAGS: [
      { label: '全局', value: 'g', desc: '查找所有匹配' },
      { label: '忽略大小写', value: 'i', desc: '不区分大小写' },
      { label: '多行', value: 'm', desc: '^$ 匹配每行开头结尾' },
      { label: '点号通配', value: 's', desc: '点号匹配换行符' },
      { label: 'Unicode', value: 'u', desc: '启用 Unicode 匹配' },
      { label: '粘性', value: 'y', desc: '从 lastIndex 开始匹配' }
    ],

    // ===== 常用正则模板 =====
    TEMPLATES: [
      {
        label: '📧 邮箱地址',
        pattern: '[\\w.-]+@[\\w.-]+\\.\\w+',
        flags: 'gi',
        desc: '匹配标准邮箱地址'
      },
      {
        label: '📱 手机号（中国）',
        pattern: '1[3-9]\\d{9}',
        flags: 'g',
        desc: '匹配中国大陆手机号'
      },
      {
        label: '🔗 URL 链接',
        pattern: 'https?://[\\w./?=&%-]+',
        flags: 'gi',
        desc: '匹配 HTTP/HTTPS 链接'
      },
      {
        label: '🌐 IP 地址',
        pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}',
        flags: 'g',
        desc: '匹配 IPv4 地址'
      },
      {
        label: '📅 日期 (YYYY-MM-DD)',
        pattern: '\\d{4}-\\d{2}-\\d{2}',
        flags: 'g',
        desc: '匹配日期格式'
      },
      {
        label: '🕐 时间 (HH:MM)',
        pattern: '\\d{2}:\\d{2}',
        flags: 'g',
        desc: '匹配时间格式'
      },
      {
        label: '🆔 身份证号（中国）',
        pattern: '\\d{17}[\\dXx]',
        flags: 'g',
        desc: '匹配 18 位身份证号'
      },
      {
        label: '🔤 中文汉字',
        pattern: '[\\u4e00-\\u9fff]+',
        flags: 'g',
        desc: '匹配中文字符'
      },
      {
        label: '💰 金额（含小数）',
        pattern: '\\d+\\.\\d{2}',
        flags: 'g',
        desc: '匹配带两位小数的金额'
      },
      {
        label: '📝 HTML 标签',
        pattern: '<[^>]+>',
        flags: 'gi',
        desc: '匹配 HTML 标签'
      }
    ],

    // ===== 正则语法参考 =====
    SYNTAX_REFERENCE: [
      { category: '字符匹配', items: [
        { syntax: '.', desc: '匹配任意单个字符（除换行符）' },
        { syntax: '\\d', desc: '匹配数字 [0-9]' },
        { syntax: '\\D', desc: '匹配非数字' },
        { syntax: '\\w', desc: '匹配单词字符 [a-zA-Z0-9_]' },
        { syntax: '\\W', desc: '匹配非单词字符' },
        { syntax: '\\s', desc: '匹配空白字符（空格、制表符、换行）' },
        { syntax: '\\S', desc: '匹配非空白字符' }
      ]},
      { category: '量词', items: [
        { syntax: '*', desc: '匹配前一个字符 0 次或多次' },
        { syntax: '+', desc: '匹配前一个字符 1 次或多次' },
        { syntax: '?', desc: '匹配前一个字符 0 次或 1 次' },
        { syntax: '{n}', desc: '匹配前一个字符恰好 n 次' },
        { syntax: '{n,}', desc: '匹配前一个字符至少 n 次' },
        { syntax: '{n,m}', desc: '匹配前一个字符 n 到 m 次' }
      ]},
      { category: '位置匹配', items: [
        { syntax: '^', desc: '匹配字符串开头（多行模式匹配行首）' },
        { syntax: '$', desc: '匹配字符串结尾（多行模式匹配行尾）' },
        { syntax: '\\b', desc: '匹配单词边界' },
        { syntax: '\\B', desc: '匹配非单词边界' }
      ]},
      { category: '分组与引用', items: [
        { syntax: '(pattern)', desc: '捕获组，捕获匹配的文本' },
        { syntax: '(?:pattern)', desc: '非捕获组，仅分组不捕获' },
        { syntax: '(?=pattern)', desc: '正向先行断言' },
        { syntax: '(?!pattern)', desc: '负向先行断言' },
        { syntax: '\\1', desc: '反向引用第一个捕获组' }
      ]},
      { category: '字符类', items: [
        { syntax: '[abc]', desc: '匹配 a、b 或 c' },
        { syntax: '[^abc]', desc: '匹配除 a、b、c 外的字符' },
        { syntax: '[a-z]', desc: '匹配 a 到 z 范围内的字符' },
        { syntax: 'a|b', desc: '匹配 a 或 b' }
      ]}
    ],

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'rt_history',
      lastPattern: 'rt_last_pattern',
      lastFlags: 'rt_last_flags',
      lastTestText: 'rt_last_test_text'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20
  }

  // 暴露到全局
  global.RegexConfig = RegexConfig

})(typeof window !== 'undefined' ? window : this)