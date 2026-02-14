// TickDB Demo #2 - Ticker + KLine Panel
console.log("TickDB Demo #2 - Ticker + KLine Panel");

// 全局状态
let isRefreshing = false;
let currentData = [];
let tickerBySymbol = {}; // 按 symbol 索引的 ticker 数据
let autoRefreshTimer = null;
let countdownTimer = null;
let nextRefreshTime = null;
let watchlist = []; // 自选列表
let currentFilter = 'ALL'; // 当前市场筛选
let currentSearch = ''; // 当前搜索关键词

// Demo #2 新增状态
let selectedSymbol = null; // 当前选中的 symbol
let detailInterval = '1d'; // 当前选中的时间周期（默认 1 天）
let klineByKey = {}; // K 线数据缓存 key = symbol@interval
let klineLoadingByKey = {}; // K 线加载状态
let klineErrorByKey = {}; // K 线错误信息
let chartInstance = null; // 图表实例
let candlestickSeries = null; // 蜡烛图系列
let klineLoadedCountByKey = {}; // 记录每个 key 已加载的总数

// K 线预加载配置
const KLINE_CONFIG = {
  initialLoad: 50,        // 首次加载数量（可见 2/3 + 备用 1/3）
  batchLoad: 20,          // 每次预加载数量
  triggerRatio: 0.5       // 触发预加载的比例（备用数据的一半进入可见区域时）
};

// 候选 symbols（按市场分类）
const CANDIDATE_SYMBOLS = {
  "外汇": [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", 
    "USDCHF", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY"
  ],
  "贵金属": [
    "XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD"
  ],
  "美股": [
    "AAPL.US", "MSFT.US", "GOOGL.US", "AMZN.US", "TSLA.US", 
    "NVDA.US", "META.US", "NFLX.US", "AMD.US", "INTC.US"
  ],
  "港股": [
    "700.HK", "9988.HK", "0005.HK", "0941.HK", "1810.HK", 
    "2318.HK", "0388.HK", "1299.HK", "2020.HK", "3690.HK"
  ],
  "A股": [
    "600118.SH", "601698.SH", "688981.SH", "600030.SH", "600519.SH",
    "000001.SZ", "000002.SZ", "000333.SZ", "000063.SZ", "000858.SZ",
    "688008.SH", "688012.SH", "688385.SH", "688111.SH", "688256.SH",
    "300750.SZ", "300760.SZ", "300059.SZ", "300274.SZ", "300308.SZ",
  ],
  "加密货币": [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"
  ]
};

// localStorage 键名
const STORAGE_KEY = 'tickdb_watchlist';

// Mock 数据（Step 1 用）
// 使用白天交易时间（下午 2:30 左右）
const getMockTimestamp = () => {
  const now = new Date();
  now.setHours(14, 30, 0, 0);
  return now.getTime();
};

const mockData = [
  {
    symbol: "EURUSD",
    last_price: 1.0875,
    price_change_24h: -0.0023,
    price_change_percent_24h: -0.21,
    high_24h: 1.0905,
    low_24h: 1.0860,
    volume_24h: 0,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "GBPUSD",
    last_price: 1.2734,
    price_change_24h: 0.0045,
    price_change_percent_24h: 0.35,
    high_24h: 1.2755,
    low_24h: 1.2680,
    volume_24h: 0,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "XAUUSD",
    last_price: 2045.80,
    price_change_24h: 12.30,
    price_change_percent_24h: 0.60,
    high_24h: 2050.00,
    low_24h: 2032.00,
    volume_24h: 0,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "XAGUSD",
    last_price: 23.45,
    price_change_24h: -0.28,
    price_change_percent_24h: -1.18,
    high_24h: 23.85,
    low_24h: 23.30,
    volume_24h: 0,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "US500",
    last_price: 4783.20,
    price_change_24h: 15.60,
    price_change_percent_24h: 0.33,
    high_24h: 4795.00,
    low_24h: 4765.00,
    volume_24h: 0,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "AAPL.US",
    last_price: 178.25,
    price_change_24h: -2.15,
    price_change_percent_24h: -1.19,
    high_24h: 180.50,
    low_24h: 177.80,
    volume_24h: 52000000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "TSLA.US",
    last_price: 248.50,
    price_change_24h: 8.75,
    price_change_percent_24h: 3.65,
    high_24h: 250.20,
    low_24h: 239.00,
    volume_24h: 98000000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "700.HK",
    last_price: 328.60,
    price_change_24h: 5.40,
    price_change_percent_24h: 1.67,
    high_24h: 330.00,
    low_24h: 322.00,
    volume_24h: 18500000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "9988.HK",
    last_price: 78.50,
    price_change_24h: -1.20,
    price_change_percent_24h: -1.51,
    high_24h: 80.00,
    low_24h: 77.80,
    volume_24h: 25000000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "000001.SH",
    last_price: 2978.50,
    price_change_24h: -12.30,
    price_change_percent_24h: -0.41,
    high_24h: 2995.00,
    low_24h: 2970.00,
    volume_24h: 285000000000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "BTCUSDT",
    last_price: 43250.50,
    price_change_24h: 1250.30,
    price_change_percent_24h: 2.98,
    high_24h: 43800.00,
    low_24h: 41500.00,
    volume_24h: 28500000000,
    timestamp: getMockTimestamp()
  },
  {
    symbol: "ETHUSDT",
    last_price: 2280.40,
    price_change_24h: -45.60,
    price_change_percent_24h: -1.96,
    high_24h: 2350.00,
    low_24h: 2265.00,
    volume_24h: 12800000000,
    timestamp: getMockTimestamp()
  }
];

