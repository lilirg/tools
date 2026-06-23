/**
 * QRCode Generator - 纯 JavaScript QR 码生成库
 * 不依赖任何外部库，原生实现 QR 码编码和渲染
 * 
 * 支持: 数字/字母/字节/Kanji 编码
 * 纠错等级: L(7%), M(15%), Q(25%), H(30%)
 * 版本: 1-10
 */
;(function (global) {
  'use strict'

  // ============================================
  // GF(256) 多项式运算
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

  // ============================================
  // 纠错码生成
  // ============================================
  function genRSBlocks(version, eccLevel) {
    var rsBlocks = RS_BLOCK_TABLE[(version - 1) * 4 + eccLevel]
    var list = []
    for (var i = 0; i < rsBlocks.length; i += 3) {
      var count = rsBlocks[i]
      var totalCount = rsBlocks[i + 1]
      var dataCount = rsBlocks[i + 2]
      for (var j = 0; j < count; j++) {
        list.push({ totalCount: totalCount, dataCount: dataCount })
      }
    }
    return list
  }

  // ============================================
  // 位流
  // ============================================
  function BitBuffer() {
    this.buffer = []
    this.length = 0
  }

  BitBuffer.prototype.put = function (num, length) {
    for (var i = 0; i < length; i++) {
      this.buffer.push((num >> (length - 1 - i)) & 1)
    }
    this.length += length
  }

  BitBuffer.prototype.get = function (index) {
    return this.buffer[index]
  }

  // ============================================
  // QR 码编码器
  // ============================================
  var QRCodeEncoder = {
    // 编码模式
    MODE_NUMERIC: 0x1,
    MODE_ALPHA: 0x2,
    MODE_BYTE: 0x4,
    MODE_KANJI: 0x8,

    // 纠错等级
    ECC_L: 1,
    ECC_M: 0,
    ECC_Q: 3,
    ECC_H: 2,

    // 字符计数长度
    getCharCountLength: function (version, mode) {
      if (version <= 9) {
        if (mode === 0x1) return 10
        if (mode === 0x2) return 9
        if (mode === 0x4) return 8
        if (mode === 0x8) return 8
      } else if (version <= 26) {
        if (mode === 0x1) return 12
        if (mode === 0x2) return 11
        if (mode === 0x4) return 16
        if (mode === 0x8) return 10
      } else {
        if (mode === 0x1) return 14
        if (mode === 0x2) return 13
        if (mode === 0x4) return 16
        if (mode === 0x8) return 12
      }
      return 0
    },

    // 获取最小版本
    getMinVersion: function (dataLength, mode, eccLevel) {
      for (var v = 1; v <= 10; v++) {
        var maxDataBits = this.getMaxDataBits(v, eccLevel)
        var bitsNeeded = this.getCharCountLength(v, mode) + 4 + dataLength * this.getBitsPerChar(mode)
        if (bitsNeeded <= maxDataBits) return v
      }
      return 10
    },

    getBitsPerChar: function (mode) {
      if (mode === 0x1) return 10
      if (mode === 0x2) return 11
      if (mode === 0x4) return 8
      if (mode === 0x8) return 13
      return 0
    },

    getMaxDataBits: function (version, eccLevel) {
      var rsBlocks = RS_BLOCK_TABLE[(version - 1) * 4 + eccLevel]
      var totalDataBits = 0
      for (var i = 0; i < rsBlocks.length; i += 3) {
        totalDataBits += rsBlocks[i] * rsBlocks[i + 2]
      }
      return totalDataBits * 8
    },

    // 编码数据
    encode: function (data, eccLevel) {
      eccLevel = eccLevel || this.ECC_M

      // 检测编码模式
      var mode = this.detectMode(data)
      var byteData = this.stringToBytes(data)
      var version = this.getMinVersion(byteData.length, mode, eccLevel)

      // 构建位流
      var bitBuffer = new BitBuffer()

      // 模式指示符
      bitBuffer.put(mode, 4)

      // 字符计数
      bitBuffer.put(byteData.length, this.getCharCountLength(version, mode))

      // 数据
      for (var i = 0; i < byteData.length; i++) {
        bitBuffer.put(byteData[i], 8)
      }

      // 终止符
      var maxDataBits = this.getMaxDataBits(version, eccLevel)
      if (bitBuffer.length + 4 <= maxDataBits) {
        bitBuffer.put(0, 4)
      }

      // 填充到字节边界
      while (bitBuffer.length % 8 !== 0) {
        bitBuffer.put(0, 1)
      }

      // 填充到最大容量
      while (bitBuffer.length < maxDataBits) {
        bitBuffer.put(0xec, 8) // 236
        if (bitBuffer.length >= maxDataBits) break
        bitBuffer.put(0x11, 8) // 17
      }

      // 生成纠错码
      var rsBlocks = genRSBlocks(version, eccLevel)
      var dataBytes = this.bufferToBytes(bitBuffer)
      var totalDataCount = 0
      for (var j = 0; j < rsBlocks.length; j++) {
        totalDataCount += rsBlocks[j].dataCount
      }

      var dataBlocks = []
      var eccBlocks = []
      var offset = 0
      for (var k = 0; k < rsBlocks.length; k++) {
        var block = rsBlocks[k]
        var dataBlock = dataBytes.slice(offset, offset + block.dataCount)
        offset += block.dataCount

        // 生成纠错码
        var rsPoly = this.getRSPoly(block.totalCount - block.dataCount)
        var modPoly = new Polynomial(dataBlock, 0).mod(rsPoly)
        var eccBlock = new Array(block.totalCount - block.dataCount)
        for (var m = 0; m < eccBlock.length; m++) {
          eccBlock[m] = modPoly.get(m)
        }

        dataBlocks.push(dataBlock)
        eccBlocks.push(eccBlock)
      }

      // 交错数据块
      var totalBytes = []
      var maxDataLen = 0
      for (var n = 0; n < dataBlocks.length; n++) {
        if (dataBlocks[n].length > maxDataLen) maxDataLen = dataBlocks[n].length
      }
      for (var p = 0; p < maxDataLen; p++) {
        for (var q = 0; q < dataBlocks.length; q++) {
          if (p < dataBlocks[q].length) {
            totalBytes.push(dataBlocks[q][p])
          }
        }
      }

      var maxEccLen = 0
      for (var r = 0; r < eccBlocks.length; r++) {
        if (eccBlocks[r].length > maxEccLen) maxEccLen = eccBlocks[r].length
      }
      for (var s = 0; s < maxEccLen; s++) {
        for (var t = 0; t < eccBlocks.length; t++) {
          if (s < eccBlocks[t].length) {
            totalBytes.push(eccBlocks[t][s])
          }
        }
      }

      return {
        version: version,
        data: totalBytes,
        eccLevel: eccLevel
      }
    },

    detectMode: function (data) {
      if (/^[0-9]+$/.test(data)) return 0x1
      if (/^[0-9A-Z $%*+\-./:]+$/.test(data)) return 0x2
      return 0x4
    },

    stringToBytes: function (data) {
      var bytes = []
      for (var i = 0; i < data.length; i++) {
        var code = data.charCodeAt(i)
        if (code < 128) {
          bytes.push(code)
        } else if (code < 2048) {
          bytes.push(192 | (code >> 6))
          bytes.push(128 | (code & 63))
        } else {
          bytes.push(224 | (code >> 12))
          bytes.push(128 | ((code >> 6) & 63))
          bytes.push(128 | (code & 63))
        }
      }
      return bytes
    },

    bufferToBytes: function (bitBuffer) {
      var bytes = []
      for (var i = 0; i < bitBuffer.length; i += 8) {
        var byte = 0
        for (var j = 0; j < 8 && i + j < bitBuffer.length; j++) {
          byte = (byte << 1) | bitBuffer.get(i + j)
        }
        bytes.push(byte)
      }
      return bytes
    },

    getRSPoly: function (degree) {
      var poly = new Polynomial([1], 0)
      for (var i = 0; i < degree; i++) {
        poly = poly.mul(new Polynomial([1, GF256.pow(i)], 0))
      }
      return poly
    }
  }

  // ============================================
  // QR 码矩阵生成
  // ============================================
  var QRMatrix = {
    // 位置探测图形
    FINDER_PATTERN: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],

    // 校正图形
    ALIGN_PATTERN: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],

    // 校正图形位置
    getAlignPositions: function (version) {
      if (version === 1) return []
      var positions = ALIGN_POSITIONS[version] || []
      return positions
    },

    // 生成矩阵
    generate: function (encodedData) {
      var version = encodedData.version
      var size = 17 + version * 4
      var matrix = this.createMatrix(size)

      // 放置功能图形
      this.placeFinderPatterns(matrix, size)
      this.placeTimingPatterns(matrix, size)
      this.placeAlignmentPatterns(matrix, version)
      this.placeFormatInfo(matrix, encodedData.eccLevel)
      this.placeVersionInfo(matrix, version)

      // 放置数据
      this.placeData(matrix, encodedData)

      // 掩模
      this.applyMask(matrix, encodedData.eccLevel)

      return matrix
    },

    createMatrix: function (size) {
      var matrix = []
      for (var i = 0; i < size; i++) {
        matrix[i] = []
        for (var j = 0; j < size; j++) {
          matrix[i][j] = null
        }
      }
      return matrix
    },

    placeFinderPatterns: function (matrix, size) {
      // 三个角的位置探测图形
      this.placePattern(matrix, 0, 0, this.FINDER_PATTERN)
      this.placePattern(matrix, size - 7, 0, this.FINDER_PATTERN)
      this.placePattern(matrix, 0, size - 7, this.FINDER_PATTERN)

      // 分隔符
      for (var i = 0; i < 8; i++) {
        if (i < 7) {
          matrix[7][i] = 0
          matrix[i][7] = 0
          matrix[size - 8][i] = 0
          matrix[size - 1 - i][7] = 0
          matrix[7][size - 1 - i] = 0
          matrix[i][size - 8] = 0
        }
        matrix[7][size - 1 - i] = 0
        matrix[size - 1 - i][7] = 0
      }
    },

    placePattern: function (matrix, x, y, pattern) {
      for (var i = 0; i < pattern.length; i++) {
        for (var j = 0; j < pattern[i].length; j++) {
          matrix[y + i][x + j] = pattern[i][j]
        }
      }
    },

    placeTimingPatterns: function (matrix, size) {
      for (var i = 8; i < size - 8; i++) {
        if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0 ? 1 : 0
        if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0 ? 1 : 0
      }
    },

    placeAlignmentPatterns: function (matrix, version) {
      var positions = this.getAlignPositions(version)
      for (var i = 0; i < positions.length; i++) {
        for (var j = 0; j < positions.length; j++) {
          if (i === 0 && j === 0) continue
          if (i === 0 && j === positions.length - 1) continue
          if (i === positions.length - 1 && j === 0) continue

          var x = positions[j] - 2
          var y = positions[i] - 2

          // 检查是否与探测图形重叠
          if (x < 0 || y < 0) continue
          if (x + 5 > matrix.length || y + 5 > matrix.length) continue

          this.placePattern(matrix, x, y, this.ALIGN_PATTERN)
        }
      }
    },

    placeFormatInfo: function (matrix, eccLevel) {
      var formatData = FORMAT_INFO_TABLE[eccLevel] || FORMAT_INFO_TABLE[0]

      // 水平
      for (var i = 0; i < 15; i++) {
        var bit = (formatData >> (14 - i)) & 1
        if (i < 6) {
          matrix[8][i] = bit
        } else if (i < 8) {
          matrix[8][i + 1] = bit
        } else {
          matrix[8][matrix.length - 15 + i] = bit
        }
      }

      // 垂直
      for (var j = 0; j < 15; j++) {
        var bit2 = (formatData >> (14 - j)) & 1
        if (j < 6) {
          matrix[j][8] = bit2
        } else if (j < 8) {
          matrix[j + 1][8] = bit2
        } else {
          matrix[matrix.length - 15 + j][8] = bit2
        }
      }

      // 暗模块
      matrix[matrix.length - 8][8] = 1
    },

    placeVersionInfo: function (matrix, version) {
      if (version < 7) return

      var versionData = VERSION_INFO_TABLE[version - 7]
      for (var i = 0; i < 18; i++) {
        var bit = (versionData >> (17 - i)) & 1
        var x = Math.floor(i / 3)
        var y = i % 3
        matrix[matrix.length - 11 + y][x] = bit
        matrix[x][matrix.length - 11 + y] = bit
      }
    },

    placeData: function (matrix, encodedData) {
      var data = encodedData.data
      var size = matrix.length
      var bitIndex = 0
      var dir = -1

      for (var col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5

        while (true) {
          for (var i = 0; i < 2; i++) {
            var x = col - i
            if (matrix[x] === undefined) continue

            var row = dir === -1 ? size - 1 : 0
            while (row >= 0 && row < size) {
              if (matrix[x][row] === null) {
                if (bitIndex < data.length * 8) {
                  var byteIndex = Math.floor(bitIndex / 8)
                  var bitPos = 7 - (bitIndex % 8)
                  matrix[x][row] = (data[byteIndex] >> bitPos) & 1
                  bitIndex++
                } else {
                  matrix[x][row] = 0
                }
              }
              row += dir
            }
          }

          dir = -dir
          if (dir === -1) break
        }
      }
    },

    applyMask: function (matrix, eccLevel) {
      var size = matrix.length
      var bestScore = Infinity
      var bestMask = 0

      for (var mask = 0; mask < 8; mask++) {
        var masked = this.applyMaskPattern(matrix, mask)
        var score = this.evaluateMask(masked)
        if (score < bestScore) {
          bestScore = score
          bestMask = mask
        }
      }

      // 应用最佳掩模
      this.applyMaskPatternInPlace(matrix, bestMask)

      // 更新格式信息中的掩模引用
      var formatData = FORMAT_INFO_TABLE[eccLevel]
      var maskBits = bestMask << 10
      var finalFormat = formatData ^ maskBits

      // 重新放置格式信息
      for (var i = 0; i < 15; i++) {
        var bit = (finalFormat >> (14 - i)) & 1
        if (i < 6) {
          matrix[8][i] = bit
        } else if (i < 8) {
          matrix[8][i + 1] = bit
        } else {
          matrix[8][size - 15 + i] = bit
        }
      }

      for (var j = 0; j < 15; j++) {
        var bit2 = (finalFormat >> (14 - j)) & 1
        if (j < 6) {
          matrix[j][8] = bit2
        } else if (j < 8) {
          matrix[j + 1][8] = bit2
        } else {
          matrix[size - 15 + j][8] = bit2
        }
      }
    },

    applyMaskPattern: function (matrix, mask) {
      var size = matrix.length
      var result = []
      for (var i = 0; i < size; i++) {
        result[i] = matrix[i].slice()
      }

      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (result[y][x] === null || result[y][x] === undefined) continue
          if (this.isReserved(y, x, size)) continue

          var shouldInvert = false
          switch (mask) {
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
            result[y][x] = result[y][x] === 1 ? 0 : 1
          }
        }
      }

      return result
    },

    applyMaskPatternInPlace: function (matrix, mask) {
      var size = matrix.length
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (matrix[y][x] === null || matrix[y][x] === undefined) continue
          if (this.isReserved(y, x, size)) continue

          var shouldInvert = false
          switch (mask) {
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

    isReserved: function (y, x, size) {
      // 位置探测图形
      if (y < 8 && x < 8) return true
      if (y < 8 && x >= size - 8) return true
      if (y >= size - 8 && x < 8) return true

      // 时序图形
      if (y === 6 || x === 6) return true

      // 格式信息
      if (y === 8 || x === 8) return true

      return false
    },

    evaluateMask: function (matrix) {
      var size = matrix.length
      var score = 0

      // 1. 相邻模块颜色相同
      for (var y = 0; y < size; y++) {
        var runCount = 1
        var runColor = matrix[y][0]
        for (var x = 1; x < size; x++) {
          if (matrix[y][x] === runColor) {
            runCount++
          } else {
            if (runCount >= 5) score += 3 + (runCount - 5)
            runCount = 1
            runColor = matrix[y][x]
          }
        }
        if (runCount >= 5) score += 3 + (runCount - 5)
      }

      for (var x2 = 0; x2 < size; x2++) {
        var runCount2 = 1
        var runColor2 = matrix[0][x2]
        for (var y2 = 1; y2 < size; y2++) {
          if (matrix[y2][x2] === runColor2) {
            runCount2++
          } else {
            if (runCount2 >= 5) score += 3 + (runCount2 - 5)
            runCount2 = 1
            runColor2 = matrix[y2][x2]
          }
        }
        if (runCount2 >= 5) score += 3 + (runCount2 - 5)
      }

      // 2. 2x2 相同颜色块
      for (var y3 = 0; y3 < size - 1; y3++) {
        for (var x3 = 0; x3 < size - 1; x3++) {
          var v = matrix[y3][x3]
          if (v === matrix[y3][x3 + 1] && v === matrix[y3 + 1][x3] && v === matrix[y3 + 1][x3 + 1]) {
            score += 3
          }
        }
      }

      // 3. 1:1:3:1:1 模式
      for (var y4 = 0; y4 < size; y4++) {
        for (var x4 = 0; x4 < size - 6; x4++) {
          if (matrix[y4][x4] === 1 &&
              matrix[y4][x4 + 1] === 0 &&
              matrix[y4][x4 + 2] === 1 &&
              matrix[y4][x4 + 3] === 1 &&
              matrix[y4][x4 + 4] === 1 &&
              matrix[y4][x4 + 5] === 0 &&
              matrix[y4][x4 + 6] === 1) {
            score += 40
          }
        }
      }

      for (var x5 = 0; x5 < size; x5++) {
        for (var y5 = 0; y5 < size - 6; y5++) {
          if (matrix[y5][x5] === 1 &&
              matrix[y5 + 1][x5] === 0 &&
              matrix[y5 + 2][x5] === 1 &&
              matrix[y5 + 3][x5] === 1 &&
              matrix[y5 + 4][x5] === 1 &&
              matrix[y5 + 5][x5] === 0 &&
              matrix[y5 + 6][x5] === 1) {
            score += 40
          }
        }
      }

      // 4. 黑白比例
      var darkCount = 0
      for (var y6 = 0; y6 < size; y6++) {
        for (var x6 = 0; x6 < size; x6++) {
          if (matrix[y6][x6] === 1) darkCount++
        }
      }
      var total = size * size
      var percent = (darkCount / total) * 100
      var prev = Math.floor(percent / 5) * 5
      var next = Math.ceil(percent / 5) * 5
      score += Math.min(Math.abs(prev - 50) / 5, Math.abs(next - 50) / 5) * 10

      return score
    }
  }

  // ============================================
  // 渲染器
  // ============================================
  var QRRenderer = {
    render: function (matrix, options) {
      options = options || {}
      var size = matrix.length
      var moduleSize = options.moduleSize || 4
      var margin = options.margin || moduleSize * 2
      var fgColor = options.fgColor || '#000000'
      var bgColor = options.bgColor || '#ffffff'

      var canvasSize = size * moduleSize + margin * 2

      var canvas = document.createElement('canvas')
      canvas.width = canvasSize
      canvas.height = canvasSize
      var ctx = canvas.getContext('2d')

      // 背景
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvasSize, canvasSize)

      // 前景
      ctx.fillStyle = fgColor
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (matrix[y][x] === 1) {
            ctx.fillRect(
              margin + x * moduleSize,
              margin + y * moduleSize,
              moduleSize,
              moduleSize
            )
          }
        }
      }

      return canvas
    },

    renderSVG: function (matrix, options) {
      options = options || {}
      var size = matrix.length
      var moduleSize = options.moduleSize || 4
      var margin = options.margin || moduleSize * 2
      var fgColor = options.fgColor || '#000000'
      var bgColor = options.bgColor || '#ffffff'

      var totalSize = size * moduleSize + margin * 2

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalSize + '" height="' + totalSize + '" viewBox="0 0 ' + totalSize + ' ' + totalSize + '">'
      svg += '<rect width="100%" height="100%" fill="' + this.escapeXML(bgColor) + '"/>'

      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (matrix[y][x] === 1) {
            svg += '<rect x="' + (margin + x * moduleSize) + '" y="' + (margin + y * moduleSize) + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="' + this.escapeXML(fgColor) + '"/>'
          }
        }
      }

      svg += '</svg>'
      return svg
    },

    escapeXML: function (str) {
      return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
    }
  }

  // ============================================
  // 主 API
  // ============================================
  function QRCode() {
    this._modules = null
    this._version = 0
    this._eccLevel = QRCodeEncoder.ECC_M
  }

  QRCode.prototype = {
    constructor: QRCode,

    ECC_L: QRCodeEncoder.ECC_L,
    ECC_M: QRCodeEncoder.ECC_M,
    ECC_Q: QRCodeEncoder.ECC_Q,
    ECC_H: QRCodeEncoder.ECC_H,

    generate: function (data, eccLevel) {
      if (eccLevel !== undefined) this._eccLevel = eccLevel
      var encoded = QRCodeEncoder.encode(data, this._eccLevel)
      this._version = encoded.version
      this._modules = QRMatrix.generate(encoded)
      return this
    },

    getMatrix: function () {
      return this._modules
    },

    getSize: function () {
      return this._modules ? this._modules.length : 0
    },

    getVersion: function () {
      return this._version
    },

    toCanvas: function (canvas, options) {
      if (!this._modules) return null
      options = options || {}

      var matrix = this._modules
      var size = matrix.length
      var moduleSize = options.moduleSize || Math.floor((options.width || 200) / (size + 4))
      var margin = options.margin || moduleSize * 2
      var fgColor = options.fgColor || '#000000'
      var bgColor = options.bgColor || '#ffffff'

      var canvasSize = size * moduleSize + margin * 2

      if (canvas) {
        canvas.width = canvasSize
        canvas.height = canvasSize
      } else {
        canvas = document.createElement('canvas')
        canvas.width = canvasSize
        canvas.height = canvasSize
      }

      var ctx = canvas.getContext('2d')

      // 背景
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvasSize, canvasSize)

      // 前景
      ctx.fillStyle = fgColor
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (matrix[y][x] === 1) {
            ctx.fillRect(
              margin + x * moduleSize,
              margin + y * moduleSize,
              moduleSize,
              moduleSize
            )
          }
        }
      }

      return canvas
    },

    toDataURL: function (options) {
      var canvas = this.toCanvas(null, options)
      return canvas ? canvas.toDataURL('image/png') : null
    },

    toSVG: function (options) {
      if (!this._modules) return null
      return QRRenderer.renderSVG(this._modules, options)
    },

    toBlob: function (callback, options) {
      var canvas = this.toCanvas(null, options)
      if (!canvas) {
        callback(null)
        return
      }
      canvas.toBlob(callback, 'image/png')
    }
  }

  // ============================================
  // 数据表
  // ============================================
  var RS_BLOCK_TABLE = [
    // Version 1
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    // Version 2
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    // Version 3
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    // Version 4
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    // Version 5
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    // Version 6
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    // Version 7
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    // Version 8
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    // Version 9
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    // Version 10
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

  var VERSION_INFO_TABLE = [
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3,
    0x0BBF6, 0x0C762, 0x0D847, 0x0E60D,
    0x0F928, 0x10B78, 0x1145D, 0x12A17,
    0x13532, 0x149A6, 0x15683, 0x168C9,
    0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75,
    0x1F250, 0x209D5, 0x216F0, 0x228BA,
    0x2379F, 0x24B0B, 0x2542E, 0x26A64,
    0x27541, 0x28C69
  ]

  // 暴露到全局
  global.QRCode = QRCode

})(typeof window !== 'undefined' ? window : this)