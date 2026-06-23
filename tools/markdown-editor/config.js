/**
 * Markdown Editor - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var MarkdownConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      theme: 'light',
      fontSize: 14,
      lineHeight: 1.6,
      autoPreview: true,
      maxHistory: 20,
      autoSave: true,
      autoSaveDelay: 2000
    },

    // ===== 主题选项 =====
    THEME_OPTIONS: [
      { value: 'light', label: '浅色主题' },
      { value: 'dark', label: '深色主题' }
    ],

    // ===== 字号选项 =====
    FONT_SIZE_OPTIONS: [
      { value: 12, label: '12px' },
      { value: 13, label: '13px' },
      { value: 14, label: '14px' },
      { value: 15, label: '15px' },
      { value: 16, label: '16px' },
      { value: 18, label: '18px' },
      { value: 20, label: '20px' }
    ],

    // ===== 常用模板 =====
    TEMPLATES: [
      {
        name: '空白文档',
        content: '# 标题\n\n开始编写你的 Markdown 文档...\n\n## 二级标题\n\n这是一段**粗体**文字，这是一段*斜体*文字。\n\n- 列表项 1\n- 列表项 2\n- 列表项 3\n\n1. 有序列表 1\n2. 有序列表 2\n\n> 这是一段引用\n\n```\n代码块\n```\n\n---\n\n| 表格 | 列1 | 列2 |\n|------|-----|-----|\n| 行1  | A   | B   |\n| 行2  | C   | D   |'
      },
      {
        name: 'README 模板',
        content: '# 项目名称\n\n> 项目简介\n\n## 功能特性\n\n- 特性 1\n- 特性 2\n- 特性 3\n\n## 快速开始\n\n```bash\nnpm install\nnpm start\n```\n\n## 使用说明\n\n1. 第一步\n2. 第二步\n3. 第三步\n\n## API 文档\n\n### `functionName(param1, param2)`\n\n函数说明\n\n## 许可证\n\nMIT'
      },
      {
        name: '笔记模板',
        content: '# 笔记标题\n\n**日期**: 2024-01-01\n**标签**: #笔记 #技术\n\n## 概述\n\n\n## 详细内容\n\n### 要点 1\n\n\n### 要点 2\n\n\n## 总结\n\n\n## 参考资料\n\n- \n- '
      },
      {
        name: '待办事项',
        content: '# 待办事项\n\n## 今日任务\n\n- [ ] 任务 1\n- [ ] 任务 2\n- [ ] 任务 3\n\n## 本周任务\n\n- [ ] 任务 A\n- [ ] 任务 B\n  - [ ] 子任务 B1\n  - [ ] 子任务 B2\n\n## 已完成\n\n- [x] 已完成任务 1\n- [x] 已完成任务 2'
      }
    ],

    // ===== 导出选项 =====
    EXPORT_OPTIONS: {
      htmlTemplate: '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>{{title}}</title>\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }\n    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }\n    code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }\n    table { border-collapse: collapse; width: 100%; }\n    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }\n    th { background: #f6f8fa; }\n    blockquote { border-left: 4px solid #dfe2e5; padding: 0 16px; color: #6a737d; margin: 0; }\n    img { max-width: 100%; }\n  </style>\n</head>\n<body>\n{{content}}\n</body>\n</html>'
    },

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20,

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'md_history',
      draft: 'md_draft',
      theme: 'md_theme',
      fontSize: 'md_font_size',
      autoPreview: 'md_auto_preview'
    }
  }

  // 暴露到全局
  global.MarkdownConfig = MarkdownConfig

})(typeof window !== 'undefined' ? window : this)