// 获取 Ticker 数据
async function fetchTicker(symbols) {
  if (isRefreshing) {
    console.log('请求进行中，跳过本次刷新');
    return null;
  }
  
  isRefreshing = true;
  const startTime = performance.now();
  
  try {
    // 检查配置
    if (!window.TICKDB_CONFIG || !window.TICKDB_CONFIG.API_KEY) {
      throw new Error('请先配置 API Key（复制 config.example.js 为 config.js 并填入 API Key）');
    }
    
    const { BASE_URL, API_KEY } = window.TICKDB_CONFIG;
    const symbolsStr = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const url = `${BASE_URL}/v1/market/ticker?symbols=${encodeURIComponent(symbolsStr)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    // 检查业务错误码
    if (result.code !== 0) {
      throw new Error(`API Error (code ${result.code}): ${result.message || '未知错误'}`);
    }
    
    // 转换数据格式（容错映射：支持多种字段名）
    const normalizedData = (result.data || []).map(item => ({
      symbol: item.symbol,
      last_price: parseFloat(item.last_price || item.price) || 0,
      price_change_24h: parseFloat(item.price_change_24h || item.change) || 0,
      price_change_percent_24h: parseFloat(item.price_change_percent_24h || item.change_percent) || 0,
      high_24h: parseFloat(item.high_24h || item.high) || 0,
      low_24h: parseFloat(item.low_24h || item.low) || 0,
      volume_24h: parseFloat(item.volume_24h || item.volume) || 0,
      timestamp: item.timestamp || Date.now()
    }));
    
    return {
      data: normalizedData,
      latency
    };
    
  } catch (error) {
    console.error('Fetch error:', error);
    
    // 显示错误
    showError(error.message);
    
    return null;
  } finally {
    isRefreshing = false;
  }
}

// 获取 K 线数据
async function fetchKLine(symbol, interval, limit = 50, startTime = null, endTime = null, silent = false) {
  const key = `${symbol}@${interval}`;
  
  // 设置加载状态（只在非静默模式下）
  if (!silent) {
    klineLoadingByKey[key] = true;
    delete klineErrorByKey[key];
    updateKLineUI();
  }
  
  try {
    // 检查配置
    if (!window.TICKDB_CONFIG || !window.TICKDB_CONFIG.API_KEY) {
      throw new Error('请先配置 API Key');
    }
    
    const { BASE_URL, API_KEY } = window.TICKDB_CONFIG;
    
    // 构建 URL
    let url = `${BASE_URL}/v1/market/kline?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
    if (startTime) {
      url += `&start_time=${startTime}`;
    }
    if (endTime) {
      url += `&end_time=${endTime}`;
    }
    
    console.log('Fetching KLine:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      },
      signal: AbortSignal.timeout(15000) // 15秒超时
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 检查业务错误码
    if (result.code !== 0) {
      throw new Error(`API Error (code ${result.code}): ${result.message || '未知错误'}`);
    }
    
    // 转换数据格式（注意：data.klines 是数组）
    const rawKlines = result.data?.klines || [];
    const klineData = rawKlines.map(item => {
      const open = parseFloat(item.open);
      const high = parseFloat(item.high);
      const low = parseFloat(item.low);
      const close = parseFloat(item.close);
      const time = Math.floor(item.time / 1000);
      
      // 验证数据有效性
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(time)) {
        console.warn('无效的 K 线数据:', item);
        return null;
      }
      
      // 验证价格逻辑
      if (high < low || open <= 0 || close <= 0) {
        console.warn('K 线数据逻辑错误:', item);
        return null;
      }
      
      return {
        time: time,
        open: open,
        high: high,
        low: low,
        close: close
      };
    }).filter(item => item !== null); // 过滤掉无效数据
    
    // 按时间升序排序（Lightweight Charts 要求）
    klineData.sort((a, b) => a.time - b.time);
    
    console.log(`K 线数据转换完成: ${key}, 原始 ${rawKlines.length} 条, 有效 ${klineData.length} 条`);
    if (klineData.length > 0) {
      console.log('第一条数据:', klineData[0]);
      console.log('最后一条数据:', klineData[klineData.length - 1]);
    }
    
    // 如果是追加历史数据
    if (startTime && endTime && klineByKey[key]) {
      // 合并数据（去重）
      const existingData = klineByKey[key];
      const mergedData = [...klineData, ...existingData];
      
      // 去重并排序
      const uniqueData = Array.from(
        new Map(mergedData.map(item => [item.time, item])).values()
      ).sort((a, b) => a.time - b.time);
      
      klineByKey[key] = uniqueData;
      console.log(`合并历史数据: ${key}, 总计 ${uniqueData.length} 条`);
    } else {
      // 缓存数据
      klineByKey[key] = klineData;
    }
    
    if (!silent) {
      klineLoadingByKey[key] = false;
    }
    
    console.log(`K 线数据加载成功: ${key}, ${klineData.length} 条`);
    
    // 更新 UI
    if (!silent) {
      updateKLineUI();
    }
    
    return klineData;
    
  } catch (error) {
    console.error('K 线加载失败:', error);
    
    // 只在非静默模式下设置错误状态
    if (!silent) {
      klineLoadingByKey[key] = false;
      klineErrorByKey[key] = error.message;
      updateKLineUI();
    } else {
      console.warn('K 线预加载失败（不影响显示）:', error.message);
    }
    
    return null;
  }
}

