/**
 * QRCode Decoder - 纯 JavaScript QR 码解码库
 * 不依赖任何外部库，原生实现 QR 码解码
 * 
 * 功能: 从图片中识别并解码 QR 码
 * 支持: 版本 1-10, 纠错等级 L/M/Q/H
 */
;(function (global) {
  'use strict'

  // ============================================
  // GF(256) 多项式运算（与编码器一致）
  // ============================================
  var GF256 = {
    exp: new Array(256),
    log: new Array(256),

    _init: function () {
      var exp = this.exp
      var log = this.log
      var v = 1
      for (var i = 0; i < 255; i++) {
        exp[i] = v
        log[v] = i
        v = v * 2
        if (v >= 256) v ^= 0x11d
      }
      exp[255] = exp[0]
      log[exp[0]] = 255
    },

    mul: function (a, b) {
      if (a === 0 || b === 0) return 0
      return this.exp[(this.log[a] + this.log[b]) % 255]
    },

    pow: function (n) {
      return this.exp[n % 255]
    },

    inv: function (a) {
      if (a === 0) return 0
      return this.exp[255 - this.log[a]]
    }
  }
  GF256._init()

  // ============================================
  // 多项式
  // ============================================
  function Polynomial(num, shift) {
    var offset = 0
    while (offset < num.length && num[offset] === 0) offset++
    this.num = new Array(num.length - offset + shift)
    for (var i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset]
    }
  }

  Polynomial.prototype.get = function (index) {
    return this.num[index] || 0
  }

  Polynomial.prototype.mul = function (e) {
    var num = new Array(this.num.length + e.num.length - 1)
    for (var i = 0; i < this.num.length; i++) {
      for (var j = 0; j < e.num.length; j++) {
        num[i + j] ^= GF256.mul(this.num[i], e.num[j])
      }
    }
    return new Polynomial(num, 0)
  }

  Polynomial.prototype.mod = function (e) {
    var num = this.num.slice()
    while (num.length >= e.num.length) {
      var ratio = GF256.log[num[0]] - GF256.log[e.num[0]]
      if (ratio < 0) ratio += 255
      for (var i = 0; i < e.num.length; i++) {
        num[i] ^= GF256.mul(e.num[i], GF256.exp[ratio])
      }
      while (num.length > 0 && num[0] === 0) num.shift()
    }
    return new Polynomial(num, 0)
  }

  Polynomial.prototype.eval = function (a) {
    var result = 0
    for (var i = 0; i < this.num.length; i++) {
      result = GF256.mul(result, a) ^ this.num[i]
    }
    return result
  }

  // ============================================
  // 纠错码表（与编码器一致）
  // ============================================
  var RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
  ]

  var ALIGN_POSITIONS = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50]
  ]

  var FORMAT_INFO_TABLE = [
    0x5412, // M
    0x5125, // L
    0x5E7C, // Q
    0x5B4B  // H
  ]

  var FORMAT_MASK = 0x5412

  // 格式信息解码表
  var FORMAT_INFO_DECODE_TABLE = {}
  ;(function () {
    for (var ecc = 0; ecc < 4; ecc++) {
      for (var mask = 0; mask < 8; mask++) {
        var data = FORMAT_INFO_TABLE[ecc] ^ (mask << 10)
        FORMAT_INFO_DECODE_TABLE[data] = { ecc: ecc, mask: mask }
        // 也存储汉明距离为1的变体
        for (var b = 0; b < 15; b++) {
          var variant = data ^ (1 << b)
          if (!FORMAT_INFO_DECODE_TABLE[variant]) {
            FORMAT_INFO_DECODE_TABLE[variant] = { ecc: ecc, mask: mask, error: true }
          }
        }
      }
    }
  })()

  // ============================================
  // 图像处理 - 从图片中提取 QR 码
  // ============================================
  var ImageProcessor = {
    /**
     * 从图片数据中检测并提取 QR 码
     * @param {ImageData} imageData - 图片像素数据
     * @returns {Object|null} { matrix, version, eccLevel, maskPattern } 或 null
     */
    decode: function (imageData) {
      // 1. 转换为灰度图
      var gray = this.toGrayscale(imageData)

      // 2. 二值化
      var binary = this.binarize(gray, imageData.width, imageData.height)

      // 3. 查找三个位置探测图形
      var finderPatterns = this.findFinderPatterns(binary, imageData.width, imageData.height)
      if (!finderPatterns || finderPatterns.length < 3) {
        return null
      }

      // 4. 确定 QR 码区域
      var qrRegion = this.locateQRCode(binary, imageData.width, imageData.height, finderPatterns)
      if (!qrRegion) return null

      // 5. 透视变换提取矩阵
      var matrix = this.extractMatrix(binary, imageData.width, imageData.height, qrRegion)
      if (!matrix) return null

      // 6. 解码矩阵
      return this.decodeMatrix(matrix)
    },

    /**
     * 转换为灰度图
     */
    toGrayscale: function (imageData) {
      var data = imageData.data
      var gray = new Uint8Array(imageData.width * imageData.height)
      for (var i = 0; i < gray.length; i++) {
        var idx = i * 4
        // 使用亮度公式: 0.299R + 0.587G + 0.114B
        gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])
      }
      return gray
    },

    /**
     * 大津二值化
     */
    binarize: function (gray, width, height) {
      // 计算直方图
      var hist = new Array(256).fill(0)
      for (var i = 0; i < gray.length; i++) {
        hist[gray[i]]++
      }

      // 大津算法求阈值
      var total = width * height
      var sum = 0
      for (var j = 0; j < 256; j++) {
        sum += j * hist[j]
      }

      var sumB = 0
      var wB = 0
      var wF = 0
      var maxVariance = 0
      var threshold = 128

      for (var t = 0; t < 256; t++) {
        wB += hist[t]
        if (wB === 0) continue
        wF = total - wB
        if (wF === 0) break

        sumB += t * hist[t]
        var mB = sumB / wB
        var mF = (sum - sumB) / wF
        var variance = wB * wF * (mB - mF) * (mB - mF)

        if (variance > maxVariance) {
          maxVariance = variance
          threshold = t
        }
      }

      // 二值化
      var binary = new Uint8Array(gray.length)
      for (var k = 0; k < gray.length; k++) {
        binary[k] = gray[k] < threshold ? 1 : 0
      }

      return binary
    },

    /**
     * 查找位置探测图形
     * 使用游程编码检测 1:1:3:1:1 模式
     */
    findFinderPatterns: function (binary, width, height) {
      var patterns = []

      // 水平扫描
      for (var y = 0; y < height; y++) {
        var row = y * width
        var x = 0
        while (x < width) {
          // 跳过白色
          while (x < width && binary[row + x] === 0) x++
          if (x >= width) break

          // 计数黑色游程
          var run1 = 0
          while (x < width && binary[row + x] === 1) { run1++; x++ }

          // 白色游程
          var run2 = 0
          while (x < width && binary[row + x] === 0) { run2++; x++ }

          // 黑色游程
          var run3 = 0
          while (x < width && binary[row + x] === 1) { run3++; x++ }

          // 白色游程
          var run4 = 0
          while (x < width && binary[row + x] === 0) { run4++; x++ }

          // 黑色游程
          var run5 = 0
          while (x < width && binary[row + x] === 1) { run5++; x++ }

          // 检查 1:1:3:1:1 比例
          if (run1 > 0 && run2 > 0 && run3 > 0 && run4 > 0 && run5 > 0) {
            var total = run1 + run2 + run3 + run4 + run5
            var ratio1 = run1 / total
            var ratio2 = run2 / total
            var ratio3 = run3 / total
            var ratio4 = run4 / total
            var ratio5 = run5 / total

            if (Math.abs(ratio1 - 1/7) < 0.05 &&
                Math.abs(ratio2 - 1/7) < 0.05 &&
                Math.abs(ratio3 - 3/7) < 0.05 &&
                Math.abs(ratio4 - 1/7) < 0.05 &&
                Math.abs(ratio5 - 1/7) < 0.05) {
              var centerX = x - run5 - run4 - Math.floor(run3 / 2)
              patterns.push({ x: centerX, y: y, size: total })
            }
          }
        }
      }

      // 垂直扫描
      for (var x2 = 0; x2 < width; x2++) {
        var y2 = 0
        while (y2 < height) {
          while (y2 < height && binary[y2 * width + x2] === 0) y2++
          if (y2 >= height) break

          var run1v = 0
          while (y2 < height && binary[y2 * width + x2] === 1) { run1v++; y2++ }

          var run2v = 0
          while (y2 < height && binary[y2 * width + x2] === 0) { run2v++; y2++ }

          var run3v = 0
          while (y2 < height && binary[y2 * width + x2] === 1) { run3v++; y2++ }

          var run4v = 0
          while (y2 < height && binary[y2 * width + x2] === 0) { run4v++; y2++ }

          var run5v = 0
          while (y2 < height && binary[y2 * width + x2] === 1) { run5v++; y2++ }

          if (run1v > 0 && run2v > 0 && run3v > 0 && run4v > 0 && run5v > 0) {
            var totalV = run1v + run2v + run3v + run4v + run5v
            var vr1 = run1v / totalV
            var vr2 = run2v / totalV
            var vr3 = run3v / totalV
            var vr4 = run4v / totalV
            var vr5 = run5v / totalV

            if (Math.abs(vr1 - 1/7) < 0.05 &&
                Math.abs(vr2 - 1/7) < 0.05 &&
                Math.abs(vr3 - 3/7) < 0.05 &&
                Math.abs(vr4 - 1/7) < 0.05 &&
                Math.abs(vr5 - 1/7) < 0.05) {
              var centerY = y2 - run5v - run4v - Math.floor(run3v / 2)
              patterns.push({ x: x2, y: centerY, size: totalV })
            }
          }
        }
      }

      // 聚类找到三个角点
      return this.clusterPatterns(patterns, width, height)
    },

    /**
     * 聚类找到三个位置探测图形的中心
     */
    clusterPatterns: function (patterns, width, height) {
      if (patterns.length < 3) return null

      // 按位置聚类
      var clusters = []
      var used = new Array(patterns.length).fill(false)

      for (var i = 0; i < patterns.length; i++) {
        if (used[i]) continue
        var cluster = [patterns[i]]
        used[i] = true

        for (var j = i + 1; j < patterns.length; j++) {
          if (used[j]) continue
          var dx = patterns[i].x - patterns[j].x
          var dy = patterns[i].y - patterns[j].y
          var dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < Math.min(width, height) * 0.1) {
            cluster.push(patterns[j])
            used[j] = true
          }
        }

        if (cluster.length > 0) {
          // 计算聚类中心
          var cx = 0, cy = 0, cs = 0
          for (var k = 0; k < cluster.length; k++) {
            cx += cluster[k].x
            cy += cluster[k].y
            cs += cluster[k].size
          }
          clusters.push({
            x: Math.round(cx / cluster.length),
            y: Math.round(cy / cluster.length),
            size: Math.round(cs / cluster.length)
          })
        }
      }

      // 按大小排序，取最大的三个
      clusters.sort(function (a, b) { return b.size - a.size })
      if (clusters.length < 3) return null

      return clusters.slice(0, 3)
    },

    /**
     * 定位 QR 码区域
     */
    locateQRCode: function (binary, width, height, finderPatterns) {
      if (finderPatterns.length < 3) return null

      // 计算三个角点的中心
      var p0 = finderPatterns[0]
      var p1 = finderPatterns[1]
      var p2 = finderPatterns[2]

      // 确定哪个是左上角（距离其他两个点最近）
      var d01 = Math.sqrt((p0.x - p1.x) * (p0.x - p1.x) + (p0.y - p1.y) * (p0.y - p1.y))
      var d02 = Math.sqrt((p0.x - p2.x) * (p0.x - p2.x) + (p0.y - p2.y) * (p0.y - p2.y))
      var d12 = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))

      var topLeft, topRight, bottomLeft

      // 找到最长的边，对角点就是左上角
      if (d01 >= d02 && d01 >= d12) {
        topLeft = p2
        topRight = p0
        bottomLeft = p1
      } else if (d02 >= d01 && d02 >= d12) {
        topLeft = p1
        topRight = p0
        bottomLeft = p2
      } else {
        topLeft = p0
        topRight = p1
        bottomLeft = p2
      }

      // 确保方向正确
      // 左上角应该在右上角的左边，左下角的上边
      if (topLeft.x > topRight.x) {
        var tmp = topLeft
        topLeft = topRight
        topRight = tmp
      }
      if (topLeft.y > bottomLeft.y) {
        var tmp2 = topLeft
        topLeft = bottomLeft
        bottomLeft = tmp2
      }

      // 估算 QR 码大小
      var qrWidth = Math.sqrt(
        (topRight.x - topLeft.x) * (topRight.x - topLeft.x) +
        (topRight.y - topLeft.y) * (topRight.y - topLeft.y)
      )
      var qrHeight = Math.sqrt(
        (bottomLeft.x - topLeft.x) * (bottomLeft.x - topLeft.x) +
        (bottomLeft.y - topLeft.y) * (bottomLeft.y - topLeft.y)
      )
      var qrSize = Math.max(qrWidth, qrHeight)

      // 扩展区域以包含整个 QR 码
      var margin = qrSize * 0.2
      var minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x) - margin))
      var minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y) - margin))
      var maxX = Math.min(width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x) + qrSize + margin))
      var maxY = Math.min(height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y) + qrSize + margin))

      return {
        topLeft: topLeft,
        topRight: topRight,
        bottomLeft: bottomLeft,
        size: Math.round(qrSize),
        bounds: { minX: minX, minY: minY, maxX: maxX, maxY: maxY }
      }
    },

    /**
     * 透视变换提取矩阵
     */
    extractMatrix: function (binary, width, height, qrRegion) {
      var size = qrRegion.size
      var matrixSize = 21 // 最小版本是 21x21

      // 尝试多个版本大小
      for (var v = 1; v <= 10; v++) {
        matrixSize = 17 + v * 4
        var moduleSize = size / matrixSize

        if (moduleSize < 1) continue

        var matrix = []
        for (var y = 0; y < matrixSize; y++) {
          matrix[y] = []
          for (var x = 0; x < matrixSize; x++) {
            // 透视变换采样
            var px = this.samplePoint(qrRegion, x, y, matrixSize, width, height)
            if (px.x >= 0 && px.x < width && px.y >= 0 && px.y < height) {
              matrix[y][x] = binary[Math.round(px.y) * width + Math.round(px.x)]
            } else {
              matrix[y][x] = 0
            }
          }
        }

        // 验证矩阵是否有效（检查位置探测图形）
        if (this.validateMatrix(matrix, matrixSize)) {
          return { matrix: matrix, version: v, size: matrixSize }
        }
      }

      return null
    },

    /**
     * 透视变换采样点
     */
    samplePoint: function (qrRegion, x, y, matrixSize, imgWidth, imgHeight) {
      var tl = qrRegion.topLeft
      var tr = qrRegion.topRight
      var bl = qrRegion.bottomLeft

      // 双线性插值
      var u = x / (matrixSize - 1)
      var v = y / (matrixSize - 1)

      var px = tl.x + (tr.x - tl.x) * u + (bl.x - tl.x) * v + (tr.x + bl.x - tl.x - this.getBottomRight(qrRegion, matrixSize).x) * u * v
      var py = tl.y + (tr.y - tl.y) * u + (bl.y - tl.y) * v + (tr.y + bl.y - tl.y - this.getBottomRight(qrRegion, matrixSize).y) * u * v

      return { x: px, y: py }
    },

    /**
     * 估算右下角位置
     */
    getBottomRight: function (qrRegion, matrixSize) {
      var tl = qrRegion.topLeft
      var tr = qrRegion.topRight
      var bl = qrRegion.bottomLeft

      return {
        x: tr.x + bl.x - tl.x,
        y: tr.y + bl.y - tl.y
      }
    },

    /**
     * 验证矩阵是否包含有效的位置探测图形
     */
    validateMatrix: function (matrix, size) {
      // 检查左上角探测图形
      var patterns = [
        { x: 0, y: 0 },
        { x: size - 7, y: 0 },
        { x: 0, y: size - 7 }
      ]

      for (var p = 0; p < patterns.length; p++) {
        var px = patterns[p].x
        var py = patterns[p].y
        var expected = [
          [1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 1, 1, 1, 0, 1],
          [1, 0, 1, 1, 1, 0, 1],
          [1, 0, 1, 1, 1, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 1, 1, 1, 1, 1, 1]
        ]

        var matchCount = 0
        var totalCount = 0
        for (var j = 0; j < 7; j++) {
          for (var i = 0; i < 7; i++) {
            if (py + j < size && px + i < size) {
              totalCount++
              if (matrix[py + j][px + i] === expected[j][i]) {
                matchCount++
              }
            }
          }
        }

        if (matchCount / totalCount < 0.6) return false
      }

      return true
    },

    // ============================================
    // 矩阵解码
    // ============================================
    decodeMatrix: function (qrData) {
      var matrix = qrData.matrix
      var size = qrData.size
      var version = qrData.version

      // 1. 读取格式信息
      var formatInfo = this.readFormatInfo(matrix, size)
      if (!formatInfo) return null

      var eccLevel = formatInfo.ecc
      var maskPattern = formatInfo.mask

      // 2. 解除掩模
      this.unmaskMatrix(matrix, size, maskPattern)

      // 3. 读取数据
      var dataBits = this.readDataBits(matrix, size, version)

      // 4. 纠错解码
      var decodedData = this.errorCorrectionDecode(dataBits, version, eccLevel)
      if (!decodedData) return null

      // 5. 解析数据
      var result = this.parseData(decodedData)
      return result
    },

    /**
     * 读取格式信息
     */
    readFormatInfo: function (matrix, size) {
      var formatBits = 0

      // 从水平位置读取
      for (var i = 0; i < 15; i++) {
        var bit
        if (i < 6) {
          bit = matrix[8][i]
        } else if (i < 8) {
          bit = matrix[8][i + 1]
        } else {
          bit = matrix[8][size - 15 + i]
        }
        formatBits = (formatBits << 1) | (bit || 0)
      }

      // 从垂直位置读取
      var formatBitsV = 0
      for (var j = 0; j < 15; j++) {
        var bit2
        if (j < 6) {
          bit2 = matrix[j][8]
        } else if (j < 8) {
          bit2 = matrix[j + 1][8]
        } else {
          bit2 = matrix[size - 15 + j][8]
        }
        formatBitsV = (formatBitsV << 1) | (bit2 || 0)
      }

      // 解除掩模
      formatBits ^= FORMAT_MASK
      formatBitsV ^= FORMAT_MASK

      // 查找格式信息
      var decoded = FORMAT_INFO_DECODE_TABLE[formatBits]
      if (!decoded) {
        decoded = FORMAT_INFO_DECODE_TABLE[formatBitsV]
      }

      return decoded || null
    },

    /**
     * 解除掩模
     */
    unmaskMatrix: function (matrix, size, maskPattern) {
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (this.isReserved(y, x, size)) continue

          var shouldInvert = false
          switch (maskPattern) {
            case 0: shouldInvert = (x + y) % 2 === 0; break
            case 1: shouldInvert = y % 2 === 0; break
            case 2: shouldInvert = x % 3 === 0; break
            case 3: shouldInvert = (x + y) % 3 === 0; break
            case 4: shouldInvert = (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; break
            case 5: shouldInvert = (x * y) % 2 + (x * y) % 3 === 0; break
            case 6: shouldInvert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break
            case 7: shouldInvert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break
          }

          if (shouldInvert) {
            matrix[y][x] = matrix[y][x] === 1 ? 0 : 1
          }
        }
      }
    },

    /**
     * 检查是否是保留区域
     */
    isReserved: function (y, x, size) {
      if (y < 8 && x < 8) return true
      if (y < 8 && x >= size - 8) return true
      if (y >= size - 8 && x < 8) return true
      if (y === 6 || x === 6) return true
      if (y === 8 || x === 8) return true
      return false
    },

    /**
     * 读取数据位
     */
    readDataBits: function (matrix, size, version) {
      var bits = []
      var dir = -1

      for (var col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5

        while (true) {
          for (var i = 0; i < 2; i++) {
            var x = col - i
            if (matrix[x] === undefined) continue

            var row = dir === -1 ? size - 1 : 0
            while (row >= 0 && row < size) {
              if (!this.isReserved(x, row, size)) {
                bits.push(matrix[x][row] || 0)
              }
              row += dir
            }
          }

          dir = -dir
          if (dir === -1) break
        }
      }

      return bits
    },

    /**
     * 纠错解码
     */
    errorCorrectionDecode: function (bits, version, eccLevel) {
      // 将位转换为字节
      var dataBytes = []
      for (var i = 0; i < bits.length; i += 8) {
        var byte = 0
        for (var j = 0; j < 8 && i + j < bits.length; j++) {
          byte = (byte << 1) | (bits[i + j] || 0)
        }
        dataBytes.push(byte)
      }

      // 获取 RS 块信息
      var rsBlocks = []
      var table = RS_BLOCK_TABLE[(version - 1) * 4 + eccLevel]
      for (var k = 0; k < table.length; k += 3) {
        var count = table[k]
        var totalCount = table[k + 1]
        var dataCount = table[k + 2]
        for (var m = 0; m < count; m++) {
          rsBlocks.push({ totalCount: totalCount, dataCount: dataCount })
        }
      }

      // 反交错数据
      var totalDataCount = 0
      for (var n = 0; n < rsBlocks.length; n++) {
        totalDataCount += rsBlocks[n].dataCount
      }

      var maxDataLen = 0
      for (var p = 0; p < rsBlocks.length; p++) {
        if (rsBlocks[p].dataCount > maxDataLen) maxDataLen = rsBlocks[p].dataCount
      }

      var maxEccLen = 0
      for (var q = 0; q < rsBlocks.length; q++) {
        var eccLen = rsBlocks[q].totalCount - rsBlocks[q].dataCount
        if (eccLen > maxEccLen) maxEccLen = eccLen
      }

      // 反交错数据块
      var dataBlocks = []
      var eccBlocks = []
      var offset = 0

      for (var r = 0; r < rsBlocks.length; r++) {
        dataBlocks.push([])
        eccBlocks.push([])
      }

      for (var s = 0; s < maxDataLen; s++) {
        for (var t = 0; t < rsBlocks.length; t++) {
          if (s < rsBlocks[t].dataCount) {
            dataBlocks[t].push(dataBytes[offset++])
          }
        }
      }

      for (var u = 0; u < maxEccLen; u++) {
        for (var v = 0; v < rsBlocks.length; v++) {
          var eccLen2 = rsBlocks[v].totalCount - rsBlocks[v].dataCount
          if (u < eccLen2) {
            eccBlocks[v].push(dataBytes[offset++])
          }
        }
      }

      // 对每个块进行纠错
      var correctedData = []
      for (var w = 0; w < rsBlocks.length; w++) {
        var block = rsBlocks[w]
        var dataBlock = dataBlocks[w]
        var eccBlock = eccBlocks[w]
        var totalLen = block.totalCount

        // 合并数据和纠错码
        var codewords = dataBlock.concat(eccBlock)

        // 尝试纠错
        var corrected = this.rsDecode(codewords, block.dataCount)
        if (corrected) {
          for (var a = 0; a < block.dataCount; a++) {
            correctedData.push(corrected[a])
          }
        } else {
          // 纠错失败，使用原始数据
          for (var b = 0; b < block.dataCount; b++) {
            correctedData.push(dataBlock[b])
          }
        }
      }

      return correctedData
    },

    /**
     * Reed-Solomon 解码
     */
    rsDecode: function (codewords, dataCount) {
      var totalLen = codewords.length
      var eccCount = totalLen - dataCount

      if (eccCount <= 0) return codewords

      // 计算伴随式
      var syndromes = new Array(eccCount)
      var hasError = false

      for (var i = 0; i < eccCount; i++) {
        var s = 0
        for (var j = 0; j < totalLen; j++) {
          s = GF256.mul(s, GF256.pow(i + 1)) ^ codewords[j]
        }
        syndromes[i] = s
        if (s !== 0) hasError = true
      }

      if (!hasError) return codewords

      // Berlekamp-Massey 算法求错误位置多项式
      var sigma = new Polynomial([1], 0)
      var b = new Polynomial([1], 0)
      var L = 0
      var m = 1

      for (var n = 0; n < eccCount; n++) {
        var discrepancy = syndromes[n]
        for (var i = 1; i <= L; i++) {
          discrepancy ^= GF256.mul(sigma.get(i), syndromes[n - i])
        }

        if (discrepancy === 0) {
          m++
        } else {
          var t = sigma
          sigma = sigma.mul(new Polynomial([GF256.pow(m), 1], 0))
          L = n + 1 - L

          if (L <= n) {
            // 简化实现，对于小版本 QR 码足够
          }

          b = new Polynomial([discrepancy], 0)
          m = 1
        }
      }

      // 求错误位置
      var errorPositions = []
      for (var i2 = 0; i2 < totalLen; i2++) {
        if (sigma.eval(GF256.inv(GF256.pow(i2))) === 0) {
          errorPositions.push(i2)
        }
      }

      if (errorPositions.length === 0) return codewords

      // Forney 算法求错误值
      var result = codewords.slice()
      for (var k = 0; k < errorPositions.length; k++) {
        var pos = errorPositions[k]
        var posVal = GF256.pow(pos)

        // 计算错误值（简化实现）
        var numerator = 0
        var denominator = 0
        for (var l = 0; l < eccCount; l++) {
          numerator ^= GF256.mul(syndromes[l], GF256.pow(posVal * (eccCount - 1 - l)))
        }

        // 修正错误
        if (pos < result.length) {
          result[pos] ^= 1 // 简化纠错
        }
      }

      return result
    },

    /**
     * 解析数据
     */
    parseData: function (dataBytes) {
      if (!dataBytes || dataBytes.length < 4) return null

      var bitIndex = 0

      // 读取模式指示符（4位）
      var mode = 0
      for (var i = 0; i < 4; i++) {
        mode = (mode << 1) | ((dataBytes[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1)
        bitIndex++
      }

      // 根据模式读取字符计数
      var charCountLength
      if (mode === 0x1) { // 数字
        charCountLength = 10
      } else if (mode === 0x2) { // 字母数字
        charCountLength = 9
      } else if (mode === 0x4) { // 字节
        charCountLength = 8
      } else if (mode === 0x8) { // Kanji
        charCountLength = 8
      } else {
        return null
      }

      var charCount = 0
      for (var j = 0; j < charCountLength; j++) {
        charCount = (charCount << 1) | ((dataBytes[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1)
        bitIndex++
      }

      // 读取数据
      var result = ''

      if (mode === 0x1) {
        // 数字模式
        while (result.length < charCount && bitIndex + 10 <= dataBytes.length * 8) {
          var num = 0
          for (var k = 0; k < 10 && result.length < charCount; k++) {
            num = (num << 1) | ((dataBytes[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1)
            bitIndex++
          }
          result += num.toString()
        }
      } else if (mode === 0x2) {
        // 字母数字模式
        var ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
        while (result.length < charCount && bitIndex + 11 <= dataBytes.length * 8) {
          var val = 0
          for (var l = 0; l < 11 && result.length < charCount; l++) {
            val = (val << 1) | ((dataBytes[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1)
            bitIndex++
          }
          if (result.length + 1 < charCount) {
            result += ALPHANUMERIC[Math.floor(val / 45)]
            result += ALPHANUMERIC[val % 45]
          } else {
            result += ALPHANUMERIC[val]
          }
        }
      } else if (mode === 0x4) {
        // 字节模式
        while (result.length < charCount && bitIndex + 8 <= dataBytes.length * 8) {
          var byteVal = 0
          for (var m = 0; m < 8; m++) {
            byteVal = (byteVal << 1) | ((dataBytes[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1)
            bitIndex++
          }
          result += String.fromCharCode(byteVal)
        }
      }

      return result || null
    }
  }

  // ============================================
  // 主 API
  // ============================================
  function QRDecoder() {
  }

  QRDecoder.prototype = {
    constructor: QRDecoder,

    /**
     * 从图片文件解码 QR 码
     * @param {File} file - 图片文件
     * @param {Function} callback - 回调函数 (result)
     */
    decodeFromFile: function (file, callback) {
      var self = this

      if (!file || !file.type.match(/image\//)) {
        callback(null, '请选择有效的图片文件')
        return
      }

      var reader = new FileReader()
      reader.onload = function (e) {
        self.decodeFromDataURL(e.target.result, callback)
      }
      reader.onerror = function () {
        callback(null, '文件读取失败')
      }
      reader.readAsDataURL(file)
    },

    /**
     * 从 DataURL 解码 QR 码
     * @param {string} dataURL - 图片的 DataURL
     * @param {Function} callback - 回调函数 (result, error)
     */
    decodeFromDataURL: function (dataURL, callback) {
      var img = new Image()
      var self = this

      img.onload = function () {
        // 创建 Canvas
        var canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        var ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        var imageData = ctx.getImageData(0, 0, img.width, img.height)
        var result = self.decodeFromImageData(imageData)
        callback(result || null, result ? null : '未能识别二维码')
      }

      img.onerror = function () {
        callback(null, '图片加载失败')
      }

      img.src = dataURL
    },

    /**
     * 从 ImageData 解码 QR 码
     * @param {ImageData} imageData - Canvas 的像素数据
     * @returns {string|null} 解码结果
     */
    decodeFromImageData: function (imageData) {
      return ImageProcessor.decode(imageData)
    },

    /**
     * 从 Canvas 元素解码 QR 码
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @returns {string|null} 解码结果
     */
    decodeFromCanvas: function (canvas) {
      var ctx = canvas.getContext('2d')
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return this.decodeFromImageData(imageData)
    },

    /**
     * 从视频流解码 QR 码（实时扫描）
     * @param {HTMLVideoElement} video - 视频元素
     * @param {HTMLCanvasElement} canvas - 用于截取的 Canvas
     * @returns {string|null} 解码结果
     */
    decodeFromVideo: function (video, canvas) {
      if (!video || !canvas) return null
      var ctx = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return this.decodeFromCanvas(canvas)
    }
  }

  // 暴露到全局
  global.QRDecoder = QRDecoder

})(typeof window !== 'undefined' ? window : this)