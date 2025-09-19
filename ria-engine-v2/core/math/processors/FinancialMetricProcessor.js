/**
 * FinancialMetricProcessor - Advanced financial performance analysis
 * 
 * Performs comprehensive financial ratio calculations including:
 * - Sharpe Ratio (risk-adjusted returns)
 * - Sortino Ratio (downside risk-adjusted returns)
 * - Calmar Ratio (return vs maximum drawdown)
 * - Information Ratio
 * - Maximum Drawdown analysis
 * - Value at Risk (VaR) calculations
 * 
 * @version 2.0.0
 */

export class FinancialMetricProcessor {
  constructor(config = {}) {
    this.config = {
      riskFreeRate: 0.02, // 2% annual risk-free rate
      confidenceLevel: 0.05, // 95% confidence for VaR
      periodsPerYear: 252, // Trading days per year (can be adjusted for hourly: 24*365)
      minObservations: 30,
      ...config
    };
  }

  /**
   * Compute comprehensive financial metrics from returns or equity curve
   */
  async computeMetrics(data, options = {}) {
    try {
      const { type = 'returns', timeframe = 'daily' } = options;
      
      // Convert data to returns if equity curve is provided
      const returns = type === 'equity' ? this.equityToReturns(data) : data;
      
      if (returns.length < this.config.minObservations) {
        throw new Error(`Insufficient data: ${returns.length} observations, minimum ${this.config.minObservations} required`);
      }

      // Adjust periods per year based on timeframe
      const periodsPerYear = this.getPeriodsPerYear(timeframe);
      
      const basicMetrics = this.computeBasicMetrics(returns);
      const riskMetrics = this.computeRiskMetrics(returns, periodsPerYear);
      const ratioMetrics = this.computeRatioMetrics(returns, periodsPerYear);
      const drawdownMetrics = type === 'equity' ? this.computeDrawdownMetrics(data) : null;
      
      return {
        basic: basicMetrics,
        risk: riskMetrics,
        ratios: ratioMetrics,
        drawdown: drawdownMetrics,
        observations: returns.length,
        timeframe,
        periodsPerYear,
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw new Error(`Financial metrics computation failed: ${error.message}`);
    }
  }

  /**
   * Convert equity curve to returns array
   */
  equityToReturns(equityCurve) {
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].value || equityCurve[i - 1];
      const currValue = equityCurve[i].value || equityCurve[i];
      
      if (prevValue > 0) {
        returns.push((currValue - prevValue) / prevValue);
      }
    }
    return returns;
  }

  /**
   * Get periods per year based on timeframe
   */
  getPeriodsPerYear(timeframe) {
    const periods = {
      'minute': 525600,    // 60 * 24 * 365
      'hourly': 8760,      // 24 * 365
      'daily': 252,        // Trading days
      'weekly': 52,
      'monthly': 12,
      'quarterly': 4,
      'yearly': 1
    };
    
    return periods[timeframe] || this.config.periodsPerYear;
  }

  /**
   * Compute basic performance metrics
   */
  computeBasicMetrics(returns) {
    const n = returns.length;
    if (n === 0) return null;

    const totalReturn = returns.reduce((acc, ret) => (1 + acc) * (1 + ret) - 1, 0);
    const mean = returns.reduce((acc, ret) => acc + ret, 0) / n;
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / (n - 1);
    const volatility = Math.sqrt(variance);
    
    // Geometric mean (more accurate for compound returns)
    const geometricMean = Math.pow(1 + totalReturn, 1 / n) - 1;
    
    // Positive and negative returns analysis
    const positiveReturns = returns.filter(ret => ret > 0);
    const negativeReturns = returns.filter(ret => ret < 0);
    
    return {
      totalReturn,
      arithmeticMean: mean,
      geometricMean,
      volatility,
      variance,
      positiveReturns: positiveReturns.length,
      negativeReturns: negativeReturns.length,
      winRate: positiveReturns.length / n,
      averageWin: positiveReturns.length > 0 ? positiveReturns.reduce((a, b) => a + b, 0) / positiveReturns.length : 0,
      averageLoss: negativeReturns.length > 0 ? negativeReturns.reduce((a, b) => a + b, 0) / negativeReturns.length : 0,
      maxReturn: Math.max(...returns),
      minReturn: Math.min(...returns)
    };
  }

  /**
   * Compute risk metrics
   */
  computeRiskMetrics(returns, periodsPerYear) {
    const basic = this.computeBasicMetrics(returns);
    const mean = basic.arithmeticMean;
    const volatility = basic.volatility;
    
    // Downside deviation (for Sortino ratio)
    const downsideReturns = returns.filter(ret => ret < 0);
    const downsideVariance = downsideReturns.length > 0 ? 
      downsideReturns.reduce((acc, ret) => acc + Math.pow(ret, 2), 0) / downsideReturns.length : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    // Semi-deviation (below mean)
    const belowMeanReturns = returns.filter(ret => ret < mean);
    const semiVariance = belowMeanReturns.length > 0 ?
      belowMeanReturns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / belowMeanReturns.length : 0;
    const semiDeviation = Math.sqrt(semiVariance);
    
    // Value at Risk (VaR)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(this.config.confidenceLevel * returns.length);
    const valueAtRisk = sortedReturns[varIndex] || 0;
    
    // Conditional Value at Risk (Expected Shortfall)
    const cvarReturns = sortedReturns.slice(0, varIndex + 1);
    const conditionalVaR = cvarReturns.length > 0 ? 
      cvarReturns.reduce((a, b) => a + b, 0) / cvarReturns.length : 0;
    
    // Skewness and Kurtosis
    const skewness = this.computeSkewness(returns, mean, volatility);
    const kurtosis = this.computeKurtosis(returns, mean, volatility);
    
    return {
      volatility: volatility * Math.sqrt(periodsPerYear), // Annualized
      downsideDeviation: downsideDeviation * Math.sqrt(periodsPerYear),
      semiDeviation: semiDeviation * Math.sqrt(periodsPerYear),
      valueAtRisk,
      conditionalVaR,
      skewness,
      kurtosis,
      confidenceLevel: this.config.confidenceLevel
    };
  }

  /**
   * Compute financial ratios
   */
  computeRatioMetrics(returns, periodsPerYear) {
    const basic = this.computeBasicMetrics(returns);
    const risk = this.computeRiskMetrics(returns, periodsPerYear);
    
    const annualizedReturn = basic.arithmeticMean * periodsPerYear;
    const annualizedVolatility = risk.volatility;
    const excessReturn = annualizedReturn - this.config.riskFreeRate;
    
    // Sharpe Ratio
    const sharpeRatio = annualizedVolatility > 0 ? excessReturn / annualizedVolatility : 0;
    
    // Sortino Ratio (using downside deviation)
    const sortinoRatio = risk.downsideDeviation > 0 ? excessReturn / risk.downsideDeviation : 0;
    
    // Information Ratio (assuming benchmark return is risk-free rate)
    const informationRatio = sharpeRatio; // Simplified: tracking error = volatility when benchmark is risk-free
    
    // Treynor Ratio (requires beta, using volatility as proxy)
    const treynorRatio = annualizedVolatility > 0 ? excessReturn / annualizedVolatility : 0;
    
    // Profit Factor
    const positiveReturns = returns.filter(ret => ret > 0);
    const negativeReturns = returns.filter(ret => ret < 0);
    const totalGains = positiveReturns.reduce((acc, ret) => acc + ret, 0);
    const totalLosses = Math.abs(negativeReturns.reduce((acc, ret) => acc + ret, 0));
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0;
    
    // Gain-to-Pain Ratio
    const gainToPainRatio = totalLosses > 0 ? (basic.totalReturn + 1) / totalLosses : 
      basic.totalReturn > 0 ? Infinity : 0;
    
    return {
      sharpeRatio,
      sortinoRatio,
      informationRatio,
      treynorRatio,
      profitFactor,
      gainToPainRatio,
      riskFreeRate: this.config.riskFreeRate,
      annualizedReturn,
      annualizedVolatility,
      excessReturn
    };
  }

  /**
   * Compute drawdown metrics from equity curve
   */
  computeDrawdownMetrics(equityCurve) {
    const values = equityCurve.map(point => point.value || point);
    const drawdowns = [];
    let peak = values[0];
    let maxDrawdown = 0;
    let drawdownStart = 0;
    let maxDrawdownStart = 0;
    let maxDrawdownEnd = 0;
    let currentDrawdownDuration = 0;
    let maxDrawdownDuration = 0;
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      
      if (value > peak) {
        // New peak reached
        if (currentDrawdownDuration > 0) {
          // End of drawdown period
          drawdowns.push({
            start: drawdownStart,
            end: i - 1,
            duration: currentDrawdownDuration,
            depth: (peak - values[drawdownStart]) / peak
          });
          currentDrawdownDuration = 0;
        }
        peak = value;
        drawdownStart = i;
      } else {
        // In drawdown
        currentDrawdownDuration++;
        const currentDrawdown = (peak - value) / peak;
        
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
          maxDrawdownStart = drawdownStart;
          maxDrawdownEnd = i;
          maxDrawdownDuration = currentDrawdownDuration;
        }
      }
    }
    
    // Handle case where we end in a drawdown
    if (currentDrawdownDuration > 0) {
      drawdowns.push({
        start: drawdownStart,
        end: values.length - 1,
        duration: currentDrawdownDuration,
        depth: (peak - values[values.length - 1]) / peak
      });
    }
    
    // Calmar Ratio (annual return / max drawdown)
    const totalReturn = (values[values.length - 1] - values[0]) / values[0];
    const calmarRatio = maxDrawdown > 0 ? totalReturn / maxDrawdown : totalReturn > 0 ? Infinity : 0;
    
    // Average drawdown
    const avgDrawdown = drawdowns.length > 0 ? 
      drawdowns.reduce((acc, dd) => acc + dd.depth, 0) / drawdowns.length : 0;
    
    // Recovery analysis
    const recoveryTimes = drawdowns
      .filter(dd => dd.end < values.length - 1)
      .map(dd => {
        const peakValue = values[dd.start];
        for (let i = dd.end + 1; i < values.length; i++) {
          if (values[i] >= peakValue) {
            return i - dd.end;
          }
        }
        return null; // No recovery found
      })
      .filter(time => time !== null);
    
    const avgRecoveryTime = recoveryTimes.length > 0 ? 
      recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : null;
    
    return {
      maxDrawdown,
      maxDrawdownDuration,
      maxDrawdownStart,
      maxDrawdownEnd,
      calmarRatio,
      totalDrawdowns: drawdowns.length,
      averageDrawdown: avgDrawdown,
      averageRecoveryTime: avgRecoveryTime,
      drawdownPeriods: drawdowns,
      currentDrawdown: currentDrawdownDuration > 0 ? (peak - values[values.length - 1]) / peak : 0
    };
  }

  /**
   * Compute skewness of returns
   */
  computeSkewness(returns, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = returns.length;
    const skewness = returns.reduce((acc, ret) => {
      return acc + Math.pow((ret - mean) / stdDev, 3);
    }, 0) / n;
    
    return skewness;
  }

  /**
   * Compute kurtosis of returns
   */
  computeKurtosis(returns, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = returns.length;
    const kurtosis = returns.reduce((acc, ret) => {
      return acc + Math.pow((ret - mean) / stdDev, 4);
    }, 0) / n;
    
    return kurtosis - 3; // Excess kurtosis (normal distribution has kurtosis of 3)
  }

  /**
   * Compute rolling metrics for time series analysis
   */
  computeRollingMetrics(returns, windowSize = 30) {
    const rollingMetrics = [];
    
    for (let i = windowSize - 1; i < returns.length; i++) {
      const window = returns.slice(i - windowSize + 1, i + 1);
      const windowBasic = this.computeBasicMetrics(window);
      const windowRisk = this.computeRiskMetrics(window, this.config.periodsPerYear);
      const windowRatios = this.computeRatioMetrics(window, this.config.periodsPerYear);
      
      rollingMetrics.push({
        index: i,
        window: windowSize,
        sharpeRatio: windowRatios.sharpeRatio,
        sortinoRatio: windowRatios.sortinoRatio,
        volatility: windowRisk.volatility,
        return: windowBasic.arithmeticMean * this.config.periodsPerYear
      });
    }
    
    return rollingMetrics;
  }

  /**
   * Compare performance against benchmark
   */
  compareAgainstBenchmark(returns, benchmarkReturns) {
    if (returns.length !== benchmarkReturns.length) {
      throw new Error('Returns and benchmark must have the same length');
    }
    
    // Excess returns
    const excessReturns = returns.map((ret, i) => ret - benchmarkReturns[i]);
    
    // Beta calculation
    const portfolioMean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const benchmarkMean = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    
    let covariance = 0;
    let benchmarkVariance = 0;
    
    for (let i = 0; i < returns.length; i++) {
      const portfolioDeviation = returns[i] - portfolioMean;
      const benchmarkDeviation = benchmarkReturns[i] - benchmarkMean;
      
      covariance += portfolioDeviation * benchmarkDeviation;
      benchmarkVariance += benchmarkDeviation * benchmarkDeviation;
    }
    
    covariance /= (returns.length - 1);
    benchmarkVariance /= (returns.length - 1);
    
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
    
    // Alpha (Jensen's alpha)
    const expectedReturn = this.config.riskFreeRate + beta * 
      (benchmarkMean * this.config.periodsPerYear - this.config.riskFreeRate);
    const actualReturn = portfolioMean * this.config.periodsPerYear;
    const alpha = actualReturn - expectedReturn;
    
    // Tracking error
    const excessMetrics = this.computeBasicMetrics(excessReturns);
    const trackingError = excessMetrics.volatility * Math.sqrt(this.config.periodsPerYear);
    
    // Information ratio
    const informationRatio = trackingError > 0 ? 
      (excessMetrics.arithmeticMean * this.config.periodsPerYear) / trackingError : 0;
    
    return {
      beta,
      alpha,
      trackingError,
      informationRatio,
      correlation: covariance / (Math.sqrt(benchmarkVariance) * excessMetrics.volatility),
      excessReturn: excessMetrics.arithmeticMean * this.config.periodsPerYear
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get risk-adjusted performance summary
   */
  getPerformanceSummary(data, options = {}) {
    const metrics = this.computeMetrics(data, options);
    
    return {
      totalReturn: `${(metrics.basic.totalReturn * 100).toFixed(2)}%`,
      annualizedReturn: `${(metrics.ratios.annualizedReturn * 100).toFixed(2)}%`,
      volatility: `${(metrics.ratios.annualizedVolatility * 100).toFixed(2)}%`,
      sharpeRatio: metrics.ratios.sharpeRatio.toFixed(3),
      sortinoRatio: metrics.ratios.sortinoRatio.toFixed(3),
      maxDrawdown: metrics.drawdown ? `${(metrics.drawdown.maxDrawdown * 100).toFixed(2)}%` : 'N/A',
      calmarRatio: metrics.drawdown ? metrics.drawdown.calmarRatio.toFixed(3) : 'N/A',
      winRate: `${(metrics.basic.winRate * 100).toFixed(1)}%`,
      profitFactor: metrics.ratios.profitFactor.toFixed(2)
    };
  }
}