// 获取最新 K 线数据（当前正在形成的K线）
async function fetchLatestKLine(symbol, interval) {
  try {
    // 检查配置
    if (!window.TICKDB_CONFIG || !window.TICKDB_CONFIG.API_KEY) {
      throw new Error('请先配置 API Key');
    }
    
    const { BASE_URL, API_KEY } = window.TICKDB_CONFIG;
    
    // 构建 URL
    const url = `${BASE_URL}/v1/market/kline/latest?symbols=${encodeURIComponent(symbol)}&interval=${interval}`;
    
    console.log('Fetching Latest KLine:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 检查业务错误码
    if (result.code !== 0) {
      throw new Error(`API Error (code ${result.code}): ${result.message || '未知错误'}`);
    }
    
    // 解析数据（注意：返回的是数组，需要找到对应的symbol）
    const dataArray = result.data || [];
    const symbolData = dataArray.find(item => item.symbol === symbol);
    
    if (!symbolData || !symbolData.klines || symbolData.klines.length === 0) {
      console.warn('未找到最新K线数据:', symbol);
      return null;
    }
    
    // 转换数据格式
    const rawKline = symbolData.klines[0];
    const latestKline = {
      time: Math.floor(rawKline.time / 1000),
      open: parseFloat(rawKline.open),
      high: parseFloat(rawKline.high),
      low: parseFloat(rawKline.low),
      close: parseFloat(rawKline.close)
    };
    
    console.log('最新K线数据:', latestKline);
    return latestKline;
    
  } catch (error) {
    console.error('最新K线加载失败:', error);
    return null;
  }
}

// 显示错误
function showError(message) {
  const errorEl = document.getElementById('errorCode');
  
  // 友好的错误提示
  let friendlyMessage = message;
  let hint = '';
  
  // 根据 TickDB 错误码提供友好提示
  if (message.includes('1001')) {
    hint = '💡 API Key 无效或已过期，请检查 config.js 或重新获取';
  } else if (message.includes('1002')) {
    hint = '💡 未提供 API Key，请在 config.js 中配置';
  } else if (message.includes('1003')) {
    hint = '💡 IP 不在白名单，请联系管理员添加';
  } else if (message.includes('1004')) {
    hint = '💡 权限不足，请升级套餐或联系管理员';
  } else if (message.includes('2001')) {
    hint = '💡 参数错误，请检查请求参数格式';
  } else if (message.includes('2002')) {
    hint = '💡 交易品种不存在，请使用 /v1/symbols/available 查询可用品种';
  } else if (message.includes('2003')) {
    hint = '💡 时间范围无效，请检查 start_time/end_time 参数';
  } else if (message.includes('2004')) {
    hint = '💡 请求数量超限，请减少 symbols 数量（最多 50 个）';
  } else if (message.includes('3001')) {
    hint = '💡 请求频率超限，请降低刷新频率或稍后重试';
  } else if (message.includes('3002')) {
    hint = '💡 配额已用尽，请等待配额重置或升级套餐';
  } else if (message.includes('3003')) {
    hint = '💡 连接数超限，请关闭多余连接';
  } else if (message.includes('3004')) {
    hint = '💡 订阅数超限，请取消部分订阅';
  } else if (message.includes('5000')) {
    hint = '💡 服务器内部错误，请稍后重试';
  } else if (message.includes('5001')) {
    hint = '💡 数据源不可用，请稍后重试';
  } else if (message.includes('5002')) {
    hint = '💡 服务暂时不可用，可能正在维护';
  } else if (message.includes('401') || message.includes('403')) {
    hint = '💡 认证失败，请检查 API Key 是否正确';
  } else if (message.includes('404')) {
    hint = '💡 接口不存在，请检查 BASE_URL 配置';
  } else if (message.includes('429')) {
    hint = '💡 请求过于频繁，请降低刷新频率';
  } else if (message.includes('500') || message.includes('502') || message.includes('503')) {
    hint = '💡 服务器错误，请稍后重试';
  } else if (message.includes('timeout') || message.includes('超时')) {
    hint = '💡 请求超时，请检查网络连接';
  } else if (message.includes('Failed to fetch') || message.includes('网络')) {
    hint = '💡 网络连接失败，请检查网络或 CORS 配置';
  } else if (message.includes('API Key')) {
    hint = '💡 请检查 config.js 中的 API_KEY 是否正确配置';
  }
  
  errorEl.innerHTML = `❌ ${friendlyMessage}${hint ? '<br><span style="font-size:12px;color:#666;">' + hint + '</span>' : ''}`;
  errorEl.style.color = '#dc2626';
  
  // 更新 API 状态
  const statusEl = document.getElementById('apiStatus');
  statusEl.innerHTML = 'API 状态: <span class="status-error">错误</span>';
  
  // 10秒后清除错误提示
  setTimeout(() => {
    errorEl.innerHTML = '';
  }, 10000);
}

// 清除错误
function clearError() {
  const errorEl = document.getElementById('errorCode');
  errorEl.textContent = '';
  
  const statusEl = document.getElementById('apiStatus');
  statusEl.innerHTML = 'API 状态: <span class="status-ok">正常</span>';
}

// 判断 symbol 所属市场
function getMarket(symbol) {
  if (symbol.endsWith('.US')) return 'US';
  if (symbol.endsWith('.HK')) return 'HK';
  if (symbol.endsWith('.SH') || symbol.endsWith('.SZ')) return 'CN';
  if (symbol.endsWith('USDT') || symbol.endsWith('USDC')) return 'CRYPTO';
  if (symbol.startsWith('XAU') || symbol.startsWith('XAG') || symbol.startsWith('XPT') || symbol.startsWith('XPD')) return 'METALS';
  // 外汇：6位字母，如 EURUSD
  if (/^[A-Z]{6}$/.test(symbol)) return 'FOREX';
  return 'OTHER';
}

// 过滤自选列表
function getFilteredWatchlist() {
  let filtered = watchlist;
  
  // 市场筛选
  if (currentFilter !== 'ALL') {
    filtered = filtered.filter(symbol => getMarket(symbol) === currentFilter);
  }
  
  // 搜索过滤
  if (currentSearch) {
    const search = currentSearch.toUpperCase();
    filtered = filtered.filter(symbol => symbol.toUpperCase().includes(search));
  }
  
  return filtered;
}

// 渲染表格
function renderTable(data) {
  const tbody = document.getElementById('tickerTableBody');
  tbody.innerHTML = '';
  
  if (watchlist.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#999;">自选列表为空，请点击"管理自选"添加</td></tr>';
    return;
  }
  
  // 获取过滤后的自选列表
  const filteredWatchlist = getFilteredWatchlist();
  
  if (filteredWatchlist.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#999;">没有符合条件的 Symbol</td></tr>';
    return;
  }
  
  // 按过滤后的列表顺序渲染
  filteredWatchlist.forEach(symbol => {
    // 从 currentData 中查找对应数据
    const item = currentData.find(d => d.symbol === symbol);
    
    const row = document.createElement('tr');
    row.onclick = () => selectSymbol(symbol); // 添加点击事件
    
    if (item) {
      // 有数据，正常渲染
      const changeClass = item.price_change_24h >= 0 ? 'price-positive' : 'price-negative';
      const changeSign = item.price_change_24h >= 0 ? '+' : '';
      const time = new Date(item.timestamp).toLocaleTimeString('zh-CN');
      
      row.innerHTML = `
        <td class="symbol-cell">${item.symbol}</td>
        <td>${formatPrice(item.last_price)}</td>
        <td class="${changeClass}">${changeSign}${formatPrice(item.price_change_24h)}</td>
        <td class="${changeClass}">${changeSign}${formatNumber(item.price_change_percent_24h, 2)}%</td>
        <td>${formatPrice(item.high_24h)}</td>
        <td>${formatPrice(item.low_24h)}</td>
        <td>${formatVolume(item.volume_24h)}</td>
        <td>${time}</td>
        <td><button class="btn-remove" onclick="event.stopPropagation(); removeSymbol('${item.symbol}')">×</button></td>
      `;
    } else {
      // 没有数据，显示占位
      row.innerHTML = `
        <td class="symbol-cell">${symbol}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><button class="btn-remove" onclick="event.stopPropagation(); removeSymbol('${symbol}')">×</button></td>
      `;
      row.style.opacity = '0.5';
    }
    
    tbody.appendChild(row);
  });
}

// 渲染简化列表
function renderCompactList() {
  const container = document.getElementById('compactList');
  container.innerHTML = '';
  
  const filteredWatchlist = getFilteredWatchlist();
  
  filteredWatchlist.forEach(symbol => {
    const item = tickerBySymbol[symbol];
    
    if (!item) return;
    
    const div = document.createElement('div');
    div.className = 'compact-item';
    if (symbol === selectedSymbol) {
      div.classList.add('active');
    }
    div.onclick = () => selectSymbol(symbol);
    
    const changeClass = item.price_change_24h >= 0 ? 'price-positive' : 'price-negative';
    const changeSign = item.price_change_24h >= 0 ? '+' : '';
    
    div.innerHTML = `
      <div class="compact-symbol">${symbol}</div>
      <div class="compact-price">${formatPrice(item.last_price)}</div>
      <div class="compact-change ${changeClass}">${changeSign}${formatNumber(item.price_change_percent_24h, 2)}%</div>
    `;
    
    container.appendChild(div);
  });
}

// 选中 symbol
function selectSymbol(symbol) {
  console.log('选中 symbol:', symbol);
  
  selectedSymbol = symbol;
  
  // 切换布局
  switchToDetailView();
  
  // 渲染详情
  renderTickerSnapshot();
  renderCompactList();
  
  // 加载 K 线数据
  ensureKLineData(symbol, detailInterval);
}

// 收起详情
function collapseDetail() {
  selectedSymbol = null;
  switchToFullView();
}

// 切换到详情视图
function switchToDetailView() {
  document.getElementById('tickerTable').style.display = 'none';
  document.getElementById('compactList').style.display = 'block';
  document.getElementById('tickerMaster').classList.add('compact');
  document.getElementById('klineDetailPanel').style.display = 'flex';
  document.getElementById('btnCollapseDetail').style.display = 'flex';
}

// 切换到全宽视图
function switchToFullView() {
  document.getElementById('tickerTable').style.display = 'table';
  document.getElementById('compactList').style.display = 'none';
  document.getElementById('tickerMaster').classList.remove('compact');
  document.getElementById('klineDetailPanel').style.display = 'none';
  document.getElementById('btnCollapseDetail').style.display = 'none';
}

// 渲染行情快照
function renderTickerSnapshot() {
  if (!selectedSymbol) return;
  
  const item = tickerBySymbol[selectedSymbol];
  if (!item) return;
  
  const changeClass = item.price_change_24h >= 0 ? 'price-positive' : 'price-negative';
  const changeSign = item.price_change_24h >= 0 ? '+' : '';
  
  const html = `
    <div class="snapshot-grid">
      <div class="snapshot-item">
        <div class="snapshot-label">产品代码</div>
        <div class="snapshot-value snapshot-symbol">${item.symbol}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">最新价</div>
        <div class="snapshot-value">${formatPrice(item.last_price)}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">涨跌额</div>
        <div class="snapshot-value ${changeClass}">${changeSign}${formatPrice(item.price_change_24h)}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">涨跌幅</div>
        <div class="snapshot-value ${changeClass}">${changeSign}${formatNumber(item.price_change_percent_24h, 2)}%</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">24h 高</div>
        <div class="snapshot-value">${formatPrice(item.high_24h)}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">24h 低</div>
        <div class="snapshot-value">${formatPrice(item.low_24h)}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">24h 量</div>
        <div class="snapshot-value">${formatVolume(item.volume_24h)}</div>
      </div>
      <div class="snapshot-item">
        <div class="snapshot-label">更新时间</div>
        <div class="snapshot-value" style="font-size:13px;">${new Date(item.timestamp).toLocaleTimeString('zh-CN')}</div>
      </div>
    </div>
    <div class="interval-selector">
      <label>时间粒度:</label>
      <select id="intervalSelect" onchange="onIntervalChange(this.value)">
        <option value="1m" ${detailInterval === '1m' ? 'selected' : ''}>1分钟</option>
        <option value="5m" ${detailInterval === '5m' ? 'selected' : ''}>5分钟</option>
        <option value="15m" ${detailInterval === '15m' ? 'selected' : ''}>15分钟</option>
        <option value="1h" ${detailInterval === '1h' ? 'selected' : ''}>1小时</option>
        <option value="1d" ${detailInterval === '1d' ? 'selected' : ''}>1天</option>
      </select>
    </div>
  `;
  
  document.getElementById('tickerSnapshot').innerHTML = html;
}

// 确保 K 线数据已加载
function ensureKLineData(symbol, interval) {
  const key = `${symbol}@${interval}`;
  
  // 如果已有缓存，直接渲染
  if (klineByKey[key]) {
    console.log('使用缓存的 K 线数据:', key);
    updateKLineUI();
    
    // 异步获取最新K线并更新（静默失败，不影响显示）
    fetchLatestKLine(symbol, interval).then(latestKline => {
      if (latestKline && klineByKey[key]) {
        const existingData = klineByKey[key];
        const existingIndex = existingData.findIndex(item => item.time === latestKline.time);
        
        if (existingIndex >= 0) {
          existingData[existingIndex] = latestKline;
          console.log('更新缓存中的最新K线');
        } else {
          existingData.push(latestKline);
          existingData.sort((a, b) => a.time - b.time);
          console.log('添加新K线到缓存');
        }
        
        updateKLineUI();
      }
    }).catch(err => {
      console.warn('获取最新K线失败（不影响显示）:', err.message);
      // 静默失败，不影响已有的K线显示
    });
    
    return;
  }
  
  // 如果正在加载，跳过
  if (klineLoadingByKey[key]) {
    console.log('K 线数据加载中:', key);
    return;
  }
  
  // 首次加载：加载配置的数量（包含可见区域 2/3 + 备用 1/3）
  console.log(`首次加载 K 线数据: ${key}, 数量: ${KLINE_CONFIG.initialLoad}`);
  klineLoadedCountByKey[key] = KLINE_CONFIG.initialLoad;
  
  // 异步加载历史数据
  (async () => {
    try {
      // 加载历史数据
      const historyData = await fetchKLine(symbol, interval, KLINE_CONFIG.initialLoad);
      
      // 历史数据加载成功后，尝试获取最新K线（但不阻塞显示）
      if (historyData && historyData.length > 0) {
        // 异步获取最新K线，失败也不影响
        fetchLatestKLine(symbol, interval).then(latestKline => {
          if (latestKline && klineByKey[key]) {
            const existingData = klineByKey[key];
            const existingIndex = existingData.findIndex(item => item.time === latestKline.time);
            
            if (existingIndex >= 0) {
              existingData[existingIndex] = latestKline;
              console.log('更新最新K线:', latestKline);
            } else {
              existingData.push(latestKline);
              existingData.sort((a, b) => a.time - b.time);
              console.log('添加最新K线:', latestKline);
            }
            
            updateKLineUI();
          }
        }).catch(err => {
          console.warn('获取最新K线失败（不影响显示）:', err.message);
          // 静默失败
        });
      }
    } catch (err) {
      console.error('加载历史K线数据失败:', err);
      // 历史数据加载失败才显示错误
    }
  })();
}

// 更新 K 线 UI
function updateKLineUI() {
  if (!selectedSymbol) return;
  
  const key = `${selectedSymbol}@${detailInterval}`;
  
  const loadingEl = document.getElementById('klineLoading');
  const errorEl = document.getElementById('klineError');
  const chartEl = document.getElementById('klineChart');
  
  // 显示加载状态
  if (klineLoadingByKey[key]) {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    chartEl.style.display = 'none';
    return;
  }
  
  // 显示错误
  if (klineErrorByKey[key]) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = `加载失败: ${klineErrorByKey[key]}`;
    chartEl.style.display = 'none';
    return;
  }
  
  // 显示图表
  const klineData = klineByKey[key];
  if (klineData && klineData.length > 0) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    chartEl.style.display = 'block';
    renderKLineChart(klineData);
  } else {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = '暂无数据';
    chartEl.style.display = 'none';
  }
}

