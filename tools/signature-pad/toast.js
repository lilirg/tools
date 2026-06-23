/**
 * SignaturePad - Toast 提示模块
 * 轻量级消息提示，自动注入样式
 */
;(function (global) {
  'use strict'

  // 注入 Toast 样式（只执行一次）
  ;(function injectStyles() {
    var styleId = 'signature-pad-toast-styles'
    if (document.getElementById(styleId)) return

    var style = document.createElement('style')
    style.id = styleId
    style.textContent = [
      '.signature-toast {',
      '  position: fixed; top: 20px; left: 50%;',
      '  transform: translateX(-50%) translateY(-20px);',
      '  padding: 10px 24px; border-radius: 8px; font-size: 14px;',
      '  color: #fff; z-index: 100000; opacity: 0;',
      '  transition: all 0.3s ease; pointer-events: none;',
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
      '}',
      '.signature-toast-show { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '.signature-toast-hide { opacity: 0; transform: translateX(-50%) translateY(-20px); }',
      '.signature-toast-success { background: #52c41a; }',
      '.signature-toast-error { background: #ff4d4f; }',
      '.signature-toast-warning { background: #faad14; color: #333; }',
      '.signature-toast-info { background: #1677ff; }',
    ].join('\n')
    document.head.appendChild(style)
  })()

  var SignatureToast = {
    /**
     * 显示 Toast 提示
     * @param {string} message - 提示内容
     * @param {string} type - 类型: success / error / warning / info
     */
    show: function (message, type) {
      type = type || 'info'

      var toast = document.createElement('div')
      toast.className = 'signature-toast signature-toast-' + type
      toast.textContent = message
      document.body.appendChild(toast)

      // 淡入
      setTimeout(function () { toast.classList.add('signature-toast-show') }, 10)

      // 淡出并移除
      setTimeout(function () {
        toast.classList.remove('signature-toast-show')
        toast.classList.add('signature-toast-hide')
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast)
        }, 300)
      }, 2500)
    },

    success: function (msg) { this.show(msg, 'success') },
    error: function (msg) { this.show(msg, 'error') },
    warning: function (msg) { this.show(msg, 'warning') },
    info: function (msg) { this.show(msg, 'info') }
  }

  // 暴露到全局
  global.SignatureToast = SignatureToast

})(typeof window !== 'undefined' ? window : this)