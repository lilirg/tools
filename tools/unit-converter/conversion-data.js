/**
 * Unit Converter - 换算关系数据
 * 所有类别的单位定义和换算关系
 */
;(function (global) {
  'use strict'

  var ConversionData = {
    // ============================================
    // 长度 (Length) - 基准: 米 (m)
    // ============================================
    length: {
      base: 'm',
      baseLabel: '米',
      units: {
        km:  { name: '千米', symbol: 'km', factor: 1000 },
        m:   { name: '米', symbol: 'm', factor: 1 },
        dm:  { name: '分米', symbol: 'dm', factor: 0.1 },
        cm:  { name: '厘米', symbol: 'cm', factor: 0.01 },
        mm:  { name: '毫米', symbol: 'mm', factor: 0.001 },
        um:  { name: '微米', symbol: 'µm', factor: 0.000001 },
        nm:  { name: '纳米', symbol: 'nm', factor: 1e-9 },
        mi:  { name: '英里', symbol: 'mi', factor: 1609.344 },
        ft:  { name: '英尺', symbol: 'ft', factor: 0.3048 },
        in:  { name: '英寸', symbol: 'in', factor: 0.0254 },
        yd:  { name: '码', symbol: 'yd', factor: 0.9144 },
        nmi: { name: '海里', symbol: 'nmi', factor: 1852 },
        li:  { name: '里', symbol: '里', factor: 500 },
        zhang: { name: '丈', symbol: '丈', factor: 10 / 3 },
        chi: { name: '尺', symbol: '尺', factor: 1 / 3 },
        cun: { name: '寸', symbol: '寸', factor: 1 / 30 }
      }
    },

    // ============================================
    // 重量/质量 (Weight) - 基准: 克 (g)
    // ============================================
    weight: {
      base: 'g',
      baseLabel: '克',
      units: {
        t:     { name: '吨', symbol: 't', factor: 1000000 },
        kg:    { name: '千克', symbol: 'kg', factor: 1000 },
        g:     { name: '克', symbol: 'g', factor: 1 },
        mg:    { name: '毫克', symbol: 'mg', factor: 0.001 },
        ug:    { name: '微克', symbol: 'µg', factor: 0.000001 },
        lb:    { name: '磅', symbol: 'lb', factor: 453.59237 },
        oz:    { name: '盎司', symbol: 'oz', factor: 28.349523125 },
        ct:    { name: '克拉', symbol: 'ct', factor: 0.2 },
        jin:   { name: '斤', symbol: '斤', factor: 500 },
        liang: { name: '两', symbol: '两', factor: 50 }
      }
    },

    // ============================================
    // 温度 (Temperature) - 特殊公式
    // ============================================
    temperature: {
      base: 'c',
      baseLabel: '摄氏度',
      units: {
        c:   { name: '摄氏度', symbol: '°C', formula: 'direct' },
        f:   { name: '华氏度', symbol: '°F', formula: 'fahrenheit' },
        k:   { name: '开尔文', symbol: 'K', formula: 'kelvin' },
        re:  { name: '列氏度', symbol: '°Ré', formula: 'reaumur' }
      }
    },

    // ============================================
    // 面积 (Area) - 基准: 平方米 (m²)
    // ============================================
    area: {
      base: 'm2',
      baseLabel: '平方米',
      units: {
        km2:   { name: '平方千米', symbol: 'km²', factor: 1000000 },
        m2:    { name: '平方米', symbol: 'm²', factor: 1 },
        dm2:   { name: '平方分米', symbol: 'dm²', factor: 0.01 },
        cm2:   { name: '平方厘米', symbol: 'cm²', factor: 0.0001 },
        mm2:   { name: '平方毫米', symbol: 'mm²', factor: 0.000001 },
        ha:    { name: '公顷', symbol: 'ha', factor: 10000 },
        mu:    { name: '亩', symbol: '亩', factor: 2000 / 3 },
        ft2:   { name: '平方英尺', symbol: 'ft²', factor: 0.09290304 },
        in2:   { name: '平方英寸', symbol: 'in²', factor: 0.00064516 },
        acre:  { name: '英亩', symbol: 'acre', factor: 4046.8564224 }
      }
    },

    // ============================================
    // 体积/容积 (Volume) - 基准: 升 (L)
    // ============================================
    volume: {
      base: 'L',
      baseLabel: '升',
      units: {
        m3:  { name: '立方米', symbol: 'm³', factor: 1000 },
        L:   { name: '升', symbol: 'L', factor: 1 },
        dL:  { name: '分升', symbol: 'dL', factor: 0.1 },
        cL:  { name: '厘升', symbol: 'cL', factor: 0.01 },
        mL:  { name: '毫升', symbol: 'mL', factor: 0.001 },
        gal: { name: '加仑', symbol: 'gal', factor: 3.785411784 },
        qt:  { name: '夸脱', symbol: 'qt', factor: 0.946352946 },
        pt:  { name: '品脱', symbol: 'pt', factor: 0.473176473 },
        ft3: { name: '立方英尺', symbol: 'ft³', factor: 28.316846592 },
        in3: { name: '立方英寸', symbol: 'in³', factor: 0.016387064 }
      }
    },

    // ============================================
    // 数据存储 (Data) - 基准: 字节 (B)
    // ============================================
    data: {
      base: 'B',
      baseLabel: '字节',
      units: {
        bit: { name: '位', symbol: 'bit', factor: 0.125 },
        B:   { name: '字节', symbol: 'B', factor: 1 },
        KB:  { name: '千字节', symbol: 'KB', factor: 1024 },
        MB:  { name: '兆字节', symbol: 'MB', factor: 1048576 },
        GB:  { name: '吉字节', symbol: 'GB', factor: 1073741824 },
        TB:  { name: '太字节', symbol: 'TB', factor: 1099511627776 },
        PB:  { name: '拍字节', symbol: 'PB', factor: 1125899906842624 },
        Kb:  { name: '千比特', symbol: 'Kb', factor: 128 },
        Mb:  { name: '兆比特', symbol: 'Mb', factor: 131072 },
        Gb:  { name: '吉比特', symbol: 'Gb', factor: 134217728 }
      }
    },

    // ============================================
    // 速度 (Speed) - 基准: 米/秒 (m/s)
    // ============================================
    speed: {
      base: 'ms',
      baseLabel: '米/秒',
      units: {
        ms:   { name: '米/秒', symbol: 'm/s', factor: 1 },
        kmh:  { name: '千米/小时', symbol: 'km/h', factor: 1 / 3.6 },
        mph:  { name: '英里/小时', symbol: 'mph', factor: 0.44704 },
        kn:   { name: '节', symbol: 'kn', factor: 0.514444 },
        mach: { name: '马赫', symbol: 'Mach', factor: 340.3 },
        c:    { name: '光速', symbol: 'c', factor: 299792458 }
      }
    },

    // ============================================
    // 时间 (Time) - 基准: 秒 (s)
    // ============================================
    time: {
      base: 's',
      baseLabel: '秒',
      units: {
        yr:  { name: '年', symbol: 'yr', factor: 31536000 },
        mo:  { name: '月', symbol: 'mo', factor: 2592000 },
        wk:  { name: '周', symbol: 'wk', factor: 604800 },
        d:   { name: '天', symbol: 'd', factor: 86400 },
        h:   { name: '小时', symbol: 'h', factor: 3600 },
        min: { name: '分钟', symbol: 'min', factor: 60 },
        s:   { name: '秒', symbol: 's', factor: 1 },
        ms:  { name: '毫秒', symbol: 'ms', factor: 0.001 },
        us:  { name: '微秒', symbol: 'µs', factor: 0.000001 }
      }
    },

    // ============================================
    // 角度 (Angle) - 基准: 度 (°)
    // ============================================
    angle: {
      base: 'deg',
      baseLabel: '度',
      units: {
        deg:  { name: '度', symbol: '°', factor: 1 },
        rad:  { name: '弧度', symbol: 'rad', factor: 180 / Math.PI },
        grad: { name: '百分度', symbol: 'grad', factor: 0.9 },
        turn: { name: '圈', symbol: 'turn', factor: 360 }
      }
    },

    // ============================================
    // 压力 (Pressure) - 基准: 帕斯卡 (Pa)
    // ============================================
    pressure: {
      base: 'Pa',
      baseLabel: '帕斯卡',
      units: {
        Pa:   { name: '帕斯卡', symbol: 'Pa', factor: 1 },
        kPa:  { name: '千帕', symbol: 'kPa', factor: 1000 },
        MPa:  { name: '兆帕', symbol: 'MPa', factor: 1000000 },
        bar:  { name: '巴', symbol: 'bar', factor: 100000 },
        atm:  { name: '标准大气压', symbol: 'atm', factor: 101325 },
        mmHg: { name: '毫米汞柱', symbol: 'mmHg', factor: 133.322 },
        psi:  { name: '磅力/平方英寸', symbol: 'psi', factor: 6894.757 }
      }
    },

    // ============================================
    // 能量 (Energy) - 基准: 焦耳 (J)
    // ============================================
    energy: {
      base: 'J',
      baseLabel: '焦耳',
      units: {
        J:   { name: '焦耳', symbol: 'J', factor: 1 },
        kJ:  { name: '千焦', symbol: 'kJ', factor: 1000 },
        cal: { name: '卡路里', symbol: 'cal', factor: 4.184 },
        kcal: { name: '千卡', symbol: 'kcal', factor: 4184 },
        kWh: { name: '千瓦时', symbol: 'kWh', factor: 3600000 },
        eV:  { name: '电子伏特', symbol: 'eV', factor: 1.602176634e-19 },
        BTU: { name: '英热单位', symbol: 'BTU', factor: 1055.06 }
      }
    },

    // ============================================
    // 功率 (Power) - 基准: 瓦特 (W)
    // ============================================
    power: {
      base: 'W',
      baseLabel: '瓦特',
      units: {
        W:    { name: '瓦特', symbol: 'W', factor: 1 },
        kW:   { name: '千瓦', symbol: 'kW', factor: 1000 },
        MW:   { name: '兆瓦', symbol: 'MW', factor: 1000000 },
        hp:   { name: '马力', symbol: 'hp', factor: 745.699872 },
        BTUh: { name: '英热单位/小时', symbol: 'BTU/h', factor: 0.293071 }
      }
    }
  }

  // 暴露到全局
  global.ConversionData = ConversionData

})(typeof window !== 'undefined' ? window : this)