// 渲染 K 线图表
function renderKLineChart(data) {
  console.log('renderKLineChart 被调用, 数据条数:', data.length);
  
  const chartEl = document.getElementById('klineChart');
  
  if (!chartEl) {
    console.error('图表容器不存在');
    return;
  }
  
  console.log('图表容器尺寸:', chartEl.clientWidth, 'x', chartEl.clientHeight);
  
  // 如果图表实例不存在，创建
  if (!chartInstance) {
    console.log('创建新的图表实例');
    chartInstance = LightweightCharts.createChart(chartEl, {
      width: chartEl.clientWidth,
      height: chartEl.clientHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });
    
    // 监听时间轴变化，实现历史数据预加载
    // 使用防抖避免频繁触发
    let debounceTimer = null;
    chartInstance.timeScale().subscribeVisibleLogicalRangeChange(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadMoreHistoricalData();
      }, 300); // 300ms 防抖
    });
    
    // 响应式调整 - 保持可见范围并检查是否需要预加载
    const resizeObserver = new ResizeObserver(entries => {
      if (chartInstance && chartEl) {
        // 保存当前的可见范围
        const currentRange = chartInstance.timeScale().getVisibleLogicalRange();
        
        // 更新图表尺寸
        chartInstance.applyOptions({ 
          width: chartEl.clientWidth,
          height: chartEl.clientHeight
        });
        
        // 恢复可见范围（保持相同的K线数量可见）
        if (currentRange) {
          chartInstance.timeScale().setVisibleLogicalRange(currentRange);
          
          // 检查是否需要预加载（窗口变大后，buffer 可能不足）
          setTimeout(() => {
            loadMoreHistoricalData();
          }, 100);
        }
      }
    });
    resizeObserver.observe(chartEl);
    
    window.addEventListener('resize', () => {
      if (chartInstance && chartEl) {
        // 保存当前的可见范围
        const currentRange = chartInstance.timeScale().getVisibleLogicalRange();
        
        // 更新图表尺寸
        chartInstance.applyOptions({ 
          width: chartEl.clientWidth,
          height: chartEl.clientHeight
        });
        
        // 恢复可见范围
        if (currentRange) {
          chartInstance.timeScale().setVisibleLogicalRange(currentRange);
          
          // 检查是否需要预加载
          setTimeout(() => {
            loadMoreHistoricalData();
          }, 100);
        }
      }
    });
  }
  
  // 设置数据
  console.log('设置图表数据...');
  candlestickSeries.setData(data);
  
  // 设置可见范围：只显示最右侧的 50 根（2/3），左侧 25 根作为 buffer
  if (data.length >= KLINE_CONFIG.initialLoad) {
    // 计算可见范围：从第 25 根开始（索引 24）到最后
    const visibleFrom = KLINE_CONFIG.initialLoad / 3; // 25
    const visibleTo = data.length - 1;
    
    console.log(`设置可见范围: 从索引 ${visibleFrom} 到 ${visibleTo} (共 ${visibleTo - visibleFrom + 1} 根)`);
    
    chartInstance.timeScale().setVisibleLogicalRange({
      from: visibleFrom,
      to: visibleTo
    });
  } else {
    // 数据不足时，显示所有数据
    chartInstance.timeScale().fitContent();
  }
  
  console.log('图表渲染完成');
}

