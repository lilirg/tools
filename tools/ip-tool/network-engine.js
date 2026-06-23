/**
 * IP Tool - 网络计算引擎
 * 负责 IP 地址验证、子网计算、CIDR 计算等核心逻辑
 *
 * 依赖: IPConfig
 */
;(function (global) {
  'use strict'

  var Config = global.IPConfig

  var NetworkEngine = {
    // ============================================
    // IPv4 验证
    // ============================================
    isValidIPv4: function (ip) {
      var parts = ip.trim().split('.')
      if (parts.length !== 4) return false
      for (var i = 0; i < parts.length; i++) {
        var num = parseInt(parts[i], 10)
        if (isNaN(num) || num < 0 || num > 255) return false
        if (parts[i] !== num.toString()) return false // 防止前导零
      }
      return true
    },

    // ============================================
    // IPv6 验证
    // ============================================
    isValidIPv6: function (ip) {
      var str = ip.trim()

      // 允许带方括号
      if (str.startsWith('[') && str.endsWith(']')) {
        str = str.slice(1, -1)
      }

      // 空字符串
      if (!str) return false

      // 检查双冒号数量
      var doubleColonCount = (str.match(/::/g) || []).length
      if (doubleColonCount > 1) return false

      // 分割
      var parts
      if (str.includes('::')) {
        // 处理压缩格式
        var sides = str.split('::')
        var left = sides[0] ? sides[0].split(':') : []
        var right = sides[1] ? sides[1].split(':') : []
        parts = left.concat(right)
        // 填充省略的 0
        var missing = 8 - left.length - right.length
        if (missing < 0) return false
      } else {
        parts = str.split(':')
        if (parts.length !== 8) return false
      }

      // 验证每个部分
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '') continue
        if (!/^[0-9a-fA-F]{1,4}$/.test(parts[i])) return false
      }

      return true
    },

    // ============================================
    // 自动检测 IP 版本
    // ============================================
    detectVersion: function (ip) {
      if (this.isValidIPv4(ip)) return 4
      if (this.isValidIPv6(ip)) return 6
      return 0
    },

    // ============================================
    // IP 地址转整数
    // ============================================
    ipToInt: function (ip) {
      if (!this.isValidIPv4(ip)) return null
      var parts = ip.split('.').map(function (p) { return parseInt(p, 10) })
      return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
    },

    // ============================================
    // 整数转 IP 地址
    // ============================================
    intToIp: function (num) {
      if (num < 0 || num > 4294967295) return null
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.')
    },

    // ============================================
    // 获取 IP 地址类别
    // ============================================
    getIPClass: function (ip) {
      if (!this.isValidIPv4(ip)) return null
      var first = parseInt(ip.split('.')[0], 10)

      if (first >= 1 && first <= 126) return Config.IPV4_CLASSES[0]
      if (first >= 128 && first <= 191) return Config.IPV4_CLASSES[1]
      if (first >= 192 && first <= 223) return Config.IPV4_CLASSES[2]
      if (first >= 224 && first <= 239) return Config.IPV4_CLASSES[3]
      if (first >= 240 && first <= 255) return Config.IPV4_CLASSES[4]

      return null
    },

    // ============================================
    // 检查是否为私有地址
    // ============================================
    isPrivate: function (ip) {
      if (!this.isValidIPv4(ip)) return false
      var intIp = this.ipToInt(ip)

      // 10.0.0.0/8
      if ((intIp & 0xFF000000) === 0x0A000000) return true
      // 172.16.0.0/12
      if ((intIp & 0xFFF00000) === 0xAC100000) return true
      // 192.168.0.0/16
      if ((intIp & 0xFFFF0000) === 0xC0A80000) return true
      // 127.0.0.0/8 (回环)
      if ((intIp & 0xFF000000) === 0x7F000000) return true
      // 169.254.0.0/16 (链路本地)
      if ((intIp & 0xFFFF0000) === 0xA9FE0000) return true

      return false
    },

    // ============================================
    // 获取 IP 地址信息
    // ============================================
    getIPInfo: function (ip) {
      if (!this.isValidIPv4(ip)) return null

      var ipClass = this.getIPClass(ip)
      var isPrivate = this.isPrivate(ip)
      var intIp = this.ipToInt(ip)
      var binary = this.toBinary(ip)

      // 获取私有范围描述
      var privateDesc = ''
      if (isPrivate) {
        var ranges = Config.PRIVATE_RANGES
        for (var i = 0; i < ranges.length; i++) {
          var range = ranges[i]
          var cidrParts = range.range.split('/')
          var rangeIp = this.ipToInt(cidrParts[0])
          var prefixLen = parseInt(cidrParts[1], 10)
          var mask = prefixLen === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLen)) >>> 0
          if ((intIp & mask) === (rangeIp & mask)) {
            privateDesc = range.description
            break
          }
        }
      }

      return {
        ip: ip,
        version: 4,
        class: ipClass ? ipClass.name : '未知',
        classRange: ipClass ? ipClass.range : 'N/A',
        type: isPrivate ? '私有地址' : '公有地址',
        privateDesc: privateDesc,
        binary: binary,
        integer: intIp,
        hex: '0x' + intIp.toString(16).toUpperCase(),
        isPrivate: isPrivate,
        isLoopback: (intIp & 0xFF000000) === 0x7F000000,
        isBroadcast: ip === '255.255.255.255',
        isMulticast: (intIp & 0xF0000000) === 0xE0000000
      }
    },

    // ============================================
    // IP 转二进制
    // ============================================
    toBinary: function (ip) {
      if (!this.isValidIPv4(ip)) return null
      return ip.split('.').map(function (part) {
        var bin = parseInt(part, 10).toString(2)
        while (bin.length < 8) bin = '0' + bin
        return bin
      }).join('.')
    },

    // ============================================
    // 二进制转 IP
    // ============================================
    binaryToIP: function (binary) {
      var parts = binary.replace(/\./g, '').match(/.{8}/g)
      if (!parts || parts.length !== 4) return null
      return parts.map(function (p) {
        return parseInt(p, 2)
      }).join('.')
    },

    // ============================================
    // CIDR 计算
    // ============================================
    calculateCIDR: function (ip, prefixLength) {
      if (!this.isValidIPv4(ip)) return null
      if (prefixLength < 0 || prefixLength > 32) return null

      var intIp = this.ipToInt(ip)
      var mask = prefixLength === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLength)) >>> 0
      var network = intIp & mask
      var broadcast = network | (~mask >>> 0)
      var firstHost = network + 1
      var lastHost = broadcast - 1
      var totalHosts = Math.pow(2, 32 - prefixLength) - 2

      // 查找子网掩码
      var maskInfo = null
      for (var i = 0; i < Config.CIDR_MASKS.length; i++) {
        if (Config.CIDR_MASKS[i].cidr === prefixLength) {
          maskInfo = Config.CIDR_MASKS[i]
          break
        }
      }

      return {
        ip: ip,
        prefixLength: prefixLength,
        cidr: ip + '/' + prefixLength,
        subnetMask: maskInfo ? maskInfo.mask : this.intToIp(mask),
        wildcardMask: this.intToIp(~mask >>> 0),
        networkAddress: this.intToIp(network),
        broadcastAddress: this.intToIp(broadcast >>> 0),
        firstHost: this.intToIp(firstHost),
        lastHost: this.intToIp(lastHost >>> 0),
        totalHosts: totalHosts < 0 ? 0 : totalHosts,
        usableHosts: totalHosts < 0 ? 0 : totalHosts,
        binaryMask: this.toBinary(maskInfo ? maskInfo.mask : this.intToIp(mask))
      }
    },

    // ============================================
    // 解析 CIDR 表示法
    // ============================================
    parseCIDR: function (cidr) {
      var parts = cidr.trim().split('/')
      if (parts.length !== 2) return null

      var ip = parts[0].trim()
      var prefix = parseInt(parts[1].trim(), 10)

      if (!this.isValidIPv4(ip)) return null
      if (isNaN(prefix) || prefix < 0 || prefix > 32) return null

      return this.calculateCIDR(ip, prefix)
    },

    // ============================================
    // 子网划分
    // ============================================
    subnetDivide: function (cidr, newPrefixLength) {
      var network = this.parseCIDR(cidr)
      if (!network) return null
      if (newPrefixLength <= network.prefixLength || newPrefixLength > 32) return null

      var subnets = []
      var count = Math.pow(2, newPrefixLength - network.prefixLength)
      var intNetwork = this.ipToInt(network.networkAddress)
      var step = Math.pow(2, 32 - newPrefixLength)

      for (var i = 0; i < count; i++) {
        var subnetIp = this.intToIp(intNetwork + i * step)
        var subnetInfo = this.calculateCIDR(subnetIp, newPrefixLength)
        if (subnetInfo) {
          subnets.push(subnetInfo)
        }
      }

      return {
        originalCIDR: cidr,
        newPrefixLength: newPrefixLength,
        subnetCount: count,
        subnets: subnets
      }
    },

    // ============================================
    // 获取本机 IP（通过 WebRTC）
    // ============================================
    getLocalIP: function () {
      return new Promise(function (resolve) {
        try {
          var pc = new RTCPeerConnection({ iceServers: [] })
          pc.createDataChannel('')

          pc.onicecandidate = function (e) {
            if (e.candidate) {
              var ipMatch = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
              if (ipMatch) {
                pc.close()
                resolve(ipMatch[1])
              }
            }
          }

          pc.createOffer().then(function (offer) {
            pc.setLocalDescription(offer)
          }).catch(function () {
            resolve('无法获取')
          })

          // 超时处理
          setTimeout(function () {
            try { pc.close() } catch (e) {}
            resolve('无法获取')
          }, 3000)
        } catch (e) {
          resolve('无法获取')
        }
      })
    },

    // ============================================
    // 获取网络信息（通过 navigator.connection）
    // ============================================
    getNetworkInfo: function () {
      var info = {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages ? navigator.languages.join(', ') : 'N/A',
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || 'N/A'
      }

      // 网络信息 API
      var connection = navigator.connection ||
                       navigator.mozConnection ||
                       navigator.webkitConnection
      if (connection) {
        info.effectiveType = connection.effectiveType || 'N/A'
        info.downlink = connection.downlink ? connection.downlink + ' Mbps' : 'N/A'
        info.rtt = connection.rtt ? connection.rtt + ' ms' : 'N/A'
        info.saveData = connection.saveData || false
      } else {
        info.effectiveType = 'N/A'
        info.downlink = 'N/A'
        info.rtt = 'N/A'
        info.saveData = 'N/A'
      }

      return info
    },

    // ============================================
    // 验证子网掩码
    // ============================================
    isValidMask: function (mask) {
      if (!this.isValidIPv4(mask)) return false
      var intMask = this.ipToInt(mask)
      // 子网掩码必须是连续的 1 后面跟连续的 0
      var binary = intMask.toString(2)
      while (binary.length < 32) binary = '0' + binary
      var firstZero = binary.indexOf('0')
      if (firstZero === -1) return true // 255.255.255.255
      var lastOne = binary.lastIndexOf('1')
      return lastOne < firstZero
    },

    // ============================================
    // 子网掩码转 CIDR 前缀长度
    // ============================================
    maskToCIDR: function (mask) {
      if (!this.isValidMask(mask)) return null
      var intMask = this.ipToInt(mask)
      var binary = intMask.toString(2)
      while (binary.length < 32) binary = '0' + binary
      return binary.split('1').length - 1
    },

    // ============================================
    // CIDR 前缀长度转子网掩码
    // ============================================
    cidrToMask: function (prefixLength) {
      if (prefixLength < 0 || prefixLength > 32) return null
      for (var i = 0; i < Config.CIDR_MASKS.length; i++) {
        if (Config.CIDR_MASKS[i].cidr === prefixLength) {
          return Config.CIDR_MASKS[i].mask
        }
      }
      return null
    },

    // ============================================
    // 格式化 IP 信息为文本
    // ============================================
    formatIPInfo: function (info) {
      if (!info) return ''
      var lines = [
        'IP 地址: ' + info.ip,
        'IP 版本: IPv' + info.version,
        '地址类别: ' + info.class,
        '类别范围: ' + info.classRange,
        '地址类型: ' + info.type,
        '二进制: ' + info.binary,
        '十进制: ' + info.integer,
        '十六进制: ' + info.hex
      ]
      if (info.privateDesc) {
        lines.push('私有范围: ' + info.privateDesc)
      }
      return lines.join('\n')
    },

    // ============================================
    // 格式化 CIDR 信息为文本
    // ============================================
    formatCIDRInfo: function (info) {
      if (!info) return ''
      return [
        'CIDR: ' + info.cidr,
        '子网掩码: ' + info.subnetMask,
        '通配符掩码: ' + info.wildcardMask,
        '网络地址: ' + info.networkAddress,
        '广播地址: ' + info.broadcastAddress,
        '可用主机: ' + info.firstHost + ' - ' + info.lastHost,
        '主机数量: ' + info.usableHosts
      ].join('\n')
    }
  }

  // 暴露到全局
  global.NetworkEngine = NetworkEngine

})(typeof window !== 'undefined' ? window : this)