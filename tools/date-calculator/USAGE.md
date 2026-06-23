# 📅 日期时间计算器

纯前端日期时间计算工具，基于 dayjs 构建，提供日期差计算、日期加减、工作日计算、年龄计算、时间戳转换、时区转换、节假日查询等功能。

## 功能特性

### 1. 日期计算
- **日期差计算** - 计算两个日期之间的年/月/日/时/分/秒差值，以及总天数/总小时数
- **日期加减** - 在基准日期上加减指定数量的天/周/月/年
- **工作日计算** - 计算两个日期之间的工作日天数（排除周末）
- **年龄计算** - 精确到天的年龄计算，显示下一个生日倒计时

### 2. 时间戳转换
- **时间戳 → 日期** - 支持秒级和毫秒级时间戳，多种格式展示
- **日期 → 时间戳** - 将日期时间转换为秒级和毫秒级时间戳

### 3. 时区转换
- 支持 20 个主要时区
- 显示源时区和目标时区的时间对比
- 显示时差信息

### 4. 节假日查询
- 2024-2026 年中国法定节假日数据
- 节假日列表展示
- 日期判断（是否为节假日/工作日，含调休）
- 下一个节假日查询

## 使用方法

### 直接打开
在浏览器中打开 `index.html` 即可使用。

### 模块引用

```html
<!-- 引入 dayjs 及插件 -->
<script src="./node_modules/dayjs/dayjs.min.js"></script>
<script src="./node_modules/dayjs/plugin/utc.js"></script>
<script src="./node_modules/dayjs/plugin/timezone.js"></script>
<script src="./node_modules/dayjs/plugin/customParseFormat.js"></script>
<script src="./node_modules/dayjs/plugin/advancedFormat.js"></script>
<script src="./node_modules/dayjs/plugin/isLeapYear.js"></script>
<script src="./node_modules/dayjs/plugin/isBetween.js"></script>
<script src="./node_modules/dayjs/plugin/duration.js"></script>
<script src="./node_modules/dayjs/plugin/relativeTime.js"></script>
<script>
  dayjs.extend(dayjs_plugin_utc)
  dayjs.extend(dayjs_plugin_timezone)
  dayjs.extend(dayjs_plugin_customParseFormat)
  dayjs.extend(dayjs_plugin_advancedFormat)
  dayjs.extend(dayjs_plugin_isLeapYear)
  dayjs.extend(dayjs_plugin_isBetween)
  dayjs.extend(dayjs_plugin_duration)
  dayjs.extend(dayjs_plugin_relativeTime)
</script>

<!-- 引入工具模块 -->
<script src="./config.js"></script>
<script src="./date-engine.js"></script>
<script src="./holiday-data.js"></script>
<script src="./app.js"></script>
```

## API 参考

### DateCalcConfig (`config.js`)

全局配置对象，包含：
- `DEFAULTS` - 默认配置（日期格式、时区、最大历史记录数）
- `DATE_FORMATS` - 预设日期格式列表
- `TIMEZONES` - 时区列表
- `TIMEZONE_OFFSETS` - 时区偏移量映射
- `UNITS` - 单位映射
- `MAX_HISTORY` - 最大历史记录数

### DateEngine (`date-engine.js`)

日期计算引擎，提供以下方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `dateDiff(date1, date2)` | 计算日期差 | date1, date2: Date/string/number | { years, months, days, hours, minutes, seconds, totalDays, totalHours, totalMinutes, totalSeconds } |
| `dateAdd(date, amount, unit)` | 日期加减 | date: Date/string, amount: number, unit: 'day'/'week'/'month'/'year' | dayjs 对象 |
| `businessDaysDiff(start, end)` | 工作日计算 | start, end: Date/string | number |
| `timestampToDate(timestamp, isMs)` | 时间戳转日期 | timestamp: number, isMs: boolean | { date, formats: {...} } |
| `dateToTimestamp(date)` | 日期转时间戳 | date: Date/string | { seconds, milliseconds } |
| `timezoneConvert(date, fromZone, toZone)` | 时区转换 | date: Date/string, fromZone: string, toZone: string | { sourceDate, targetDate, sourceFormatted, targetFormatted, offsetHours } |
| `ageCalculate(birthDate, referenceDate?)` | 年龄计算 | birthDate: Date/string, referenceDate?: Date/string | { years, months, days, totalDays, nextBirthday, daysToNextBirthday } |
| `timeDuration(startTime, endTime)` | 时间段计算 | startTime, endTime: 'HH:mm' 或 'HH:mm:ss' | { hours, minutes, seconds, totalMinutes, totalSeconds } |
| `isLeapYear(year)` | 闰年判断 | year: number | boolean |
| `daysInMonth(year, month)` | 获取月天数 | year: number, month: number (1-12) | number |
| `formatDate(date, format)` | 日期格式化 | date: Date/string, format: string | string |

### HolidayData (`holiday-data.js`)

节假日数据模块，提供以下方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getHolidaysByYear(year)` | 获取年份节假日列表 | year: number | Array |
| `getWorkdaysByYear(year)` | 获取调休工作日列表 | year: number | Array |
| `isHoliday(date)` | 判断是否为节假日 | date: Date/string | { isHoliday, name, holiday } |
| `isWorkday(date)` | 判断是否为工作日 | date: Date/string | { isWorkday, isWeekend, isHoliday, name } |
| `getNextHoliday(date)` | 获取下一个节假日 | date: Date/string | { name, date, daysLeft, holiday } |
| `getHolidayName(key)` | 获取节假日名称 | key: string | string |
| `getAvailableYears()` | 获取可用年份列表 | - | Array |

## 技术栈

- **dayjs** - 轻量级日期处理库
- **原生 JavaScript** - 零外部依赖（除 dayjs）
- **IIFE 模块模式** - 所有模块使用 IIFE 模式
- **'use strict'** - 严格模式
- **localStorage** - 历史记录持久化

## 浏览器兼容性

- IE 10+
- Chrome / Firefox / Safari / Edge

## 文件结构

```
tools/date-calculator/
├── config.js          # 配置模块
├── date-engine.js     # 日期计算引擎
├── holiday-data.js    # 节假日数据
├── app.js             # UI 交互层
├── index.html         # 工具页面
├── USAGE.md           # 使用文档
├── package.json       # npm 配置
└── node_modules/      # dayjs 依赖
    └── dayjs/
        ├── dayjs.min.js
        └── plugin/
            ├── utc.js
            ├── timezone.js
            ├── customParseFormat.js
            ├── advancedFormat.js
            ├── isLeapYear.js
            ├── isBetween.js
            ├── duration.js
            └── relativeTime.js