// 加载更多历史数据
let isLoadingMore = false;
let lastPreloadTime = 0; // 记录上次预加载时间，避免频繁触发
async function loadMoreHistoricalData() {
  if (!selectedSymbol || !detailInterval || isLoadingMore) return;
  
  const key = `${selectedSymbol}@${detailInterval}`;
  const currentData = klineByKey[key];
  
  if (!currentData || currentData.length === 0) return;
  
  // 至少要有初始加载的数据量才开始预加载
  if (currentData.length < KLINE_CONFIG.initialLoad) {
    console.log('数据量不足，跳过预加载');
    return;
  }
  
  // 防止频繁触发（至少间隔 2 秒）
  const now = Date.now();
  if (now - lastPreloadTime < 2000) {
    return;
  }
  
  // 获取当前可见范围
  const visibleRange = chartInstance.timeScale().getVisibleLogicalRange();
  if (!visibleRange) return;
  
  // 计算左侧 buffer 的数量
  const leftBufferCount = visibleRange.from;
  
  // 计算触发阈值：当左侧 buffer 少于 12.5 根时触发
  const minBufferCount = KLINE_CONFIG.initialLoad / 3 * KLINE_CONFIG.triggerRatio; // 12.5
  
  console.log(`检查预加载条件: 左侧buffer=${leftBufferCount.toFixed(2)}根, 最小要求=${minBufferCount.toFixed(2)}根`);
  
  // 如果左侧 buffer 不足，触发预加载
  if (leftBufferCount < minBufferCount) {
    console.log(`触发历史数据预加载: buffer不足`);
    
    lastPreloadTime = now;
    
    // 预加载下一批数据
    await preloadHistoricalData(selectedSymbol, detailInterval, KLINE_CONFIG.batchLoad);
  }
}

