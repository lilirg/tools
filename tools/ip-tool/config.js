/**
 * IP Tool - 配置模块
 * 所有默认配置集中管理
 */
;(function (global) {
  'use strict'

  var IPConfig = {
    // ===== 默认值 =====
    DEFAULTS: {
      maxHistory: 20
    },

    // ===== IPv4 地址范围 =====
    IPV4_CLASSES: [
      { name: 'A 类', range: '1.0.0.0 - 126.255.255.255', prefix: '1-126', defaultMask: '255.0.0.0', cidr: '/8', hosts: 16777214, type: '公有' },
      { name: 'B 类', range: '128.0.0.0 - 191.255.255.255', prefix: '128-191', defaultMask: '255.255.0.0', cidr: '/16', hosts: 65534, type: '公有' },
      { name: 'C 类', range: '192.0.0.0 - 223.255.255.255', prefix: '192-223', defaultMask: '255.255.255.0', cidr: '/24', hosts: 254, type: '公有' },
      { name: 'D 类', range: '224.0.0.0 - 239.255.255.255', prefix: '224-239', defaultMask: 'N/A', cidr: 'N/A', hosts: '组播', type: '组播' },
      { name: 'E 类', range: '240.0.0.0 - 255.255.255.255', prefix: '240-255', defaultMask: 'N/A', cidr: 'N/A', hosts: '保留', type: '保留' }
    ],

    // ===== 私有地址范围 =====
    PRIVATE_RANGES: [
      { range: '10.0.0.0/8', description: 'A 类私有地址' },
      { range: '172.16.0.0/12', description: 'B 类私有地址' },
      { range: '192.168.0.0/16', description: 'C 类私有地址' },
      { range: '127.0.0.0/8', description: '回环地址' },
      { range: '169.254.0.0/16', description: '链路本地地址' },
      { range: '224.0.0.0/4', description: '组播地址' },
      { range: '240.0.0.0/4', description: '保留地址' }
    ],

    // ===== 特殊地址 =====
    SPECIAL_ADDRESSES: [
      { address: '0.0.0.0/8', description: '当前网络（源地址）' },
      { address: '127.0.0.1', description: '本地回环地址' },
      { address: '255.255.255.255', description: '广播地址' }
    ],

    // ===== CIDR 前缀长度与子网掩码对照 =====
    CIDR_MASKS: [
      { cidr: 0, mask: '0.0.0.0', hosts: 4294967294 },
      { cidr: 1, mask: '128.0.0.0', hosts: 2147483646 },
      { cidr: 2, mask: '192.0.0.0', hosts: 1073741822 },
      { cidr: 3, mask: '224.0.0.0', hosts: 536870910 },
      { cidr: 4, mask: '240.0.0.0', hosts: 268435454 },
      { cidr: 5, mask: '248.0.0.0', hosts: 134217726 },
      { cidr: 6, mask: '252.0.0.0', hosts: 67108862 },
      { cidr: 7, mask: '254.0.0.0', hosts: 33554430 },
      { cidr: 8, mask: '255.0.0.0', hosts: 16777214 },
      { cidr: 9, mask: '255.128.0.0', hosts: 8388606 },
      { cidr: 10, mask: '255.192.0.0', hosts: 4194302 },
      { cidr: 11, mask: '255.224.0.0', hosts: 2097150 },
      { cidr: 12, mask: '255.240.0.0', hosts: 1048574 },
      { cidr: 13, mask: '255.248.0.0', hosts: 524286 },
      { cidr: 14, mask: '255.252.0.0', hosts: 262142 },
      { cidr: 15, mask: '255.254.0.0', hosts: 131070 },
      { cidr: 16, mask: '255.255.0.0', hosts: 65534 },
      { cidr: 17, mask: '255.255.128.0', hosts: 32766 },
      { cidr: 18, mask: '255.255.192.0', hosts: 16382 },
      { cidr: 19, mask: '255.255.224.0', hosts: 8190 },
      { cidr: 20, mask: '255.255.240.0', hosts: 4094 },
      { cidr: 21, mask: '255.255.248.0', hosts: 2046 },
      { cidr: 22, mask: '255.255.252.0', hosts: 1022 },
      { cidr: 23, mask: '255.255.254.0', hosts: 510 },
      { cidr: 24, mask: '255.255.255.0', hosts: 254 },
      { cidr: 25, mask: '255.255.255.128', hosts: 126 },
      { cidr: 26, mask: '255.255.255.192', hosts: 62 },
      { cidr: 27, mask: '255.255.255.224', hosts: 30 },
      { cidr: 28, mask: '255.255.255.240', hosts: 14 },
      { cidr: 29, mask: '255.255.255.248', hosts: 6 },
      { cidr: 30, mask: '255.255.255.252', hosts: 2 },
      { cidr: 31, mask: '255.255.255.254', hosts: 0 },
      { cidr: 32, mask: '255.255.255.255', hosts: 1 }
    ],

    // ===== 历史记录最大数量 =====
    MAX_HISTORY: 20,

    // ===== localStorage 键名 =====
    STORAGE_KEYS: {
      history: 'ip_history'
    }
  }

  // 暴露到全局
  global.IPConfig = IPConfig

})(typeof window !== 'undefined' ? window : this)