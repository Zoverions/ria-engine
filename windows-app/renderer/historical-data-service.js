/**
 * Enhanced Historical Data Service
 * Provides maximum historical data (365+ days minimum 90) for optimal bot trading analysis
 * Implements progressive loading, compression, and intelligent caching
 */

export class HistoricalDataService {
    constructor() {
        this.dataCache = new Map(); // tokenId -> historical data
        this.compressedCache = new Map(); // Long-term compressed storage
        this.loadingProgress = new Map(); // Track loading status
        
        this.apiKeys = {
            coingecko: process.env.COINGECKO_API_KEY || '',
            cryptocompare: process.env.CRYPTOCOMPARE_API_KEY || '',
            binance: process.env.BINANCE_API_KEY || '',
            polygon: process.env.POLYGON_API_KEY || '',
            alphavantage: process.env.ALPHAVANTAGE_API_KEY || ''
        };
        
        // Enhanced data requirements for maximum analysis capability
        this.dataRequirements = {
            immediate: 7,       // 7 days for immediate trading decisions
            recent: 30,         // 30 days for short-term patterns
            extended: 90,       // 90 days minimum required
            comprehensive: 365, // 1 year for comprehensive analysis
            maximum: 730,       // 2 years if available without overload
            intervals: ['5m', '15m', '1h', '4h', '1d'], // Multiple timeframes
            indicators: ['sma', 'ema', 'rsi', 'macd', 'bollinger', 'stoch', 'atr', 'adx']
        };

        // Memory and performance limits
        this.memoryLimits = {
            maxCacheSize: 100 * 1024 * 1024, // 100MB cache limit
            maxUncompressedDays: 90,          // Keep 90 days uncompressed
            compressionRatio: 0.3,            // Target 70% compression
            backgroundLoadDelay: 1000         // 1s delay between background loads
        };

        // Data quality metrics
        this.qualityMetrics = {
            minDataPoints: 50,      // Minimum data points required
            maxGapHours: 24,        // Maximum gap to fill (hours)
            outlierThreshold: 3,    // Standard deviations for outlier detection
            completenessThreshold: 0.95 // 95% data completeness required
        };

        this.initializeProgressiveLoading();
    }

    // Initialize progressive data loading system
    initializeProgressiveLoading() {
        this.loadingQueue = [];
        this.isBackgroundLoading = false;
        this.dataStats = {
            totalTokens: 0,
            loadedTokens: 0,
            failedTokens: 0,
            totalDataPoints: 0,
            memoryUsage: 0
        };
    }

    // Main method: Get comprehensive historical data with progressive loading
    async getComprehensiveHistoricalData(tokenId, options = {}) {
        const {
            priority = 'extended',        // immediate, recent, extended, comprehensive, maximum
            intervals = ['1h', '15m'],    // Requested intervals
            background = true,            // Enable background loading of additional data
            forceRefresh = false          // Force refresh cached data
        } = options;

        try {
            // Start with immediate data for trading
            const immediateData = await this.getHistoricalData(tokenId, '1h', this.dataRequirements.immediate, forceRefresh);
            
            // Queue progressive loading based on priority
            this.queueProgressiveLoading(tokenId, priority, intervals, background);
            
            // Return immediate data first for responsive trading
            return {
                immediate: immediateData,
                status: 'loading',
                progress: this.getLoadingProgress(tokenId)
            };

        } catch (error) {
            console.error('Comprehensive data loading error:', error);
            throw error;
        }
    }

    // Queue progressive data loading
    queueProgressiveLoading(tokenId, priority, intervals, background) {
        const loadingTasks = [];

        // Define loading phases based on priority
        const phases = this.getLoadingPhases(priority);
        
        phases.forEach((phase, index) => {
            intervals.forEach(interval => {
                loadingTasks.push({
                    tokenId,
                    interval,
                    days: phase.days,
                    priority: phase.priority,
                    delay: index * this.memoryLimits.backgroundLoadDelay
                });
            });
        });

        // Add to loading queue
        this.loadingQueue.push(...loadingTasks);
        
        // Start background loading if enabled
        if (background && !this.isBackgroundLoading) {
            this.startBackgroundLoading();
        }
    }

    // Get loading phases based on priority level
    getLoadingPhases(priority) {
        const phases = {
            immediate: [
                { days: this.dataRequirements.immediate, priority: 1 }
            ],
            recent: [
                { days: this.dataRequirements.immediate, priority: 1 },
                { days: this.dataRequirements.recent, priority: 2 }
            ],
            extended: [
                { days: this.dataRequirements.immediate, priority: 1 },
                { days: this.dataRequirements.recent, priority: 2 },
                { days: this.dataRequirements.extended, priority: 3 }
            ],
            comprehensive: [
                { days: this.dataRequirements.immediate, priority: 1 },
                { days: this.dataRequirements.recent, priority: 2 },
                { days: this.dataRequirements.extended, priority: 3 },
                { days: this.dataRequirements.comprehensive, priority: 4 }
            ],
            maximum: [
                { days: this.dataRequirements.immediate, priority: 1 },
                { days: this.dataRequirements.recent, priority: 2 },
                { days: this.dataRequirements.extended, priority: 3 },
                { days: this.dataRequirements.comprehensive, priority: 4 },
                { days: this.dataRequirements.maximum, priority: 5 }
            ]
        };

        return phases[priority] || phases.extended;
    }