// 预加载历史数据
async function preloadHistoricalData(symbol, interval, count) {
  if (isLoadingMore) return;
  
  const key = `${symbol}@${interval}`;
  const currentData = klineByKey[key];
  
  if (!currentData || currentData.length === 0) return;
  
  isLoadingMore = true;
  
  try {
    // 获取最早的数据时间（秒级时间戳）
    const earliestTimeSec = currentData[0].time;
    const earliestTimeMs = earliestTimeSec * 1000; // 转换为毫秒
    console.log('当前最早数据时间:', earliestTimeSec, '=', new Date(earliestTimeMs).toISOString());
    
    // 计算时间间隔（毫秒）
    const intervalMs = getIntervalMilliseconds(interval);
    console.log('时间间隔:', intervalMs, 'ms =', intervalMs / 1000 / 60 / 60, '小时');
    
    // 计算要加载的时间范围（毫秒级时间戳，API 需要）
    // end_time = 最早数据的时间（不包含，所以减去 1 个间隔）
    // start_time = end_time - (间隔 * 数量)
    const endTime = earliestTimeMs - intervalMs; // 往前推一个间隔（毫秒）
    const startTime = endTime - (intervalMs * (count - 1)); // 再往前推 count-1 个间隔（毫秒）
    
    console.log(`预加载 ${count} 根历史数据: ${symbol}@${interval}`);
    console.log(`时间范围: ${new Date(startTime).toISOString()} ~ ${new Date(endTime).toISOString()}`);
    console.log(`start_time: ${startTime} (毫秒), end_time: ${endTime} (毫秒)`);
    
    // 验证时间范围
    if (startTime >= endTime) {
      console.error('时间范围错误: start_time >= end_time');
      return;
    }
    
    if (endTime > Date.now()) {
      console.error('end_time 是未来时间，跳过预加载');
      return;
    }
    
    // 加载历史数据（传入毫秒级时间戳，使用静默模式）
    const newData = await fetchKLine(symbol, interval, count, startTime, endTime, true);
    
    if (newData && newData.length > 0) {
      // 更新已加载计数
      klineLoadedCountByKey[key] = (klineLoadedCountByKey[key] || 0) + newData.length;
      console.log(`${key} 总计已加载: ${klineLoadedCountByKey[key]} 根`);
      
      // 静默模式下需要手动更新UI
      updateKLineUI();
    }
  } catch (error) {
    console.warn('预加载历史数据失败（不影响显示）:', error.message);
  } finally {
    isLoadingMore = false;
  }
}

// 获取时间间隔的毫秒数
function getIntervalMilliseconds(interval) {
  const map = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  return map[interval] || 60 * 1000;
}

// 格式化价格
function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return '-';
  // 外汇和小数值：保留 4 位小数
  if (price < 10) return price.toFixed(4);
  // 中等价格：保留 2 位小数
  if (price < 1000) return price.toFixed(2);
  // 大数值：保留 2 位小数
  return price.toFixed(2);
}

// 格式化数字
function formatNumber(num, decimals = 2) {
  if (num === 0 || num === null || num === undefined) return '-';
  return num.toFixed(decimals);
}

