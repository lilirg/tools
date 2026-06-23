/**
 * Image Tool - 图片处理引擎
 * 负责图片压缩、格式转换、尺寸调整等核心逻辑
 *
 * 依赖: ImageConfig
 */
;(function (global) {
  'use strict'

  var Config = global.ImageConfig

  var ImageEngine = {
    // ============================================
    // 加载图片文件
    // ============================================
    loadImage: function (file) {
      return new Promise(function (resolve, reject) {
        // 验证文件类型
        if (!ImageEngine.isSupportedType(file)) {
          reject(new Error('不支持的文件类型: ' + file.type))
          return
        }

        // 验证文件大小
        if (file.size > Config.DEFAULTS.maxFileSize) {
          reject(new Error('文件大小超过限制 (最大 20MB)'))
          return
        }

        var reader = new FileReader()
        reader.onload = function (e) {
          var img = new Image()
          img.onload = function () {
            resolve({
              file: file,
              image: img,
              dataUrl: e.target.result,
              width: img.naturalWidth,
              height: img.naturalHeight,
              size: file.size,
              type: file.type,
              name: file.name
            })
          }
          img.onerror = function () {
            reject(new Error('图片加载失败'))
          }
          img.src = e.target.result
        }
        reader.onerror = function () {
          reject(new Error('文件读取失败'))
        }
        reader.readAsDataURL(file)
      })
    },

    // ============================================
    // 检查是否支持的文件类型
    // ============================================
    isSupportedType: function (file) {
      var type = file.type.toLowerCase()
      var ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      return Config.SUPPORTED_TYPES.indexOf(type) !== -1 ||
             Config.SUPPORTED_EXTENSIONS.indexOf(ext) !== -1
    },

    // ============================================
    // 获取文件扩展名
    // ============================================
    getExtension: function (mimeType) {
      var map = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/gif': 'gif'
      }
      return map[mimeType] || 'png'
    },

    // ============================================
    // 获取 MIME 类型
    // ============================================
    getMimeType: function (ext) {
      var map = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'gif': 'image/gif'
      }
      return map[ext.toLowerCase()] || 'image/png'
    },

    // ============================================
    // 压缩/转换图片
    // ============================================
    processImage: function (imageData, options) {
      return new Promise(function (resolve, reject) {
        try {
          options = options || {}
          var quality = options.quality !== undefined ? options.quality : Config.DEFAULTS.quality
          var format = options.format || Config.DEFAULTS.format
          var maxWidth = options.maxWidth || Config.DEFAULTS.maxWidth
          var maxHeight = options.maxHeight || Config.DEFAULTS.maxHeight

          var img = imageData.image
          var canvas = document.createElement('canvas')
          var ctx = canvas.getContext('2d')

          // 计算新尺寸（保持宽高比）
          var result = ImageEngine.calculateSize(
            img.naturalWidth,
            img.naturalHeight,
            maxWidth,
            maxHeight
          )

          canvas.width = result.width
          canvas.height = result.height

          // 绘制图片
          ctx.drawImage(img, 0, 0, result.width, result.height)

          // 确定输出格式
          var outputFormat = format === 'original' ? imageData.type : format

          // 对于 PNG 和 BMP，quality 参数无效
          var qualityParam = (outputFormat === 'image/png' || outputFormat === 'image/bmp')
            ? undefined
            : quality / 100

          // 导出
          var outputDataUrl = canvas.toDataURL(outputFormat, qualityParam)

          // 计算输出文件大小（估算）
          var outputSize = ImageEngine.estimateSize(outputDataUrl)

          resolve({
            dataUrl: outputDataUrl,
            format: outputFormat,
            width: result.width,
            height: result.height,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            originalSize: imageData.size,
            outputSize: outputSize,
            compressionRatio: imageData.size > 0
              ? ((1 - outputSize / imageData.size) * 100).toFixed(1)
              : 0,
            quality: quality
          })
        } catch (e) {
          reject(new Error('图片处理失败: ' + e.message))
        }
      })
    },

    // ============================================
    // 计算调整后的尺寸（保持宽高比）
    // ============================================
    calculateSize: function (width, height, maxWidth, maxHeight) {
      if (maxWidth <= 0 && maxHeight <= 0) {
        return { width: width, height: height }
      }

      var newWidth = width
      var newHeight = height

      if (maxWidth > 0 && newWidth > maxWidth) {
        newHeight = Math.round(newHeight * (maxWidth / newWidth))
        newWidth = maxWidth
      }

      if (maxHeight > 0 && newHeight > maxHeight) {
        newWidth = Math.round(newWidth * (maxHeight / newHeight))
        newHeight = maxHeight
      }

      return { width: newWidth, height: newHeight }
    },

    // ============================================
    // 估算 DataURL 的文件大小
    // ============================================
    estimateSize: function (dataUrl) {
      // Base64 编码数据大小 ≈ 字符串长度 * 0.75
      var base64Data = dataUrl.split(',')[1] || ''
      return Math.round(base64Data.length * 0.75)
    },

    // ============================================
    // 格式化文件大小
    // ============================================
    formatSize: function (bytes) {
      if (bytes === 0) return '0 B'
      var units = Config.SIZE_UNITS
      var i = Math.floor(Math.log(bytes) / Math.log(1024))
      if (i >= units.length) i = units.length - 1
      return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
    },

    // ============================================
    // 下载图片
    // ============================================
    downloadImage: function (dataUrl, filename) {
      var link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    // ============================================
    // 批量下载（逐个下载）
    // ============================================
    downloadAll: function (items) {
      items.forEach(function (item, index) {
        setTimeout(function () {
          ImageEngine.downloadImage(item.dataUrl, item.filename)
        }, index * 500)
      })
    },

    // ============================================
    // 生成输出文件名
    // ============================================
    generateFilename: function (originalName, outputFormat, suffix) {
      var baseName = originalName.replace(/\.[^.]+$/, '')
      var ext = ImageEngine.getExtension(outputFormat)
      suffix = suffix || '_compressed'
      return baseName + suffix + '.' + ext
    },

    // ============================================
    // 从 DataURL 创建 Blob
    // ============================================
    dataUrlToBlob: function (dataUrl) {
      var parts = dataUrl.split(',')
      var mime = parts[0].match(/:(.*?);/)[1]
      var byteString = atob(parts[1])
      var ab = new ArrayBuffer(byteString.length)
      var ia = new Uint8Array(ab)
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: mime })
    },

    // ============================================
    // 创建 ZIP 下载（简易实现，无外部依赖）
    // ============================================
    createZipAndDownload: function (items) {
      // 简易 ZIP 实现 - 逐个下载作为替代方案
      ImageEngine.downloadAll(items)
    }
  }

  // 暴露到全局
  global.ImageEngine = ImageEngine

})(typeof window !== 'undefined' ? window : this)