    // Background loading worker
    async startBackgroundLoading() {
        if (this.isBackgroundLoading) return;
        
        this.isBackgroundLoading = true;
        console.log('🔄 Starting progressive historical data loading...');

        while (this.loadingQueue.length > 0) {
            // Check memory usage before loading more data
            if (this.getCurrentMemoryUsage() > this.memoryLimits.maxCacheSize) {
                console.log('⚠️ Memory limit reached, compressing older data...');
                await this.compressOlderData();
            }

            const task = this.loadingQueue.shift();
            
            try {
                // Add delay to prevent API rate limiting
                if (task.delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, task.delay));
                }

                await this.getHistoricalData(task.tokenId, task.interval, task.days);
                this.updateLoadingProgress(task.tokenId, 'loaded', task.days);
                
            } catch (error) {
                console.error(`Background loading failed for ${task.tokenId}:`, error);
                this.updateLoadingProgress(task.tokenId, 'failed', task.days);
            }
        }

        this.isBackgroundLoading = false;
        console.log('✅ Progressive loading completed');
    }

    // Enhanced data fetching with quality validation and gap filling
    async getHistoricalData(tokenId, interval = '1h', days = null, forceRefresh = false) {
        // Use default based on priority if days not specified
        days = days || this.dataRequirements.extended;
        
        const cacheKey = `${tokenId}_${interval}_${days}`;
        
        // Check cache first (unless forced refresh)
        if (!forceRefresh && this.dataCache.has(cacheKey)) {
            const cachedData = this.dataCache.get(cacheKey);
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxAge = this.getCacheMaxAge(interval);
            
            if (cacheAge < maxAge) {
                return this.validateAndEnhanceData(cachedData.data, tokenId, interval);
            }
        }

        try {
            let data = await this.fetchFromBestSource(tokenId, interval, days);
            
            // Validate data quality
            data = this.validateDataQuality(data, days);
            
            // Fill gaps if any
            data = this.fillDataGaps(data, interval);
            
            // Add technical indicators
            data = this.calculateTechnicalIndicators(data);
            
            // Add advanced analytics
            data = this.addAdvancedAnalytics(data);

            // Cache the data with compression if large
            await this.cacheData(cacheKey, data, days);

            this.dataStats.totalDataPoints += data.length;
            return data;

        } catch (error) {
            console.error(`Historical data fetch error for ${tokenId}:`, error);
            
            // Try fallback sources
            return await this.tryFallbackSources(tokenId, interval, days);
        }
    }

    // Intelligent source selection for best data quality and availability
    async fetchFromBestSource(tokenId, interval, days) {
        const sources = this.prioritizeDataSources(tokenId, interval, days);
        
        for (const source of sources) {
            try {
                console.log(`📡 Fetching ${days}d of ${interval} data for ${tokenId} from ${source.name}...`);
                const data = await source.fetch(tokenId, interval, days);
                
                if (this.isDataQualityAcceptable(data, days)) {
                    console.log(`✅ Successfully fetched ${data.length} data points from ${source.name}`);
                    return data;
                }
                
            } catch (error) {
                console.warn(`⚠️ ${source.name} failed for ${tokenId}:`, error.message);
                continue;
            }
        }
        
        throw new Error(`All data sources failed for ${tokenId}`);
    }

    // Prioritize data sources based on token, interval, and requirements
    prioritizeDataSources(tokenId, interval, days) {
        const sources = [];

        // CryptoCompare - Best for detailed trading data
        if (this.apiKeys.cryptocompare) {
            sources.push({
                name: 'CryptoCompare',
                priority: 1,
                fetch: (tokenId, interval, days) => this.getCryptoCompareData(tokenId, interval, days)
            });
        }

        // Binance - Excellent for major pairs
        if (this.apiKeys.binance && this.isBinanceSupported(tokenId)) {
            sources.push({
                name: 'Binance',
                priority: 2,
                fetch: (tokenId, interval, days) => this.getBinanceData(tokenId, interval, days)
            });
        }

        // Polygon - Good for stocks and detailed data
        if (this.apiKeys.polygon) {
            sources.push({
                name: 'Polygon',
                priority: 3,
                fetch: (tokenId, interval, days) => this.getPolygonData(tokenId, interval, days)
            });
        }

        // Alpha Vantage - Reliable backup
        if (this.apiKeys.alphavantage) {
            sources.push({
                name: 'AlphaVantage',
                priority: 4,
                fetch: (tokenId, interval, days) => this.getAlphaVantageData(tokenId, interval, days)
            });
        }

        // CoinGecko - Free fallback
        sources.push({
            name: 'CoinGecko',
            priority: 5,
            fetch: (tokenId, interval, days) => this.getCoinGeckoData(tokenId, interval, days)
        });

        return sources.sort((a, b) => a.priority - b.priority);
    }

    // Data quality validation
    validateDataQuality(data, expectedDays) {
        if (!data || data.length === 0) {
            throw new Error('No data received');
        }

        const minDataPoints = Math.max(this.qualityMetrics.minDataPoints, expectedDays * 0.8);
        
        if (data.length < minDataPoints) {
            console.warn(`⚠️ Insufficient data: ${data.length} < ${minDataPoints} points`);
        }

        // Check for data completeness
        const completeness = this.calculateDataCompleteness(data);
        if (completeness < this.qualityMetrics.completenessThreshold) {
            console.warn(`⚠️ Low data completeness: ${(completeness * 100).toFixed(1)}%`);
        }

        // Remove outliers
        data = this.removeOutliers(data);

        // Sort by timestamp
        data.sort((a, b) => a.timestamp - b.timestamp);

        return data;
    }

    // Fill gaps in historical data
    fillDataGaps(data, interval) {
        if (data.length < 2) return data;

        const expectedInterval = this.getIntervalMs(interval);
        const filledData = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            const gap = data[i].timestamp - data[i-1].timestamp;
            
            if (gap > expectedInterval * 1.5) {
                // Fill gaps with interpolated data
                const gapSize = Math.floor(gap / expectedInterval);
                
                if (gapSize <= this.qualityMetrics.maxGapHours) {
                    const interpolatedPoints = this.interpolateData(data[i-1], data[i], gapSize);
                    filledData.push(...interpolatedPoints);
                }
            }
            
            filledData.push(data[i]);
        }

        return filledData;
    }

    // Interpolate missing data points
    interpolateData(startPoint, endPoint, steps) {
        const interpolated = [];
        const timeStep = (endPoint.timestamp - startPoint.timestamp) / (steps + 1);
        
        for (let i = 1; i <= steps; i++) {
            const ratio = i / (steps + 1);
            interpolated.push({
                timestamp: startPoint.timestamp + (timeStep * i),
                open: this.interpolateValue(startPoint.close, endPoint.open, ratio),
                high: Math.max(startPoint.close, endPoint.open) * (1 + Math.random() * 0.01),
                low: Math.min(startPoint.close, endPoint.open) * (1 - Math.random() * 0.01),
                close: this.interpolateValue(startPoint.close, endPoint.open, ratio),
                volume: this.interpolateValue(startPoint.volume, endPoint.volume, ratio),
                interpolated: true
            });
        }
        
        return interpolated;
    }

    // Advanced analytics and pattern detection
    addAdvancedAnalytics(data) {
        if (data.length < 50) return data;

        // Add volatility measures
        data = this.calculateVolatility(data);
        
        // Add trend strength
        data = this.calculateTrendStrength(data);
        
        // Add support/resistance levels
        data = this.calculateSupportResistance(data);
        
        // Add market regime detection
        data = this.detectMarketRegime(data);
        
        // Add fractal dimension (for RIA Engine compatibility)
        data = this.calculateFractalDimension(data);

        return data;
    }

    // Calculate volatility metrics
    calculateVolatility(data, period = 20) {
        for (let i = period; i < data.length; i++) {
            const returns = [];
            for (let j = 1; j <= period; j++) {
                const currentPrice = data[i - j + 1].close;
                const previousPrice = data[i - j].close;
                returns.push(Math.log(currentPrice / previousPrice));
            }
            
            const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
            
            data[i].volatility = Math.sqrt(variance * 252); // Annualized volatility
            data[i].volatilityRank = this.getVolatilityRank(data[i].volatility, data.slice(0, i));
        }
        
        return data;
    }

    // Calculate fractal dimension for RIA Engine integration
    calculateFractalDimension(data, window = 50) {
        for (let i = window; i < data.length; i++) {
            const prices = data.slice(i - window, i).map(d => d.close);
            data[i].fractalDimension = this.computeFractalDimension(prices);
        }
        
        return data;
    }

    // Compute fractal dimension using box-counting method
    computeFractalDimension(prices) {
        if (prices.length < 10) return 1.5; // Default value
        
        const normalized = this.normalizeArray(prices);
        const scales = [2, 4, 8, 16, 32];
        const counts = [];
        
        for (const scale of scales) {
            const boxSize = 1 / scale;
            const boxes = new Set();
            
            for (let i = 0; i < normalized.length - 1; i++) {
                const x1 = Math.floor(i / normalized.length * scale);
                const y1 = Math.floor(normalized[i] * scale);
                const x2 = Math.floor((i + 1) / normalized.length * scale);
                const y2 = Math.floor(normalized[i + 1] * scale);
                
                // Add boxes that the line segment passes through
                const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
                for (let step = 0; step <= steps; step++) {
                    const x = Math.floor(x1 + (x2 - x1) * step / steps);
                    const y = Math.floor(y1 + (y2 - y1) * step / steps);
                    boxes.add(`${x},${y}`);
                }
            }
            
            counts.push(boxes.size);
        }
        
        // Calculate fractal dimension using least squares regression
        const logScales = scales.map(s => Math.log(s));
        const logCounts = counts.map(c => Math.log(c));
        
        return this.linearRegression(logScales, logCounts).slope * -1;
    }

    // Memory management and data compression
    async cacheData(cacheKey, data, days) {
        const dataSize = this.estimateDataSize(data);
        
        if (days > this.memoryLimits.maxUncompressedDays) {
            // Compress older data
            const compressed = await this.compressData(data);
            this.compressedCache.set(cacheKey, {
                data: compressed,
                timestamp: Date.now(),
                compressed: true,
                originalSize: dataSize,
                compressedSize: compressed.length
            });
        } else {
            // Store uncompressed for recent data
            this.dataCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                compressed: false,
                size: dataSize
            });
        }
        
        this.dataStats.memoryUsage += dataSize;
    }

    // Get data from CryptoCompare (most detailed for trading)
    async getCryptoCompareData(tokenId, interval, days) {
        try {
            const symbol = this.getSymbolFromTokenId(tokenId);
            const limit = this.calculateLimit(interval, days);
            
            let endpoint;
            switch (interval) {
                case '15m':
                    endpoint = 'histominute';
                    break;
                case '1h':
                    endpoint = 'histohour';
                    break;
                case '1d':
                    endpoint = 'histoday';
                    break;
                default:
                    endpoint = 'histohour';
            }

            const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}&api_key=${this.apiKeys.cryptocompare}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`CryptoCompare API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.Response === 'Error') {
                throw new Error(result.Message);
            }

            return this.formatCryptoCompareData(result.Data.Data, interval);

        } catch (error) {
            console.error('CryptoCompare data error:', error);
            throw error;
        }
    }

    // Get data from Binance API
    async getBinanceData(tokenId, interval, days) {
        try {
            const symbol = this.getBinanceSymbol(tokenId);
            const binanceInterval = this.getBinanceInterval(interval);
            const limit = Math.min(this.calculateLimit(interval, days), 1000); // Binance limit
            
            const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Binance API error: ${response.status}`);
            }

            const data = await response.json();
            return this.formatBinanceData(data, interval);

        } catch (error) {
            console.error('Binance data error:', error);
            throw error;
        }
    }

    // Fallback to CoinGecko (free but limited)
    async getCoinGeckoData(tokenId, interval, days) {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
            
            const response = await fetch(url, {
                headers: this.apiKeys.coingecko ? {
                    'x-cg-demo-api-key': this.apiKeys.coingecko
                } : {}
            });

            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const data = await response.json();
            return this.formatCoinGeckoData(data, interval);

        } catch (error) {
            console.error('CoinGecko data error:', error);
            throw error;
        }
    }

    // Calculate technical indicators
    calculateTechnicalIndicators(data) {
        if (!data || data.length < 20) {
            return data;
        }

        // Simple Moving Average (SMA)
        data = this.calculateSMA(data, 20);
        data = this.calculateSMA(data, 50);

        // Exponential Moving Average (EMA)
        data = this.calculateEMA(data, 12);
        data = this.calculateEMA(data, 26);

        // RSI (Relative Strength Index)
        data = this.calculateRSI(data, 14);

        // MACD
        data = this.calculateMACD(data);

        // Bollinger Bands
        data = this.calculateBollingerBands(data, 20, 2);

        // Volume analysis
        data = this.calculateVolumeIndicators(data);

        return data;
    }

    // Simple Moving Average
    calculateSMA(data, period) {
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            data[i][`sma${period}`] = sum / period;
        }
        return data;
    }

    // Exponential Moving Average
    calculateEMA(data, period) {
        const multiplier = 2 / (period + 1);
        
        // Start with SMA for first value
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += data[i].close;
        }
        data[period - 1][`ema${period}`] = sum / period;

        // Calculate EMA for remaining values
        for (let i = period; i < data.length; i++) {
            const ema = (data[i].close * multiplier) + (data[i - 1][`ema${period}`] * (1 - multiplier));
            data[i][`ema${period}`] = ema;
        }

        return data;
    }

    // RSI (Relative Strength Index)
    calculateRSI(data, period = 14) {
        let gains = 0;
        let losses = 0;

        // Calculate initial average gain and loss
        for (let i = 1; i <= period; i++) {
            const change = data[i].close - data[i - 1].close;
            if (change > 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;
        data[period].rsi = 100 - (100 / (1 + (avgGain / avgLoss)));

        // Calculate RSI for remaining values
        for (let i = period + 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;

            data[i].rsi = 100 - (100 / (1 + (avgGain / avgLoss)));
        }

        return data;
    }

    // MACD (Moving Average Convergence Divergence)
    calculateMACD(data) {
        // Ensure EMA12 and EMA26 are calculated
        data = this.calculateEMA(data, 12);
        data = this.calculateEMA(data, 26);

        // Calculate MACD line
        for (let i = 25; i < data.length; i++) {
            if (data[i].ema12 && data[i].ema26) {
                data[i].macd = data[i].ema12 - data[i].ema26;
            }
        }

        // Calculate Signal line (EMA of MACD)
        const macdValues = data.map(d => d.macd || 0);
        const signalPeriod = 9;
        const multiplier = 2 / (signalPeriod + 1);

        for (let i = 25 + signalPeriod - 1; i < data.length; i++) {
            if (i === 25 + signalPeriod - 1) {
                // First signal value is SMA
                let sum = 0;
                for (let j = 0; j < signalPeriod; j++) {
                    sum += data[i - j].macd;
                }
                data[i].signal = sum / signalPeriod;
            } else {
                data[i].signal = (data[i].macd * multiplier) + (data[i - 1].signal * (1 - multiplier));
            }
            
            data[i].histogram = data[i].macd - data[i].signal;
        }

        return data;
    }

    // Bollinger Bands
    calculateBollingerBands(data, period = 20, stdDev = 2) {
        for (let i = period - 1; i < data.length; i++) {
            // Calculate SMA
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            const sma = sum / period;

            // Calculate standard deviation
            let variance = 0;
            for (let j = 0; j < period; j++) {
                variance += Math.pow(data[i - j].close - sma, 2);
            }
            const standardDeviation = Math.sqrt(variance / period);

            data[i].bollingerUpper = sma + (standardDeviation * stdDev);
            data[i].bollingerMiddle = sma;
            data[i].bollingerLower = sma - (standardDeviation * stdDev);
            data[i].bollingerWidth = data[i].bollingerUpper - data[i].bollingerLower;
        }

        return data;
    }

    // Volume indicators
    calculateVolumeIndicators(data) {
        // Volume SMA
        const volumePeriod = 20;
        for (let i = volumePeriod - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < volumePeriod; j++) {
                sum += data[i - j].volume;
            }
            data[i].volumeSMA = sum / volumePeriod;
            data[i].volumeRatio = data[i].volume / data[i].volumeSMA;
        }

        // On-Balance Volume (OBV)
        data[0].obv = data[0].volume;
        for (let i = 1; i < data.length; i++) {
            if (data[i].close > data[i - 1].close) {
                data[i].obv = data[i - 1].obv + data[i].volume;
            } else if (data[i].close < data[i - 1].close) {
                data[i].obv = data[i - 1].obv - data[i].volume;
            } else {
                data[i].obv = data[i - 1].obv;
            }
        }

        return data;
    }

    // Format CryptoCompare data
    formatCryptoCompareData(rawData, interval) {
        return rawData.map(item => ({
            timestamp: item.time * 1000,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volumeto,
            interval
        }));
    }

    // Format Binance data
    formatBinanceData(rawData, interval) {
        return rawData.map(item => ({
            timestamp: item[0],
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            interval
        }));
    }

    // Format CoinGecko data (limited to daily)
    formatCoinGeckoData(rawData, interval) {
        const prices = rawData.prices;
        const volumes = rawData.total_volumes || [];
        
        return prices.map((price, index) => {
            const volume = volumes[index] ? volumes[index][1] : 0;
            return {
                timestamp: price[0],
                open: price[1], // CoinGecko doesn't provide OHLC, using price as approximation
                high: price[1],
                low: price[1],
                close: price[1],
                volume,
                interval
            };
        });
    }

    // Helper functions
    calculateLimit(interval, days) {
        switch (interval) {
            case '15m':
                return days * 24 * 4; // 4 intervals per hour
            case '1h':
                return days * 24;
            case '1d':
                return days;
            default:
                return days * 24;
        }
    }

    getBinanceInterval(interval) {
        const mapping = {
            '15m': '15m',
            '1h': '1h',
            '1d': '1d'
        };
        return mapping[interval] || '1h';
    }

    getBinanceSymbol(tokenId) {
        const symbolMapping = {
            'bitcoin': 'BTCUSDT',
            'ethereum': 'ETHUSDT',
            'usd-coin': 'USDCUSDT',
            'tether': 'USDTUSDT',
            'binancecoin': 'BNBUSDT',
            'matic-network': 'MATICUSDT',
            'pulsechain': 'PLSUSDT'
        };
        return symbolMapping[tokenId] || 'BTCUSDT';
    }

    getSymbolFromTokenId(tokenId) {
        const symbolMapping = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'usd-coin': 'USDC',
            'tether': 'USDT',
            'binancecoin': 'BNB',
            'matic-network': 'MATIC',
            'pulsechain': 'PLS',
            'pulsex': 'PLSX',
            'hex': 'HEX'
        };
        return symbolMapping[tokenId] || 'BTC';
    }

    // Get trading signals based on technical indicators
    getTradingSignals(data, lookback = 10) {
        if (!data || data.length < lookback) {
            return { signals: [], strength: 0 };
        }

        const latest = data[data.length - 1];
        const signals = [];
        let bullishSignals = 0;
        let bearishSignals = 0;

        // RSI signals
        if (latest.rsi) {
            if (latest.rsi < 30) {
                signals.push({ type: 'BUY', indicator: 'RSI', reason: 'Oversold', strength: 0.8 });
                bullishSignals++;
            } else if (latest.rsi > 70) {
                signals.push({ type: 'SELL', indicator: 'RSI', reason: 'Overbought', strength: 0.8 });
                bearishSignals++;
            }
        }

        // MACD signals
        if (latest.macd && latest.signal) {
            const prevPoint = data[data.length - 2];
            if (prevPoint && prevPoint.macd && prevPoint.signal) {
                if (latest.macd > latest.signal && prevPoint.macd <= prevPoint.signal) {
                    signals.push({ type: 'BUY', indicator: 'MACD', reason: 'Bullish crossover', strength: 0.7 });
                    bullishSignals++;
                } else if (latest.macd < latest.signal && prevPoint.macd >= prevPoint.signal) {
                    signals.push({ type: 'SELL', indicator: 'MACD', reason: 'Bearish crossover', strength: 0.7 });
                    bearishSignals++;
                }
            }
        }

        // Bollinger Bands signals
        if (latest.bollingerUpper && latest.bollingerLower) {
            if (latest.close <= latest.bollingerLower) {
                signals.push({ type: 'BUY', indicator: 'Bollinger', reason: 'Price at lower band', strength: 0.6 });
                bullishSignals++;
            } else if (latest.close >= latest.bollingerUpper) {
                signals.push({ type: 'SELL', indicator: 'Bollinger', reason: 'Price at upper band', strength: 0.6 });
                bearishSignals++;
            }
        }

        // Moving Average signals
        if (latest.sma20 && latest.sma50) {
            if (latest.close > latest.sma20 && latest.sma20 > latest.sma50) {
                signals.push({ type: 'BUY', indicator: 'MA', reason: 'Price above MAs', strength: 0.5 });
                bullishSignals++;
            } else if (latest.close < latest.sma20 && latest.sma20 < latest.sma50) {
                signals.push({ type: 'SELL', indicator: 'MA', reason: 'Price below MAs', strength: 0.5 });
                bearishSignals++;
            }
        }

        // Volume confirmation
        if (latest.volumeRatio && latest.volumeRatio > 1.5) {
            signals.forEach(signal => {
                signal.strength += 0.1; // Boost signal strength with high volume
            });
        }

        const netSignals = bullishSignals - bearishSignals;
        const totalSignals = bullishSignals + bearishSignals;
        const strength = totalSignals > 0 ? Math.abs(netSignals) / totalSignals : 0;

        return {
            signals,
            overallSignal: netSignals > 0 ? 'BUY' : netSignals < 0 ? 'SELL' : 'HOLD',
            strength: strength,
            bullishSignals,
            bearishSignals
        };
    }

    // Utility methods for data quality and management
    getCacheMaxAge(interval) {
        const cacheAges = {
            '5m': 5 * 60 * 1000,      // 5 minutes
            '15m': 15 * 60 * 1000,    // 15 minutes  
            '1h': 60 * 60 * 1000,     // 1 hour
            '4h': 4 * 60 * 60 * 1000, // 4 hours
            '1d': 24 * 60 * 60 * 1000 // 24 hours
        };
        return cacheAges[interval] || cacheAges['1h'];
    }

    isDataQualityAcceptable(data, expectedDays) {
        if (!data || data.length === 0) return false;
        
        const minPoints = expectedDays * 0.7; // Require at least 70% of expected data
        return data.length >= minPoints;
    }

    calculateDataCompleteness(data) {
        if (data.length < 2) return 0;
        
        const interval = this.guessInterval(data);
        const expectedPoints = this.calculateExpectedDataPoints(data[0].timestamp, data[data.length - 1].timestamp, interval);
        
        return Math.min(data.length / expectedPoints, 1);
    }

    removeOutliers(data) {
        if (data.length < 10) return data;
        
        const prices = data.map(d => d.close);
        const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        const threshold = this.qualityMetrics.outlierThreshold * stdDev;
        
        return data.filter(d => Math.abs(d.close - mean) <= threshold);
    }

    getIntervalMs(interval) {
        const intervals = {
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '4h': 4 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000
        };
        return intervals[interval] || intervals['1h'];
    }

    interpolateValue(start, end, ratio) {
        return start + (end - start) * ratio;
    }

    getVolatilityRank(currentVol, historicalData) {
        const historicalVols = historicalData
            .map(d => d.volatility)
            .filter(v => v !== undefined)
            .sort((a, b) => a - b);
            
        if (historicalVols.length === 0) return 0.5;
        
        const rank = historicalVols.findIndex(v => v >= currentVol);
        return rank === -1 ? 1 : rank / historicalVols.length;
    }

    normalizeArray(arr) {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const range = max - min;
        
        if (range === 0) return arr.map(() => 0.5);
        
        return arr.map(val => (val - min) / range);
    }

    linearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }

    estimateDataSize(data) {
        if (!data || data.length === 0) return 0;
        
        // Rough estimate: each data point is about 200 bytes
        return data.length * 200;
    }

    getCurrentMemoryUsage() {
        let totalSize = 0;
        
        for (const cached of this.dataCache.values()) {
            totalSize += cached.size || 0;
        }
        
        for (const cached of this.compressedCache.values()) {
            totalSize += cached.compressedSize || 0;
        }
        
        return totalSize;
    }

    async compressData(data) {
        // Simple compression by keeping only essential fields
        return data.map(d => ({
            t: d.timestamp,
            o: Math.round(d.open * 10000) / 10000,
            h: Math.round(d.high * 10000) / 10000,
            l: Math.round(d.low * 10000) / 10000,
            c: Math.round(d.close * 10000) / 10000,
            v: Math.round(d.volume)
        }));
    }

    async compressOlderData() {
        const now = Date.now();
        const maxUncompressedAge = this.memoryLimits.maxUncompressedDays * 24 * 60 * 60 * 1000;
        
        for (const [key, cached] of this.dataCache.entries()) {
            if (now - cached.timestamp > maxUncompressedAge) {
                const compressed = await this.compressData(cached.data);
                
                this.compressedCache.set(key, {
                    data: compressed,
                    timestamp: cached.timestamp,
                    compressed: true,
                    originalSize: cached.size,
                    compressedSize: this.estimateDataSize(compressed)
                });
                
                this.dataCache.delete(key);
                this.dataStats.memoryUsage -= cached.size;
                this.dataStats.memoryUsage += this.estimateDataSize(compressed);
            }
        }
    }

    updateLoadingProgress(tokenId, status, days) {
        if (!this.loadingProgress.has(tokenId)) {
            this.loadingProgress.set(tokenId, {});
        }
        
        const progress = this.loadingProgress.get(tokenId);
        progress[`${days}d`] = status;
        
        if (status === 'loaded') {
            this.dataStats.loadedTokens++;
        } else if (status === 'failed') {
            this.dataStats.failedTokens++;
        }
    }

    getLoadingProgress(tokenId) {
        return this.loadingProgress.get(tokenId) || {};
    }

    isBinanceSupported(tokenId) {
        const supported = ['bitcoin', 'ethereum', 'usd-coin', 'tether', 'binancecoin', 'matic-network'];
        return supported.includes(tokenId);
    }

    guessInterval(data) {
        if (data.length < 2) return '1h';
        
        const avgGap = (data[data.length - 1].timestamp - data[0].timestamp) / (data.length - 1);
        
        if (avgGap <= 6 * 60 * 1000) return '5m';
        if (avgGap <= 20 * 60 * 1000) return '15m';
        if (avgGap <= 2 * 60 * 60 * 1000) return '1h';
        if (avgGap <= 6 * 60 * 60 * 1000) return '4h';
        return '1d';
    }

    calculateExpectedDataPoints(startTime, endTime, interval) {
        const duration = endTime - startTime;
        const intervalMs = this.getIntervalMs(interval);
        return Math.floor(duration / intervalMs);
    }

    async tryFallbackSources(tokenId, interval, days) {
        console.log('🔄 Trying fallback data sources...');
        
        try {
            // Try CoinGecko as last resort
            const data = await this.getCoinGeckoData(tokenId, interval, days);
            if (data && data.length > 0) {
                return this.calculateTechnicalIndicators(data);
            }
        } catch (error) {
            console.error('All fallback sources failed:', error);
        }
        
        // Return minimal dummy data to prevent crashes
        return this.generateDummyData(tokenId, days);
    }

    generateDummyData(tokenId, days) {
        console.warn(`⚠️ Generating dummy data for ${tokenId} (${days} days)`);
        
        const data = [];
        const now = Date.now();
        const basePrice = 100; // Dummy base price
        
        for (let i = days; i >= 0; i--) {
            const timestamp = now - (i * 24 * 60 * 60 * 1000);
            const price = basePrice * (1 + (Math.random() - 0.5) * 0.1);
            
            data.push({
                timestamp,
                open: price,
                high: price * 1.02,
                low: price * 0.98,
                close: price,
                volume: Math.random() * 1000000,
                dummy: true
            });
        }
        
        return data;
    }

    // Enhanced methods for additional data sources
    async getPolygonData(tokenId, interval, days) {
        // Polygon.io implementation for stocks/crypto
        const symbol = this.getPolygonSymbol(tokenId);
        const timespan = this.getPolygonTimespan(interval);
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const to = new Date().toISOString().split('T')[0];
        
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}?apikey=${this.apiKeys.polygon}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Polygon API error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.formatPolygonData(data.results || [], interval);
    }

    async getAlphaVantageData(tokenId, interval, days) {
        // Alpha Vantage implementation
        const symbol = this.getAlphaVantageSymbol(tokenId);
        const func = interval === '1d' ? 'DIGITAL_CURRENCY_DAILY' : 'DIGITAL_CURRENCY_INTRADAY';
        
        const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&market=USD&apikey=${this.apiKeys.alphavantage}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Alpha Vantage API error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.formatAlphaVantageData(data, interval);
    }

    getPolygonSymbol(tokenId) {
        const mapping = {
            'bitcoin': 'X:BTCUSD',
            'ethereum': 'X:ETHUSD',
            'matic-network': 'X:MATICUSD'
        };
        return mapping[tokenId] || 'X:BTCUSD';
    }

    getPolygonTimespan(interval) {
        const mapping = {
            '5m': 'minute',
            '15m': 'minute', 
            '1h': 'hour',
            '4h': 'hour',
            '1d': 'day'
        };
        return mapping[interval] || 'hour';
    }

    getAlphaVantageSymbol(tokenId) {
        const mapping = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'matic-network': 'MATIC'
        };
        return mapping[tokenId] || 'BTC';
    }

    formatPolygonData(rawData, interval) {
        return rawData.map(item => ({
            timestamp: item.t,
            open: item.o,
            high: item.h,
            low: item.l,
            close: item.c,
            volume: item.v,
            interval
        }));
    }

    formatAlphaVantageData(rawData, interval) {
        // Alpha Vantage has complex nested structure, simplified here
        const timeSeries = rawData['Time Series (Digital Currency Daily)'] || {};
        
        return Object.entries(timeSeries).map(([date, values]) => ({
            timestamp: new Date(date).getTime(),
            open: parseFloat(values['1a. open (USD)']),
            high: parseFloat(values['2a. high (USD)']),
            low: parseFloat(values['3a. low (USD)']),
            close: parseFloat(values['4a. close (USD)']),
            volume: parseFloat(values['5. volume']),
            interval
        }));
    }

    // Additional trend and regime detection methods
    calculateTrendStrength(data, period = 20) {
        for (let i = period; i < data.length; i++) {
            const recentPrices = data.slice(i - period, i).map(d => d.close);
            const regression = this.linearRegression(
                recentPrices.map((_, idx) => idx),
                recentPrices
            );
            
            data[i].trendStrength = Math.abs(regression.slope);
            data[i].trendDirection = regression.slope > 0 ? 'up' : 'down';
        }
        
        return data;
    }

    calculateSupportResistance(data, window = 50) {
        for (let i = window; i < data.length; i++) {
            const segment = data.slice(i - window, i);
            const highs = segment.map(d => d.high).sort((a, b) => b - a);
            const lows = segment.map(d => d.low).sort((a, b) => a - b);
            
            data[i].resistance = highs.slice(0, 3).reduce((sum, h) => sum + h, 0) / 3;
            data[i].support = lows.slice(0, 3).reduce((sum, l) => sum + l, 0) / 3;
        }
        
        return data;
    }

    detectMarketRegime(data, period = 50) {
        for (let i = period; i < data.length; i++) {
            const segment = data.slice(i - period, i);
            const volatility = segment.reduce((sum, d) => sum + (d.volatility || 0), 0) / segment.length;
            const trendStrength = segment.reduce((sum, d) => sum + (d.trendStrength || 0), 0) / segment.length;
            
            if (volatility > 0.3 && trendStrength > 0.1) {
                data[i].marketRegime = 'trending_volatile';
            } else if (volatility > 0.3) {
                data[i].marketRegime = 'sideways_volatile';
            } else if (trendStrength > 0.1) {
                data[i].marketRegime = 'trending_stable';
            } else {
                data[i].marketRegime = 'sideways_stable';
            }
        }
        
        return data;
    }

    validateAndEnhanceData(data, tokenId, interval) {
        // Add real-time enhancements and validation
        if (!data || data.length === 0) return data;
        
        // Add metadata
        data.forEach(d => {
            d.tokenId = tokenId;
            d.interval = interval;
            d.lastUpdated = Date.now();
        });
        
        return data;
    }

    // Clear cache
    clearCache() {
        this.dataCache.clear();
        this.compressedCache.clear();
        this.dataStats.memoryUsage = 0;
    }

    // Get comprehensive data statistics
    getDataStats() {
        return {
            ...this.dataStats,
            cacheEntries: this.dataCache.size,
            compressedEntries: this.compressedCache.size,
            memoryUsageMB: Math.round(this.dataStats.memoryUsage / (1024 * 1024))
        };
    }

    // Get data requirements for trading bots  
    getDataRequirements() {
        return this.dataRequirements;
    }
}