// 格式化成交量
function formatVolume(volume) {
  if (!volume || volume === 0) return '-';
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
  return volume.toFixed(0);
}

// 更新状态信息
function updateStatus(latency = null) {
  const now = new Date().toLocaleTimeString('zh-CN');
  document.getElementById('lastUpdate').textContent = `上次更新: ${now}`;
  
  if (latency !== null) {
    document.getElementById('latency').textContent = `延迟: ${latency}ms`;
  }
}

// 更新倒计时
function updateCountdown() {
  if (!nextRefreshTime) return;
  
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((nextRefreshTime - now) / 1000));
  
  const latencyEl = document.getElementById('latency');
  const currentText = latencyEl.textContent;
  
  // 保留延迟信息，添加倒计时
  if (currentText.includes('延迟:')) {
    const latencyPart = currentText.split('|')[0].trim();
    latencyEl.textContent = `${latencyPart} | 下次: ${remaining}s`;
  } else {
    latencyEl.textContent = `下次刷新: ${remaining}s`;
  }
}

// 手动刷新
async function manualRefresh() {
  console.log('手动刷新');
  
  if (watchlist.length === 0) {
    showError('自选列表为空，请先添加 Symbol');
    return;
  }
  
  const result = await fetchTicker(watchlist);
  
  if (result) {
    // 更新 currentData：合并新数据，保留旧数据
    result.data.forEach(newItem => {
      const index = currentData.findIndex(d => d.symbol === newItem.symbol);
      if (index >= 0) {
        currentData[index] = newItem;
      } else {
        currentData.push(newItem);
      }
      
      // 同时更新 tickerBySymbol
      tickerBySymbol[newItem.symbol] = newItem;
    });
    
    // 根据当前视图渲染
    if (selectedSymbol) {
      renderCompactList();
      renderTickerSnapshot();
      
      // 刷新当前显示的 K 线数据
      refreshCurrentKLine();
    } else {
      renderTable(currentData);
    }
    
    updateStatus(result.latency);
    clearError();
    
    // 如果自动刷新开启，重置倒计时
    if (document.getElementById('autoRefresh').checked) {
      scheduleNextRefresh();
    }
  } else {
    // 请求失败，仍然渲染现有数据
    if (selectedSymbol) {
      renderCompactList();
    } else {
      renderTable(currentData);
    }
  }
}

// 刷新当前显示的 K 线数据
async function refreshCurrentKLine() {
  if (!selectedSymbol || !detailInterval) return;
  
  const key = `${selectedSymbol}@${detailInterval}`;
  
  console.log('刷新 K 线数据:', key);
  
  // 尝试获取最新K线（静默失败）
  try {
    const latestKline = await fetchLatestKLine(selectedSymbol, detailInterval);
    
    if (latestKline && klineByKey[key]) {
      // 合并最新K线到现有数据
      const existingData = klineByKey[key];
      
      // 检查最新K线是否已存在（通过时间戳判断）
      const existingIndex = existingData.findIndex(item => item.time === latestKline.time);
      
      if (existingIndex >= 0) {
        // 更新现有K线
        existingData[existingIndex] = latestKline;
        console.log('更新现有K线:', latestKline);
      } else {
        // 添加新K线
        existingData.push(latestKline);
        existingData.sort((a, b) => a.time - b.time);
        console.log('添加新K线:', latestKline);
      }
      
      // 更新UI
      updateKLineUI();
    }
  } catch (err) {
    console.warn('刷新最新K线失败（不影响显示）:', err.message);
    // 静默失败，不影响已有的K线显示
  }
}

// 自动刷新
async function autoRefresh() {
  await manualRefresh();
  scheduleNextRefresh();
}

// 调度下一次刷新
function scheduleNextRefresh() {
  // 清除旧的定时器
  if (autoRefreshTimer) {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  
  // 检查是否开启自动刷新
  const autoRefreshEnabled = document.getElementById('autoRefresh').checked;
  if (!autoRefreshEnabled) {
    document.getElementById('latency').textContent = document.getElementById('latency').textContent.split('|')[0].trim();
    return;
  }
  
  // 获取刷新间隔
  const interval = parseInt(document.getElementById('refreshInterval').value) * 1000;
  
  // 设置下次刷新时间
  nextRefreshTime = Date.now() + interval;
  
  // 启动倒计时显示
  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
  
  // 调度下次刷新
  autoRefreshTimer = setTimeout(autoRefresh, interval);
}

// 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  nextRefreshTime = null;
  
  // 清除倒计时显示
  const latencyEl = document.getElementById('latency');
  const currentText = latencyEl.textContent;
  if (currentText.includes('|')) {
    latencyEl.textContent = currentText.split('|')[0].trim();
  }
}

// 移除 symbol
function removeSymbol(symbol) {
  console.log('Remove:', symbol);
  
  if (!confirm(`确定要移除 ${symbol} 吗？`)) {
    return;
  }
  
  // 从自选列表中移除
  watchlist = watchlist.filter(s => s !== symbol);
  
  // 保存到 localStorage
  saveWatchlist();
  
  // 重新渲染表格
  currentData = currentData.filter(item => item.symbol !== symbol);
  renderTable(currentData);
  
  // 如果列表为空，停止自动刷新
  if (watchlist.length === 0) {
    document.getElementById('autoRefresh').checked = false;
    stopAutoRefresh();
    showError('自选列表已清空');
  }
}

// 加载自选列表
function loadWatchlist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      watchlist = JSON.parse(saved);
      console.log('从 localStorage 加载自选:', watchlist);
    } else {
      // 使用默认列表
      watchlist = window.TICKDB_CONFIG?.DEFAULT_SYMBOLS || [
        "EURUSD", "GBPUSD", "XAUUSD", "XAGUSD",
        "AAPL.US", "TSLA.US", "700.HK", "9988.HK", "000001.SH",
        "BTCUSDT", "ETHUSDT"
      ];
      console.log('使用默认自选:', watchlist);
      saveWatchlist();
    }
  } catch (error) {
    console.error('加载自选列表失败:', error);
    watchlist = [];
  }
}

