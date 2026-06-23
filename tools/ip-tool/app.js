/**
 * IP Tool - UI 交互层
 * 处理所有 UI 交互、事件绑定、历史记录管理
 *
 * 依赖: IPConfig, NetworkEngine
 */
;(function (global) {
  'use strict'

  var Config = global.IPConfig
  var Engine = global.NetworkEngine

  // ============================================
  // Toast 提示
  // ============================================
  var IPToast = {
    show: function (message, type) {
      type = type || 'info'
      var toast = document.createElement('div')
      toast.className = 'ip-toast ip-toast-' + type
      toast.textContent = message
      document.body.appendChild(toast)

      setTimeout(function () { toast.classList.add('show') }, 10)
      setTimeout(function () {
        toast.classList.remove('show')
        toast.classList.add('hide')
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

  // ============================================
  // 历史记录管理
  // ============================================
  var HistoryManager = {
    _key: Config.STORAGE_KEYS.history,
    _items: [],

    load: function () {
      try {
        var data = localStorage.getItem(this._key)
        this._items = data ? JSON.parse(data) : []
      } catch (e) {
        this._items = []
      }
      return this._items
    },

    save: function () {
      try {
        localStorage.setItem(this._key, JSON.stringify(this._items))
      } catch (e) {}
    },

    add: function (record) {
      this.load()
      record.time = Date.now()
      this._items.unshift(record)
      if (this._items.length > Config.MAX_HISTORY) {
        this._items = this._items.slice(0, Config.MAX_HISTORY)
      }
      this.save()
    },

    remove: function (index) {
      this.load()
      if (index >= 0 && index < this._items.length) {
        this._items.splice(index, 1)
        this.save()
      }
    },

    getAll: function () {
      this.load()
      return this._items
    },

    clear: function () {
      this._items = []
      this.save()
    }
  }

  // ============================================
  // IP 工具主应用
  // ============================================
  function IPToolApp() {
    this._init()
  }

  IPToolApp.prototype = {
    constructor: IPToolApp,

    _init: function () {
      this._cacheDOM()
      this._bindEvents()
      this._loadHistory()
      this._getLocalIP()
      this._getNetworkInfo()
    },

    // ============================================
    // DOM 缓存
    // ============================================
    _cacheDOM: function () {
      this.$ = {
        // Tab 导航
        tabs: document.querySelectorAll('.ip-tab'),
        tabContents: document.querySelectorAll('.tab-content'),

        // IP 查询
        ipInput: document.getElementById('ipInput'),
        ipLookupBtn: document.getElementById('ipLookupBtn'),
        ipResult: document.getElementById('ipResult'),

        // CIDR 计算
        cidrInput: document.getElementById('cidrInput'),
        cidrCalcBtn: document.getElementById('cidrCalcBtn'),
        cidrResult: document.getElementById('cidrResult'),

        // 子网划分
        subnetCidrInput: document.getElementById('subnetCidrInput'),
        subnetPrefixInput: document.getElementById('subnetPrefixInput'),
        subnetCalcBtn: document.getElementById('subnetCalcBtn'),
        subnetResult: document.getElementById('subnetResult'),

        // 本机信息
        localIP: document.getElementById('localIP'),
        networkStatus: document.getElementById('networkStatus'),
        connectionType: document.getElementById('connectionType'),
        downlink: document.getElementById('downlink'),
        rtt: document.getElementById('rtt'),
        browserInfo: document.getElementById('browserInfo'),
        platform: document.getElementById('platform'),
        language: document.getElementById('language'),

        // 参考信息
        ipClassTable: document.getElementById('ipClassTable'),
        privateRangeTable: document.getElementById('privateRangeTable'),
        cidrTable: document.getElementById('cidrTable'),

        // 历史记录
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn')
      }
    },

    // ============================================
    // 事件绑定
    // ============================================
    _bindEvents: function () {
      var self = this

      // ===== Tab 切换 =====
      this.$.tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          self._switchTab(this.dataset.tab)
        })
      })

      // ===== IP 查询 =====
      if (this.$.ipLookupBtn) {
        this.$.ipLookupBtn.addEventListener('click', function () {
          self._lookupIP()
        })
      }
      if (this.$.ipInput) {
        this.$.ipInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self._lookupIP()
        })
      }

      // ===== CIDR 计算 =====
      if (this.$.cidrCalcBtn) {
        this.$.cidrCalcBtn.addEventListener('click', function () {
          self._calcCIDR()
        })
      }
      if (this.$.cidrInput) {
        this.$.cidrInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self._calcCIDR()
        })
      }

      // ===== 子网划分 =====
      if (this.$.subnetCalcBtn) {
        this.$.subnetCalcBtn.addEventListener('click', function () {
          self._calcSubnet()
        })
      }

      // ===== 清空历史 =====
      if (this.$.clearHistoryBtn) {
        this.$.clearHistoryBtn.addEventListener('click', function () {
          HistoryManager.clear()
          self._loadHistory()
          IPToast.success('历史记录已清空')
        })
      }
    },

    // ============================================
    // Tab 切换
    // ============================================
    _switchTab: function (tabName) {
      this.$.tabs.forEach(function (tab) {
        tab.classList.toggle('active', tab.dataset.tab === tabName)
      })
      this.$.tabContents.forEach(function (content) {
        content.classList.toggle('active', content.id === 'tab-' + tabName)
      })
    },

    // ============================================
    // IP 查询
    // ============================================
    _lookupIP: function () {
      var ip = this.$.ipInput.value.trim()
      if (!ip) {
        IPToast.warning('请输入 IP 地址')
        return
      }

      var version = Engine.detectVersion(ip)
      if (version === 0) {
        this.$.ipResult.innerHTML = '<div class="result-error">❌ 无效的 IP 地址格式</div>'
        return
      }

      if (version === 4) {
        var info = Engine.getIPInfo(ip)
        if (!info) {
          this.$.ipResult.innerHTML = '<div class="result-error">❌ 无法解析 IP 地址</div>'
          return
        }
        this._renderIPInfo(info)
        this._addHistory('IP 查询', ip + ' (' + info.type + ', ' + info.class + '类)')
      } else {
        this.$.ipResult.innerHTML =
          '<div class="result-card">' +
            '<div class="result-row"><span class="result-label">IP 地址</span><span class="result-value">' + ip + '</span></div>' +
            '<div class="result-row"><span class="result-label">IP 版本</span><span class="result-value">IPv6</span></div>' +
            '<div class="result-row"><span class="result-label">格式验证</span><span class="result-value" style="color:#52c41a">✅ 有效</span></div>' +
          '</div>'
        this._addHistory('IP 查询', ip + ' (IPv6)')
      }

      IPToast.success('查询完成')
    },

    // ============================================
    // 渲染 IP 信息
    // ============================================
    _renderIPInfo: function (info) {
      var typeColor = info.isPrivate ? '#faad14' : '#52c41a'
      var typeIcon = info.isPrivate ? '🏠' : '🌐'

      this.$.ipResult.innerHTML =
        '<div class="result-card">' +
          '<div class="result-row"><span class="result-label">IP 地址</span><span class="result-value ip-highlight">' + info.ip + '</span></div>' +
          '<div class="result-row"><span class="result-label">IP 版本</span><span class="result-value">IPv4</span></div>' +
          '<div class="result-row"><span class="result-label">地址类别</span><span class="result-value">' + info.class + ' 类 (' + info.classRange + ')</span></div>' +
          '<div class="result-row"><span class="result-label">地址类型</span><span class="result-value" style="color:' + typeColor + '">' + typeIcon + ' ' + info.type + '</span></div>' +
          (info.privateDesc ? '<div class="result-row"><span class="result-label">私有范围</span><span class="result-value">' + info.privateDesc + '</span></div>' : '') +
          '<div class="result-row"><span class="result-label">二进制</span><span class="result-value mono">' + info.binary + '</span></div>' +
          '<div class="result-row"><span class="result-label">十进制</span><span class="result-value mono">' + info.integer + '</span></div>' +
          '<div class="result-row"><span class="result-label">十六进制</span><span class="result-value mono">' + info.hex + '</span></div>' +
          '<div class="result-row"><span class="result-label">回环地址</span><span class="result-value">' + (info.isLoopback ? '✅ 是' : '❌ 否') + '</span></div>' +
          '<div class="result-row"><span class="result-label">广播地址</span><span class="result-value">' + (info.isBroadcast ? '✅ 是' : '❌ 否') + '</span></div>' +
          '<div class="result-row"><span class="result-label">组播地址</span><span class="result-value">' + (info.isMulticast ? '✅ 是' : '❌ 否') + '</span></div>' +
        '</div>'
    },

    // ============================================
    // CIDR 计算
    // ============================================
    _calcCIDR: function () {
      var input = this.$.cidrInput.value.trim()
      if (!input) {
        IPToast.warning('请输入 CIDR 地址')
        return
      }

      var result = Engine.parseCIDR(input)
      if (!result) {
        this.$.cidrResult.innerHTML = '<div class="result-error">❌ 无效的 CIDR 格式 (例如: 192.168.1.0/24)</div>'
        return
      }

      this.$.cidrResult.innerHTML =
        '<div class="result-card">' +
          '<div class="result-row"><span class="result-label">CIDR</span><span class="result-value ip-highlight">' + result.cidr + '</span></div>' +
          '<div class="result-row"><span class="result-label">子网掩码</span><span class="result-value mono">' + result.subnetMask + '</span></div>' +
          '<div class="result-row"><span class="result-label">通配符掩码</span><span class="result-value mono">' + result.wildcardMask + '</span></div>' +
          '<div class="result-row"><span class="result-label">网络地址</span><span class="result-value">' + result.networkAddress + '</span></div>' +
          '<div class="result-row"><span class="result-label">广播地址</span><span class="result-value">' + result.broadcastAddress + '</span></div>' +
          '<div class="result-row"><span class="result-label">可用主机范围</span><span class="result-value">' + result.firstHost + ' ~ ' + result.lastHost + '</span></div>' +
          '<div class="result-row"><span class="result-label">可用主机数</span><span class="result-value" style="color:#1677ff;font-weight:700">' + result.usableHosts + '</span></div>' +
          '<div class="result-row"><span class="result-label">二进制掩码</span><span class="result-value mono" style="font-size:11px">' + result.binaryMask + '</span></div>' +
        '</div>'

      this._addHistory('CIDR 计算', result.cidr + ' (' + result.usableHosts + ' 主机)')
      IPToast.success('计算完成')
    },

    // ============================================
    // 子网划分
    // ============================================
    _calcSubnet: function () {
      var cidr = this.$.subnetCidrInput.value.trim()
      var prefix = parseInt(this.$.subnetPrefixInput.value, 10)

      if (!cidr || !prefix) {
        IPToast.warning('请输入 CIDR 和新前缀长度')
        return
      }

      var result = Engine.subnetDivide(cidr, prefix)
      if (!result) {
        this.$.subnetResult.innerHTML = '<div class="result-error">❌ 无效的输入，请检查 CIDR 格式和前缀长度</div>'
        return
      }

      var html =
        '<div class="result-card">' +
          '<div class="result-row"><span class="result-label">原始网络</span><span class="result-value">' + result.originalCIDR + '</span></div>' +
          '<div class="result-row"><span class="result-label">新前缀</span><span class="result-value">/' + result.newPrefixLength + '</span></div>' +
          '<div class="result-row"><span class="result-label">子网数量</span><span class="result-value" style="color:#1677ff;font-weight:700">' + result.subnetCount + '</span></div>' +
        '</div>' +
        '<div class="subnet-list">' +
          '<h4>子网列表</h4>'

      result.subnets.forEach(function (subnet, index) {
        html +=
          '<div class="subnet-item">' +
            '<div class="subnet-index">#' + (index + 1) + '</div>' +
            '<div class="subnet-info">' +
              '<div class="subnet-cidr">' + subnet.cidr + '</div>' +
              '<div class="subnet-range">' + subnet.firstHost + ' ~ ' + subnet.lastHost + '</div>' +
              '<div class="subnet-hosts">' + subnet.usableHosts + ' 主机</div>' +
            '</div>' +
          '</div>'
      })

      html += '</div>'

      this.$.subnetResult.innerHTML = html
      this._addHistory('子网划分', cidr + ' → /' + prefix + ' (' + result.subnetCount + ' 子网)')
      IPToast.success('子网划分完成')
    },

    // ============================================
    // 获取本机 IP
    // ============================================
    _getLocalIP: function () {
      var self = this
      Engine.getLocalIP().then(function (ip) {
        self.$.localIP.textContent = ip
      })
    },

    // ============================================
    // 获取网络信息
    // ============================================
    _getNetworkInfo: function () {
      var info = Engine.getNetworkInfo()

      this.$.networkStatus.textContent = info.online ? '🟢 在线' : '🔴 离线'
      this.$.networkStatus.className = info.online ? 'status-online' : 'status-offline'
      this.$.connectionType.textContent = info.effectiveType
      this.$.downlink.textContent = info.downlink
      this.$.rtt.textContent = info.rtt
      this.$.browserInfo.textContent = info.userAgent
      this.$.platform.textContent = info.platform
      this.$.language.textContent = info.language
    },

    // ============================================
    // 添加历史记录
    // ============================================
    _addHistory: function (title, detail) {
      HistoryManager.add({ title: '🌐 ' + title, detail: detail })
      this._loadHistory()
    },

    // ============================================
    // 历史记录
    // ============================================
    _loadHistory: function () {
      var items = HistoryManager.getAll()
      var container = this.$.historyList
      var self = this

      if (!container) return

      if (items.length === 0) {
        container.innerHTML = '<span class="history-empty">暂无记录</span>'
        return
      }

      container.innerHTML = ''
      items.forEach(function (item, index) {
        var div = document.createElement('div')
        div.className = 'history-item'

        var title = document.createElement('div')
        title.className = 'history-title'
        title.textContent = item.title
        div.appendChild(title)

        var detail = document.createElement('div')
        detail.className = 'history-detail'
        detail.textContent = item.detail
        div.appendChild(detail)

        var removeBtn = document.createElement('button')
        removeBtn.className = 'remove-history'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          HistoryManager.remove(index)
          self._loadHistory()
        })
        div.appendChild(removeBtn)

        container.appendChild(div)
      })
    }
  }

  // ============================================
  // 初始化
  // ============================================
  global.IPToolApp = IPToolApp

  document.addEventListener('DOMContentLoaded', function () {
    global._ipToolApp = new IPToolApp()
  })

})(typeof window !== 'undefined' ? window : this)