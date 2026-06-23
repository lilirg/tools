/**
 * Unit Converter - 换算引擎
 * 处理所有单位换算逻辑
 *
 * 依赖: ConversionData, UnitConfig
 */
;(function (global) {
  'use strict'

  var Data = global.ConversionData
  var Config = global.UnitConfig

  var ConverterEngine = {
    // ============================================
    // 获取所有类别列表
    // ============================================
    getCategories: function () {
      return Config.CATEGORY_ORDER.slice()
    },

    // ============================================
    // 获取指定类别的所有单位
    // ============================================
    getUnits: function (category) {
      var catData = Data[category]
      if (!catData) return []

      var units = []
      for (var key in catData.units) {
        if (catData.units.hasOwnProperty(key)) {
          var unit = catData.units[key]
          units.push({
            key: key,
            name: unit.name,
            symbol: unit.symbol
          })
        }
      }
      return units
    },

    // ============================================
    // 获取单位信息
    // ============================================
    getUnitInfo: function (category, unitKey) {
      var catData = Data[category]
      if (!catData || !catData.units[unitKey]) return null

      var unit = catData.units[unitKey]
      return {
        key: unitKey,
        name: unit.name,
        symbol: unit.symbol,
        factor: unit.factor,
        formula: unit.formula
      }
    },

    // ============================================
    // 获取类别图标
    // ============================================
    getCategoryIcon: function (category) {
      return Config.CATEGORY_ICONS[category] || '📐'
    },

    // ============================================
    // 获取类别中文名
    // ============================================
    getCategoryLabel: function (category) {
      return Config.CATEGORY_LABELS[category] || category
    },

    // ============================================
    // 核心换算方法
    // ============================================
    convert: function (value, fromUnit, toUnit, category) {
      if (value === '' || value === null || value === undefined || isNaN(Number(value))) {
        return { error: '请输入有效的数值' }
      }

      value = Number(value)
      var catData = Data[category]
      if (!catData) return { error: '不支持的类别' }

      var fromInfo = catData.units[fromUnit]
      var toInfo = catData.units[toUnit]
      if (!fromInfo || !toInfo) return { error: '不支持的单位' }

      var result

      // 温度特殊处理
      if (category === 'temperature') {
        result = this._convertTemperature(value, fromUnit, toUnit)
      } else {
        // 标准换算: 先转到基准单位，再转到目标单位
        var baseValue = value * fromInfo.factor
        result = baseValue / toInfo.factor
      }

      return {
        value: result,
        fromValue: value,
        fromUnit: fromInfo,
        toUnit: toInfo,
        category: category
      }
    },

    // ============================================
    // 温度换算（特殊公式）
    // ============================================
    _convertTemperature: function (value, fromUnit, toUnit) {
      // 先转到摄氏度
      var celsius
      switch (fromUnit) {
        case 'c':
          celsius = value
          break
        case 'f':
          celsius = (value - 32) * 5 / 9
          break
        case 'k':
          celsius = value - 273.15
          break
        case 're':
          celsius = value * 5 / 4
          break
        default:
          return NaN
      }

      // 从摄氏度转到目标单位
      switch (toUnit) {
        case 'c':
          return celsius
        case 'f':
          return celsius * 9 / 5 + 32
        case 'k':
          return celsius + 273.15
        case 're':
          return celsius * 4 / 5
        default:
          return NaN
      }
    },

    // ============================================
    // 生成换算公式文本
    // ============================================
    getFormula: function (value, fromUnit, toUnit, category, result) {
      var catData = Data[category]
      if (!catData) return ''

      var fromInfo = catData.units[fromUnit]
      var toInfo = catData.units[toUnit]
      if (!fromInfo || !toInfo) return ''

      var fromSymbol = fromInfo.symbol
      var toSymbol = toInfo.symbol

      if (category === 'temperature') {
        return this._getTemperatureFormula(value, fromUnit, toUnit, fromSymbol, toSymbol, result)
      }

      // 标准换算公式
      var fromFactor = fromInfo.factor
      var toFactor = toInfo.factor

      if (fromFactor === toFactor) {
        return value + ' ' + fromSymbol + ' = ' + result + ' ' + toSymbol + '（相同单位）'
      }

      if (fromFactor === 1) {
        return value + ' ' + fromSymbol + ' ÷ ' + toFactor + ' = ' + result + ' ' + toSymbol
      }

      if (toFactor === 1) {
        return value + ' ' + fromSymbol + ' × ' + fromFactor + ' = ' + result + ' ' + toSymbol
      }

      return value + ' ' + fromSymbol + ' × (' + fromFactor + ' ÷ ' + toFactor + ') = ' + result + ' ' + toSymbol
    },

    // ============================================
    // 温度换算公式
    // ============================================
    _getTemperatureFormula: function (value, fromUnit, toUnit, fromSymbol, toSymbol, result) {
      var formulas = {
        'c_f': value + ' °C × 9/5 + 32 = ' + result + ' °F',
        'c_k': value + ' °C + 273.15 = ' + result + ' K',
        'c_re': value + ' °C × 4/5 = ' + result + ' °Ré',
        'f_c': '(' + value + ' °F - 32) × 5/9 = ' + result + ' °C',
        'f_k': '(' + value + ' °F - 32) × 5/9 + 273.15 = ' + result + ' K',
        'f_re': '(' + value + ' °F - 32) × 4/9 = ' + result + ' °Ré',
        'k_c': value + ' K - 273.15 = ' + result + ' °C',
        'k_f': '(' + value + ' K - 273.15) × 9/5 + 32 = ' + result + ' °F',
        'k_re': '(' + value + ' K - 273.15) × 4/5 = ' + result + ' °Ré',
        're_c': value + ' °Ré × 5/4 = ' + result + ' °C',
        're_f': value + ' °Ré × 9/4 + 32 = ' + result + ' °F',
        're_k': value + ' °Ré × 5/4 + 273.15 = ' + result + ' K'
      }

      var key = fromUnit + '_' + toUnit
      if (fromUnit === toUnit) {
        return value + ' ' + fromSymbol + ' = ' + result + ' ' + toSymbol + '（相同单位）'
      }

      return formulas[key] || value + ' ' + fromSymbol + ' → ' + result + ' ' + toSymbol
    },

    // ============================================
    // 智能识别输入
    // 识别如 "100cm", "5kg", "3.5m" 等格式
    // ============================================
    smartDetect: function (input) {
      if (!input || typeof input !== 'string') return null

      input = input.trim()
      if (!input) return null

      // 匹配模式: 数值 + 单位符号
      // 支持: 100cm, 5.5kg, 3.14m, 1000mm, 1.5km, 100°C, 100℉ 等
      var patterns = [
        // 温度特殊处理 (°C, °F, K)
        { regex: /^(-?\d+(?:\.\d+)?)\s*°?([CFK])$/, category: 'temperature', unitMap: { 'C': 'c', 'F': 'f', 'K': 'k' } },
        { regex: /^(-?\d+(?:\.\d+)?)\s*°[Rr][ée]/, category: 'temperature', unitKey: 're' },

        // 长度单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*km$/, category: 'length', unitKey: 'km' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*m$/, category: 'length', unitKey: 'm' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*cm$/, category: 'length', unitKey: 'cm' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*mm$/, category: 'length', unitKey: 'mm' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*ft$/, category: 'length', unitKey: 'ft' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*in$/, category: 'length', unitKey: 'in' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*yd$/, category: 'length', unitKey: 'yd' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*里$/, category: 'length', unitKey: 'li' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*丈$/, category: 'length', unitKey: 'zhang' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*尺$/, category: 'length', unitKey: 'chi' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*寸$/, category: 'length', unitKey: 'cun' },

        // 重量单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*t$/, category: 'weight', unitKey: 't' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kg$/, category: 'weight', unitKey: 'kg' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*g$/, category: 'weight', unitKey: 'g' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*mg$/, category: 'weight', unitKey: 'mg' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*lb$/, category: 'weight', unitKey: 'lb' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*oz$/, category: 'weight', unitKey: 'oz' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*斤$/, category: 'weight', unitKey: 'jin' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*两$/, category: 'weight', unitKey: 'liang' },

        // 面积单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*km2$/, category: 'area', unitKey: 'km2' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*m2$/, category: 'area', unitKey: 'm2' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*cm2$/, category: 'area', unitKey: 'cm2' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*亩$/, category: 'area', unitKey: 'mu' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*ha$/, category: 'area', unitKey: 'ha' },

        // 体积单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*L$/, category: 'volume', unitKey: 'L' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*mL$/, category: 'volume', unitKey: 'mL' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*gal$/, category: 'volume', unitKey: 'gal' },

        // 数据单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*B$/, category: 'data', unitKey: 'B' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*KB$/, category: 'data', unitKey: 'KB' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*MB$/, category: 'data', unitKey: 'MB' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*GB$/, category: 'data', unitKey: 'GB' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*TB$/, category: 'data', unitKey: 'TB' },

        // 速度单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*km\/h$/, category: 'speed', unitKey: 'kmh' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*m\/s$/, category: 'speed', unitKey: 'ms' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*mph$/, category: 'speed', unitKey: 'mph' },

        // 时间单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*h$/, category: 'time', unitKey: 'h' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*min$/, category: 'time', unitKey: 'min' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*s$/, category: 'time', unitKey: 's' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*ms$/, category: 'time', unitKey: 'ms' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*d$/, category: 'time', unitKey: 'd' },

        // 压力单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*Pa$/, category: 'pressure', unitKey: 'Pa' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kPa$/, category: 'pressure', unitKey: 'kPa' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*MPa$/, category: 'pressure', unitKey: 'MPa' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*bar$/, category: 'pressure', unitKey: 'bar' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*psi$/, category: 'pressure', unitKey: 'psi' },

        // 能量单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*J$/, category: 'energy', unitKey: 'J' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kJ$/, category: 'energy', unitKey: 'kJ' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kWh$/, category: 'energy', unitKey: 'kWh' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*cal$/, category: 'energy', unitKey: 'cal' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kcal$/, category: 'energy', unitKey: 'kcal' },

        // 功率单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*W$/, category: 'power', unitKey: 'W' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*kW$/, category: 'power', unitKey: 'kW' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*hp$/, category: 'power', unitKey: 'hp' },

        // 角度单位
        { regex: /^(-?\d+(?:\.\d+)?)\s*°$/, category: 'angle', unitKey: 'deg' },
        { regex: /^(-?\d+(?:\.\d+)?)\s*rad$/, category: 'angle', unitKey: 'rad' }
      ]

      for (var i = 0; i < patterns.length; i++) {
        var match = input.match(patterns[i].regex)
        if (match) {
          var result = {
            value: parseFloat(match[1]),
            category: patterns[i].category
          }

          if (patterns[i].unitMap) {
            result.unitKey = patterns[i].unitMap[match[2]] || match[2].toLowerCase()
          } else {
            result.unitKey = patterns[i].unitKey
          }

          return result
        }
      }

      return null
    },

    // ============================================
    // 格式化结果
    // 处理科学计数法、大数/小数
    // ============================================
    formatResult: function (value, precision) {
      if (value === null || value === undefined || isNaN(value)) return '—'

      precision = (precision !== undefined && precision !== null) ? precision : Config.DEFAULTS.precision

      // 处理无穷大
      if (!isFinite(value)) {
        return value > 0 ? '∞' : '-∞'
      }

      // 处理极小值（接近0）
      if (Math.abs(value) < 1e-15) {
        return '0'
      }

      // 处理极大或极小的值，使用科学计数法
      var absVal = Math.abs(value)
      if ((absVal >= 1e15 || (absVal < 1e-10 && absVal > 0)) && precision > 0) {
        return value.toExponential(precision)
      }

      // 正常格式化
      var result = value.toFixed(precision)

      // 移除多余的尾随零（但保留至少1位小数）
      if (precision > 0) {
        result = result.replace(/\.?0+$/, '')
        // 如果小数点后没有数字，补回 .0
        if (result.indexOf('.') === -1 && precision > 0) {
          result = result + '.' + '0'.repeat(Math.min(precision, 1))
        }
      }

      // 添加千位分隔符（整数部分）
      var parts = result.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      result = parts.join('.')

      return result
    },

    // ============================================
    // 获取类别的基准单位
    // ============================================
    getBaseUnit: function (category) {
      var catData = Data[category]
      if (!catData) return null
      return {
        key: catData.base,
        label: catData.baseLabel
      }
    }
  }

  // 暴露到全局
  global.ConverterEngine = ConverterEngine

})(typeof window !== 'undefined' ? window : this)