// 保存自选列表
function saveWatchlist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    console.log('保存自选到 localStorage:', watchlist);
  } catch (error) {
    console.error('保存自选列表失败:', error);
  }
}

// 打开自选管理弹窗
function openWatchlistModal() {
  const modal = document.getElementById('watchlistModal');
  modal.classList.add('show');
  renderCandidateList();
}

// 关闭自选管理弹窗
function closeWatchlistModal() {
  const modal = document.getElementById('watchlistModal');
  modal.classList.remove('show');
}

// 渲染候选列表
function renderCandidateList() {
  const container = document.getElementById('candidateList');
  container.innerHTML = '';
  
  // 按分类渲染
  Object.keys(CANDIDATE_SYMBOLS).forEach(category => {
    // 分类标题
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = category;
    container.appendChild(categoryTitle);
    
    // 分类下的 symbols
    const categoryGrid = document.createElement('div');
    categoryGrid.className = 'category-grid';
    
    CANDIDATE_SYMBOLS[category].forEach(symbol => {
      const item = document.createElement('div');
      item.className = 'candidate-item';
      item.textContent = symbol;
      
      // 检查是否已添加
      if (watchlist.includes(symbol)) {
        item.classList.add('added');
        item.title = '已添加';
      } else {
        item.onclick = () => addSymbol(symbol);
        item.title = '点击添加';
      }
      
      categoryGrid.appendChild(item);
    });
    
    container.appendChild(categoryGrid);
  });
}

// 添加 symbol
function addSymbol(symbol) {
  if (watchlist.includes(symbol)) {
    return;
  }
  
  watchlist.push(symbol);
  saveWatchlist();
  renderCandidateList();
  
  console.log('添加 symbol:', symbol);
  
  // 立即渲染（先显示占位）
  renderTable(currentData);
  
  // 然后刷新数据
  manualRefresh();
}

// 导出 CSV
function exportCSV() {
  if (watchlist.length === 0) {
    alert('自选列表为空，无法导出');
    return;
  }
  
  // 获取过滤后的自选列表
  const filteredWatchlist = getFilteredWatchlist();
  
  if (filteredWatchlist.length === 0) {
    alert('当前筛选条件下没有数据，无法导出');
    return;
  }
  
  // CSV 表头
  const headers = [
    'Symbol',
    'Last Price',
    'Change 24h',
    'Change % 24h',
    'High 24h',
    'Low 24h',
    'Volume 24h',
    'Timestamp',
    'Time'
  ];
  
  // CSV 数据行
  const rows = filteredWatchlist.map(symbol => {
    const item = currentData.find(d => d.symbol === symbol);
    
    if (item) {
      return [
        item.symbol,
        item.last_price || '',
        item.price_change_24h || '',
        item.price_change_percent_24h || '',
        item.high_24h || '',
        item.low_24h || '',
        item.volume_24h || '',
        item.timestamp || '',
        new Date(item.timestamp).toLocaleString('zh-CN')
      ];
    } else {
      return [symbol, '', '', '', '', '', '', '', ''];
    }
  });
  
  // 组装 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 生成文件名：tickdb-ticker-YYYYMMDD-HHMMSS.csv
  const now = new Date();
  const filename = `tickdb-ticker-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.csv`;
  
  // 下载
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  console.log('导出 CSV:', filename);
}

// 按钮事件
document.addEventListener('DOMContentLoaded', () => {
  // 加载自选列表
  loadWatchlist();
  
  // 初始化：先渲染自选列表（即使没数据也显示占位）
  renderTable(currentData);
  
  // 如果配置了 API Key，自动加载真实数据
  if (!window.TICKDB_CONFIG || !window.TICKDB_CONFIG.API_KEY || window.TICKDB_CONFIG.API_KEY === 'YOUR_API_KEY') {
    console.log('未配置 API Key');
    showError('请配置 API Key 以使用真实数据（复制 config.example.js 为 config.js）');
  } else {
    // 自动加载真实数据并启动自动刷新
    if (watchlist.length > 0) {
      autoRefresh();
    } else {
      showError('自选列表为空，请点击"管理自选"添加 Symbol');
    }
  }
  
  // 手动刷新按钮
  document.getElementById('btnManualRefresh').addEventListener('click', manualRefresh);
  
  // 管理自选按钮
  document.getElementById('btnManageWatchlist').addEventListener('click', openWatchlistModal);
  
  // 导出 CSV 按钮
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  
  // 搜索框
  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    console.log('搜索:', currentSearch);
    if (selectedSymbol) {
      renderCompactList();
    } else {
      renderTable(currentData);
    }
  });
  
  // 市场筛选
  document.getElementById('marketFilter').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    console.log('市场筛选:', currentFilter);
    if (selectedSymbol) {
      renderCompactList();
    } else {
      renderTable(currentData);
    }
  });
  
  // 自动刷新开关
  document.getElementById('autoRefresh').addEventListener('change', (e) => {
    console.log('自动刷新:', e.target.checked);
    if (e.target.checked) {
      scheduleNextRefresh();
    } else {
      stopAutoRefresh();
    }
  });
  
  // 刷新间隔
  document.getElementById('refreshInterval').addEventListener('change', (e) => {
    console.log('刷新间隔:', e.target.value);
    // 如果自动刷新开启，重新调度
    if (document.getElementById('autoRefresh').checked) {
      scheduleNextRefresh();
    }
  });
  
  // 点击弹窗背景关闭
  document.getElementById('watchlistModal').addEventListener('click', (e) => {
    if (e.target.id === 'watchlistModal') {
      closeWatchlistModal();
    }
  });
});

// 时间粒度切换处理函数（全局函数，供 HTML 调用）
function onIntervalChange(interval) {
  // 更新 detailInterval
  detailInterval = interval;
  
  // 加载 K 线数据
  if (selectedSymbol) {
    ensureKLineData(selectedSymbol, interval);
  }
}
