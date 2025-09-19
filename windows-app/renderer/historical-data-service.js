/**
 * Historical Data Service
 * Provides 90 days of historical price data for bot trading analysis
 */

export class HistoricalDataService {
    constructor() {
        this.dataCache = new Map(); // tokenId -> historical data
        this.apiKeys = {
            coingecko: process.env.COINGECKO_API_KEY || '',
            cryptocompare: process.env.CRYPTOCOMPARE_API_KEY || '',
            binance: process.env.BINANCE_API_KEY || ''
        };
        
        this.dataRequirements = {
            days: 90,           // 90 days of historical data
            intervals: ['1h', '15m'], // Hourly and 15-minute intervals
            indicators: ['sma', 'ema', 'rsi', 'macd', 'bollinger']
        };
    }

    // Get 90 days of historical data for a token
    async getHistoricalData(tokenId, interval = '1h', days = 90) {
        const cacheKey = `${tokenId}_${interval}_${days}`;
        
        // Check cache first
        if (this.dataCache.has(cacheKey)) {
            const cachedData = this.dataCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 3600000) { // 1 hour cache
                return cachedData.data;
            }
        }

        try {
            let data;
            
            // Try multiple data sources for reliability
            if (this.apiKeys.cryptocompare) {
                data = await this.getCryptoCompareData(tokenId, interval, days);
            } else if (this.apiKeys.binance) {
                data = await this.getBinanceData(tokenId, interval, days);
            } else {
                data = await this.getCoinGeckoData(tokenId, interval, days);
            }

            // Add technical indicators
            data = this.calculateTechnicalIndicators(data);

            // Cache the data
            this.dataCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error('Historical data fetch error:', error);
            throw error;
        }
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

    // Clear cache
    clearCache() {
        this.dataCache.clear();
    }

    // Get data requirements for trading bots
    getDataRequirements() {
        return this.dataRequirements;
    }
}