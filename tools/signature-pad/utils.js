/**
 * SignaturePad - 工具函数模块
 * 坐标计算、对象合并、数值限定、base64转换、DOM辅助
 */
;(function (global) {
  'use strict'

  var SignatureUtils = {

    /** 获取鼠标在 canvas 上的位置 */
    getMousePos: function (canvas, event) {
      var rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    },

    /** 获取触摸位置 */
    getTouchPos: function (canvas, touch) {
      var rect = canvas.getBoundingClientRect()
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    },

    /** 获取指针位置（手写笔） */
    getPointerPos: function (canvas, event) {
      var rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    },

    /** 合并对象（深度合并多个源对象到目标） */
    extend: function (target) {
      var sources = Array.prototype.slice.call(arguments, 1)
      for (var i = 0; i < sources.length; i++) {
        var source = sources[i]
        if (source) {
          for (var key in source) {
            if (source.hasOwnProperty(key)) {
              target[key] = source[key]
            }
          }
        }
      }
      return target
    },

    /** 数值限定 */
    clamp: function (value, min, max) {
      return Math.max(min, Math.min(max, value))
    },

    /** base64 DataURL 转 File 对象 */
    dataURLToFile: function (dataURL, filename) {
      var arr = dataURL.split(',')
      var mime = arr[0].match(/:(.*?);/)[1]
      var bstr = atob(arr[1])
      var n = bstr.length
      var u8arr = new Uint8Array(n)
      while (n--) { u8arr[n] = bstr.charCodeAt(n) }
      return new File([u8arr], filename, { type: mime })
    },

    /** 创建按钮元素 */
    createButton: function (text, className, handler) {
      var btn = document.createElement('button')
      btn.className = 'signature-btn ' + className
      btn.textContent = text
      btn.type = 'button'
      btn.addEventListener('click', handler)
      return btn
    }
  }

  // 暴露到全局
  global.SignatureUtils = SignatureUtils

})(typeof window !== 'undefined' ? window : this)