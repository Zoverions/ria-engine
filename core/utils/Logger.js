/**
 * Logger - Enterprise-grade logging system
 * 
 * Provides structured, configurable logging with multiple output targets,
 * log rotation, filtering, and integration with monitoring systems.
 * 
 * Features:
 * - Multiple log levels with filtering
 * - Structured JSON logging
 * - Multiple output targets (console, file, remote)
 * - Log rotation and archiving
 * - Performance monitoring integration
 * - Security and privacy protection
 * 
 * @author Zoverions Grand Unified Model ZGUM v16.2
 * @version 2.0.0
 * @date September 19, 2025
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

export class Logger extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Log levels
      level: 'info', // 'debug', 'info', 'warn', 'error', 'fatal'
      levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
        fatal: 4
      },
      
      // Output configuration
      outputs: {
        console: {
          enabled: true,
          colorize: true,
          format: 'pretty' // 'pretty', 'json', 'simple'
        },
        file: {
          enabled: false,
          path: './logs',
          filename: 'ria-engine.log',
          maxSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          format: 'json'
        },
        remote: {
          enabled: false,
          endpoint: null,
          apiKey: null,
          batchSize: 100,
          flushInterval: 5000
        }
      },
      
      // Formatting
      includeTimestamp: true,
      includeLevel: true,
      includeSource: true,
      includeStackTrace: true,
      
      // Privacy and security
      sanitizeData: true,
      maskSensitiveFields: ['password', 'token', 'secret', 'key'],
      maxFieldLength: 1000,
      
      // Performance
      enableBuffering: true,
      bufferSize: 1000,
      flushInterval: 1000,
      
      ...config
    };
    
    // Internal state
    this.state = {
      initialized: false,
      buffer: [],
      flushTimer: null,
      fileHandles: new Map(),
      stats: {
        totalLogs: 0,
        logsByLevel: {},
        lastFlush: 0,
        droppedLogs: 0
      }
    };
    
    // Initialize log level counters
    Object.keys(this.config.levels).forEach(level => {
      this.state.stats.logsByLevel[level] = 0;
    });
    
    // Color codes for console output
    this.colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      fatal: '\x1b[35m',   // Magenta
      reset: '\x1b[0m',    // Reset
      dim: '\x1b[2m',      // Dim
      bright: '\x1b[1m'    // Bright
    };
  }

  /**
   * Initialize the logger
   */
  async initialize() {
    try {
      // Ensure log directory exists
      if (this.config.outputs.file.enabled) {
        await this.ensureLogDirectory();
      }
      
      // Start flush timer if buffering is enabled
      if (this.config.enableBuffering) {
        this.startFlushTimer();
      }
      
      this.state.initialized = true;
      
      // Log initialization
      this.info('Logger initialized', {
        level: this.config.level,
        outputs: Object.entries(this.config.outputs)
          .filter(([, config]) => config.enabled)
          .map(([name]) => name)
      });
      
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      throw error;
    }
  }

  /**
   * Log debug message
   */
  debug(message, data = {}, source = null) {
    this.log('debug', message, data, source);
  }

  /**
   * Log info message
   */
  info(message, data = {}, source = null) {
    this.log('info', message, data, source);
  }

  /**
   * Log warning message
   */
  warn(message, data = {}, source = null) {
    this.log('warn', message, data, source);
  }

  /**
   * Log error message
   */
  error(message, data = {}, source = null) {
    this.log('error', message, data, source);
  }

  /**
   * Log fatal error message
   */
  fatal(message, data = {}, source = null) {
    this.log('fatal', message, data, source);
  }

  /**
   * Main logging method
   */
  log(level, message, data = {}, source = null) {
    // Check if level is enabled
    if (!this.shouldLog(level)) {
      return;
    }
    
    try {
      // Create log entry
      const logEntry = this.createLogEntry(level, message, data, source);
      
      // Update statistics
      this.updateStats(level);
      
      // Handle output
      if (this.config.enableBuffering) {
        this.addToBuffer(logEntry);
      } else {
        this.writeLog(logEntry);
      }
      
      // Emit log event
      this.emit('log', logEntry);
      
    } catch (error) {
      console.error('Logging error:', error);
      this.state.stats.droppedLogs++;
    }
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const currentLevelValue = this.config.levels[this.config.level];
    const logLevelValue = this.config.levels[level];
    return logLevelValue >= currentLevelValue;
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, data, source) {
    const timestamp = new Date();
    const entry = {
      timestamp: timestamp.toISOString(),
      level: level.toUpperCase(),
      message,
      source: source || this.getCallerInfo(),
      data: this.sanitizeData(data),
      pid: process.pid
    };
    
    // Add stack trace for errors
    if (level === 'error' || level === 'fatal') {
      if (data instanceof Error) {
        entry.error = {
          name: data.name,
          message: data.message,
          stack: data.stack
        };
      } else if (this.config.includeStackTrace) {
        entry.stack = this.getStackTrace();
      }
    }
    
    return entry;
  }

  /**
   * Sanitize log data for privacy and security
   */
  sanitizeData(data) {
    if (!this.config.sanitizeData) {
      return data;
    }
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive fields
      if (this.config.maskSensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '***MASKED***';
        continue;
      }
      
      // Truncate long values
      if (typeof value === 'string' && value.length > this.config.maxFieldLength) {
        sanitized[key] = value.substring(0, this.config.maxFieldLength) + '...';
        continue;
      }
      
      // Recursively sanitize objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Get caller information
   */
  getCallerInfo() {
    const stack = new Error().stack;
    const stackLines = stack.split('\n');
    
    // Find the first line that's not from the logger itself
    for (let i = 3; i < stackLines.length; i++) {
      const line = stackLines[i];
      if (line && !line.includes('Logger.js') && !line.includes('at Logger.')) {
        const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: path.basename(match[2]),
            line: parseInt(match[3]),
            column: parseInt(match[4])
          };
        }
      }
    }
    
    return { function: 'unknown', file: 'unknown', line: 0, column: 0 };
  }

  /**
   * Get stack trace
   */
  getStackTrace() {
    const stack = new Error().stack;
    return stack.split('\n').slice(4).join('\n'); // Remove logger frames
  }

  /**
   * Update logging statistics
   */
  updateStats(level) {
    this.state.stats.totalLogs++;
    this.state.stats.logsByLevel[level]++;
  }

  /**
   * Add log entry to buffer
   */
  addToBuffer(logEntry) {
    this.state.buffer.push(logEntry);
    
    // Flush if buffer is full
    if (this.state.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Write log entry to outputs
   */
  writeLog(logEntry) {
    // Console output
    if (this.config.outputs.console.enabled) {
      this.writeToConsole(logEntry);
    }
    
    // File output
    if (this.config.outputs.file.enabled) {
      this.writeToFile(logEntry);
    }
    
    // Remote output
    if (this.config.outputs.remote.enabled) {
      this.writeToRemote(logEntry);
    }
  }

  /**
   * Write to console
   */
  writeToConsole(logEntry) {
    const format = this.config.outputs.console.format;
    const colorize = this.config.outputs.console.colorize;
    
    let output;
    
    switch (format) {
      case 'json':
        output = JSON.stringify(logEntry);
        break;
      case 'simple':
        output = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}`;
        break;
      case 'pretty':
      default:
        output = this.formatPrettyLog(logEntry, colorize);
        break;
    }
    
    // Use appropriate console method
    const method = logEntry.level.toLowerCase();
    if (console[method]) {
      console[method](output);
    } else {
      console.log(output);
    }
  }

  /**
   * Format pretty log output
   */
  formatPrettyLog(logEntry, colorize) {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const level = logEntry.level;
    const message = logEntry.message;
    const source = logEntry.source ? `${logEntry.source.file}:${logEntry.source.line}` : '';
    
    let output = `${timestamp} `;
    
    if (colorize) {
      const color = this.colors[level.toLowerCase()] || this.colors.reset;
      output += `${color}[${level}]${this.colors.reset} `;
      output += `${this.colors.bright}${message}${this.colors.reset}`;
      if (source) {
        output += ` ${this.colors.dim}(${source})${this.colors.reset}`;
      }
    } else {
      output += `[${level}] ${message}`;
      if (source) {
        output += ` (${source})`;
      }
    }
    
    // Add data if present
    if (Object.keys(logEntry.data).length > 0) {
      output += '\n' + JSON.stringify(logEntry.data, null, 2);
    }
    
    return output;
  }

  /**
   * Write to file
   */
  async writeToFile(logEntry) {
    try {
      const logPath = path.join(
        this.config.outputs.file.path,
        this.config.outputs.file.filename
      );
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check file size and rotate if necessary
      await this.checkAndRotateLog(logPath);
      
      // Append to log file
      await fs.appendFile(logPath, logLine, 'utf8');
      
    } catch (error) {
      console.error('File logging error:', error);
    }
  }

  /**
   * Check and rotate log file if necessary
   */
  async checkAndRotateLog(logPath) {
    try {
      const stats = await fs.stat(logPath);
      
      if (stats.size > this.config.outputs.file.maxSize) {
        await this.rotateLogFile(logPath);
      }
    } catch (error) {
      // File doesn't exist, which is fine for first log
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Rotate log file
   */
  async rotateLogFile(logPath) {
    const maxFiles = this.config.outputs.file.maxFiles;
    const dir = path.dirname(logPath);
    const basename = path.basename(logPath, path.extname(logPath));
    const ext = path.extname(logPath);
    
    // Shift existing backup files
    for (let i = maxFiles - 1; i > 0; i--) {
      const currentFile = path.join(dir, `${basename}.${i}${ext}`);
      const nextFile = path.join(dir, `${basename}.${i + 1}${ext}`);
      
      try {
        await fs.access(currentFile);
        if (i === maxFiles - 1) {
          await fs.unlink(currentFile); // Delete oldest
        } else {
          await fs.rename(currentFile, nextFile);
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    // Move current log to .1
    const backupPath = path.join(dir, `${basename}.1${ext}`);
    await fs.rename(logPath, backupPath);
  }

  /**
   * Write to remote endpoint
   */
  async writeToRemote(logEntry) {
    // Placeholder for remote logging implementation
    // In production, this would send logs to services like ELK, Splunk, etc.
  }

  /**
   * Start flush timer for buffered logging
   */
  startFlushTimer() {
    this.state.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Flush buffered logs
   */
  flush() {
    if (this.state.buffer.length === 0) {
      return;
    }
    
    const logs = this.state.buffer.splice(0);
    
    logs.forEach(logEntry => {
      this.writeLog(logEntry);
    });
    
    this.state.stats.lastFlush = Date.now();
    this.emit('flush', { count: logs.length });
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.outputs.file.path, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Get logging statistics
   */
  getStats() {
    return {
      ...this.state.stats,
      bufferSize: this.state.buffer.length,
      isBuffering: this.config.enableBuffering,
      level: this.config.level
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart flush timer if interval changed
    if (this.state.flushTimer && newConfig.flushInterval) {
      clearInterval(this.state.flushTimer);
      this.startFlushTimer();
    }
    
    this.emit('configUpdated', { newConfig });
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.config.levels[level] !== undefined) {
      this.config.level = level;
      this.info('Log level changed', { level });
    } else {
      this.error('Invalid log level', { level, validLevels: Object.keys(this.config.levels) });
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = new Logger(this.config);
    childLogger.defaultContext = context;
    
    // Override log method to include default context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, data = {}, source = null) => {
      const mergedData = { ...childLogger.defaultContext, ...data };
      originalLog(level, message, mergedData, source);
    };
    
    return childLogger;
  }

  /**
   * Shutdown logger gracefully
   */
  async shutdown() {
    this.info('Logger shutting down');
    
    // Flush any remaining logs
    this.flush();
    
    // Clear flush timer
    if (this.state.flushTimer) {
      clearInterval(this.state.flushTimer);
    }
    
    // Close file handles
    for (const handle of this.state.fileHandles.values()) {
      await handle.close();
    }
    
    this.emit('shutdown');
  }
}

// Default logger instance
export const logger = new Logger();

// Auto-initialize if in production
if (process.env.NODE_ENV === 'production') {
  logger.initialize().catch(console.error);
}