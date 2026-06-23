/**
 * Markdown Editor - Markdown 解析引擎
 * 纯前端实现 Markdown 到 HTML 的转换
 *
 * 依赖: MarkdownConfig
 */
;(function (global) {
  'use strict'

  var Config = global.MarkdownConfig

  var MarkdownEngine = {
    // ============================================
    // 将 Markdown 转换为 HTML
    // ============================================
    render: function (markdown) {
      if (!markdown) return ''

      var html = markdown

      // 预处理：转义 HTML 特殊字符（代码块和行内代码除外）
      html = this._preprocess(html)

      // 按块级元素顺序处理
      html = this._renderCodeBlocks(html)
      html = this._renderBlockquotes(html)
      html = this._renderHorizontalRules(html)
      html = this._renderHeadings(html)
      html = this._renderTables(html)
      html = this._renderUnorderedLists(html)
      html = this._renderOrderedLists(html)
      html = this._renderTaskLists(html)
      html = this._renderParagraphs(html)

      // 行内元素处理
      html = this._renderInline(html)

      // 清理多余的空行
      html = html.replace(/\n{3,}/g, '\n\n')

      return html
    },

    // ============================================
    // 预处理：转义 HTML 特殊字符
    // ============================================
    _preprocess: function (text) {
      // 先保护代码块和行内代码
      var placeholders = []
      var index = 0

      // 保护代码块
      text = text.replace(/```[\s\S]*?```/g, function (match) {
        var placeholder = '%%%CODEBLOCK_' + index + '%%%'
        placeholders.push({ key: placeholder, value: match })
        index++
        return placeholder
      })

      // 保护行内代码
      text = text.replace(/`[^`]+`/g, function (match) {
        var placeholder = '%%%INLINECODE_' + index + '%%%'
        placeholders.push({ key: placeholder, value: match })
        index++
        return placeholder
      })

      // 转义 HTML
      text = text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')

      // 恢复保护的内容
      placeholders.forEach(function (item) {
        text = text.replace(item.key, item.value)
      })

      return text
    },

    // ============================================
    // 渲染代码块
    // ============================================
    _renderCodeBlocks: function (text) {
      return text.replace(/```(\w*)\n([\s\S]*?)```/g, function (match, lang, code) {
        var langClass = lang ? ' class="language-' + lang + '"' : ''
        var escaped = code
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
        return '<pre><code' + langClass + '>' + escaped + '</code></pre>'
      })
    },

    // ============================================
    // 渲染引用
    // ============================================
    _renderBlockquotes: function (text) {
      // 支持多行引用
      var lines = text.split('\n')
      var inBlockquote = false
      var result = []
      var quoteLines = []

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var match = line.match(/^>\s?(.*)/)

        if (match) {
          quoteLines.push(match[1])
          inBlockquote = true
        } else {
          if (inBlockquote) {
            result.push('<blockquote>' + quoteLines.join('<br>') + '</blockquote>')
            quoteLines = []
            inBlockquote = false
          }
          result.push(line)
        }
      }

      if (inBlockquote) {
        result.push('<blockquote>' + quoteLines.join('<br>') + '</blockquote>')
      }

      return result.join('\n')
    },

    // ============================================
    // 渲染水平线
    // ============================================
    _renderHorizontalRules: function (text) {
      return text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>')
    },

    // ============================================
    // 渲染标题
    // ============================================
    _renderHeadings: function (text) {
      return text.replace(/^(#{1,6})\s+(.+)$/gm, function (match, hashes, content) {
        var level = hashes.length
        var id = content
          .toLowerCase()
          .replace(/<[^>]+>/g, '')
          .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        return '<h' + level + ' id="' + id + '">' + content + '</h' + level + '>'
      })
    },

    // ============================================
    // 渲染表格
    // ============================================
    _renderTables: function (text) {
      var self = this
      return text.replace(/(\|[^\n]+\|\n\|[-| :]+\|\n(?:\|[^\n]+\|\n?)*)/g, function (match) {
        var lines = match.trim().split('\n')
        if (lines.length < 2) return match

        var headerCells = self._parseTableRow(lines[0])
        var alignments = self._parseTableAlignment(lines[1])
        var bodyRows = []

        for (var i = 2; i < lines.length; i++) {
          bodyRows.push(self._parseTableRow(lines[i]))
        }

        var html = '<table>\n<thead>\n<tr>'
        headerCells.forEach(function (cell, i) {
          var align = alignments[i] || ''
          html += '<th' + align + '>' + cell + '</th>'
        })
        html += '</tr>\n</thead>\n<tbody>\n'

        bodyRows.forEach(function (row) {
          html += '<tr>'
          row.forEach(function (cell, i) {
            var align = alignments[i] || ''
            html += '<td' + align + '>' + cell + '</td>'
          })
          html += '</tr>\n'
        })

        html += '</tbody>\n</table>'
        return html
      })
    },

    // ============================================
    // 解析表格行
    // ============================================
    _parseTableRow: function (line) {
      var cells = line.split('|')
      // 去掉首尾空
      cells = cells.slice(1, -1)
      return cells.map(function (cell) {
        return cell.trim()
      })
    },

    // ============================================
    // 解析表格对齐方式
    // ============================================
    _parseTableAlignment: function (line) {
      var cells = this._parseTableRow(line)
      return cells.map(function (cell) {
        if (/^:?-+:?$/.test(cell)) {
          if (cell.startsWith(':') && cell.endsWith(':')) return ' style="text-align:center"'
          if (cell.endsWith(':')) return ' style="text-align:right"'
          return ''
        }
        return ''
      })
    },

    // ============================================
    // 渲染无序列表
    // ============================================
    _renderUnorderedLists: function (text) {
      var self = this
      var lines = text.split('\n')
      var result = []
      var inList = false
      var listItems = []

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var match = line.match(/^(\s*)[-*+]\s+(.+)/)

        if (match) {
          var indent = match[1].length
          var content = match[2]

          if (!inList) {
            inList = true
            listItems = [{ indent: indent, content: content }]
          } else {
            listItems.push({ indent: indent, content: content })
          }
        } else {
          if (inList) {
            result.push(self._buildUnorderedList(listItems))
            inList = false
          }
          result.push(line)
        }
      }

      if (inList) {
        result.push(this._buildUnorderedList(listItems))
      }

      return result.join('\n')
    },

    // ============================================
    // 构建无序列表 HTML
    // ============================================
    _buildUnorderedList: function (items) {
      var html = '<ul>\n'
      items.forEach(function (item) {
        html += '<li>' + item.content + '</li>\n'
      })
      html += '</ul>'
      return html
    },

    // ============================================
    // 渲染有序列表
    // ============================================
    _renderOrderedLists: function (text) {
      var self = this
      var lines = text.split('\n')
      var result = []
      var inList = false
      var listItems = []

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var match = line.match(/^(\s*)\d+\.\s+(.+)/)

        if (match) {
          var indent = match[1].length
          var content = match[2]

          if (!inList) {
            inList = true
            listItems = [{ indent: indent, content: content }]
          } else {
            listItems.push({ indent: indent, content: content })
          }
        } else {
          if (inList) {
            result.push(self._buildOrderedList(listItems))
            inList = false
          }
          result.push(line)
        }
      }

      if (inList) {
        result.push(this._buildOrderedList(listItems))
      }

      return result.join('\n')
    },

    // ============================================
    // 构建有序列表 HTML
    // ============================================
    _buildOrderedList: function (items) {
      var html = '<ol>\n'
      items.forEach(function (item) {
        html += '<li>' + item.content + '</li>\n'
      })
      html += '</ol>'
      return html
    },

    // ============================================
    // 渲染任务列表
    // ============================================
    _renderTaskLists: function (text) {
      return text.replace(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/gm, function (match, indent, checked, content) {
        var checkedAttr = checked !== ' ' ? ' checked' : ''
        return '<li class="task-item"><input type="checkbox"' + checkedAttr + ' disabled>' + content + '</li>'
      })
    },

    // ============================================
    // 渲染段落
    // ============================================
    _renderParagraphs: function (text) {
      var lines = text.split('\n')
      var result = []
      var inParagraph = false
      var paragraphLines = []

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]

        // 跳过空行、块级元素
        if (line.trim() === '' ||
            line.startsWith('<h') ||
            line.startsWith('<pre') ||
            line.startsWith('<blockquote') ||
            line.startsWith('<hr') ||
            line.startsWith('<ul') ||
            line.startsWith('<ol') ||
            line.startsWith('<li') ||
            line.startsWith('<table') ||
            line.startsWith('</')) {
          if (inParagraph) {
            result.push('<p>' + paragraphLines.join('<br>') + '</p>')
            paragraphLines = []
            inParagraph = false
          }
          result.push(line)
          continue
        }

        // 列表项
        if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
          if (inParagraph) {
            result.push('<p>' + paragraphLines.join('<br>') + '</p>')
            paragraphLines = []
            inParagraph = false
          }
          result.push(line)
          continue
        }

        inParagraph = true
        paragraphLines.push(line)
      }

      if (inParagraph) {
        result.push('<p>' + paragraphLines.join('<br>') + '</p>')
      }

      return result.join('\n')
    },

    // ============================================
    // 渲染行内元素
    // ============================================
    _renderInline: function (text) {
      // 行内代码（已保护，跳过）
      // 图片
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')

      // 链接
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

      // 加粗
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')

      // 斜体
      text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
      text = text.replace(/_(.+?)_/g, '<em>$1</em>')

      // 删除线
      text = text.replace(/~~(.+?)~~/g, '<del>$1</del>')

      // 行内代码
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

      return text
    },

    // ============================================
    // 提取标题（用于导出 HTML 的 title）
    // ============================================
    extractTitle: function (markdown) {
      var match = markdown.match(/^#\s+(.+)$/m)
      return match ? match[1] : 'Markdown 文档'
    },

    // ============================================
    // 导出为 HTML
    // ============================================
    exportHTML: function (markdown) {
      var title = this.extractTitle(markdown)
      var content = this.render(markdown)
      var template = Config.EXPORT_OPTIONS.htmlTemplate
      return template
        .replace('{{title}}', title)
        .replace('{{content}}', content)
    },

    // ============================================
    // 获取字数统计
    // ============================================
    getStats: function (markdown) {
      if (!markdown) {
        return { chars: 0, charsNoSpace: 0, words: 0, lines: 0, paragraphs: 0 }
      }

      var chars = markdown.length
      var charsNoSpace = markdown.replace(/\s/g, '').length
      var words = markdown.match(/[\w\u4e00-\u9fff]+/g)
      var lines = markdown.split('\n').length
      var paragraphs = markdown.split(/\n\s*\n/).filter(function (p) {
        return p.trim().length > 0
      }).length

      return {
        chars: chars,
        charsNoSpace: charsNoSpace,
        words: words ? words.length : 0,
        lines: lines,
        paragraphs: paragraphs
      }
    }
  }

  // 暴露到全局
  global.MarkdownEngine = MarkdownEngine

})(typeof window !== 'undefined' ? window : this)