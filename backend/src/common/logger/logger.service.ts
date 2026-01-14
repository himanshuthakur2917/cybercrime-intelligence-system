import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Custom Logger Service with colored terminal output
 * Provides consistent logging across all controllers and services
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  };

  private context = 'Application';

  setContext(context: string) {
    this.context = context;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = this.getTimestamp();
    const ctx = context || this.context;
    return `${this.colors.dim}[${timestamp}]${this.colors.reset} ${level} ${this.colors.yellow}[${ctx}]${this.colors.reset} ${message}`;
  }

  /**
   * Log success message - Green colored
   */
  success(message: string, context?: string): void {
    const level = `${this.colors.bgGreen}${this.colors.white}${this.colors.bright} SUCCESS ${this.colors.reset}`;
    console.log(
      this.formatMessage(
        level,
        `${this.colors.green}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log general info message - Blue colored
   */
  log(message: string, context?: string): void {
    const level = `${this.colors.bgBlue}${this.colors.white}${this.colors.bright}  INFO   ${this.colors.reset}`;
    console.log(
      this.formatMessage(
        level,
        `${this.colors.blue}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log error message - Red colored
   */
  error(message: string, trace?: string, context?: string): void {
    const level = `${this.colors.bgRed}${this.colors.white}${this.colors.bright}  ERROR  ${this.colors.reset}`;
    console.error(
      this.formatMessage(
        level,
        `${this.colors.red}${message}${this.colors.reset}`,
        context,
      ),
    );
    if (trace) {
      console.error(`${this.colors.dim}${trace}${this.colors.reset}`);
    }
  }

  /**
   * Log warning message - Yellow colored
   */
  warn(message: string, context?: string): void {
    const level = `${this.colors.bgYellow}${this.colors.white}${this.colors.bright}  WARN   ${this.colors.reset}`;
    console.warn(
      this.formatMessage(
        level,
        `${this.colors.yellow}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log debug message - Magenta colored
   */
  debug(message: string, context?: string): void {
    const level = `${this.colors.magenta}${this.colors.bright} DEBUG  ${this.colors.reset}`;
    console.debug(
      this.formatMessage(
        level,
        `${this.colors.magenta}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log verbose message - Cyan colored
   */
  verbose(message: string, context?: string): void {
    const level = `${this.colors.cyan} VERBOSE ${this.colors.reset}`;
    console.log(
      this.formatMessage(
        level,
        `${this.colors.cyan}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log failed operation - Red with special formatting
   */
  failed(message: string, context?: string): void {
    const level = `${this.colors.bgRed}${this.colors.white}${this.colors.bright} FAILED  ${this.colors.reset}`;
    console.error(
      this.formatMessage(
        level,
        `${this.colors.red}${this.colors.bright}${message}${this.colors.reset}`,
        context,
      ),
    );
  }

  /**
   * Log HTTP request
   */
  request(method: string, url: string, context?: string): void {
    const methodColor = this.getMethodColor(method);
    const level = `${this.colors.cyan}${this.colors.bright}   →    ${this.colors.reset}`;
    console.log(
      this.formatMessage(
        level,
        `${methodColor}${method}${this.colors.reset} ${url}`,
        context || 'HTTP',
      ),
    );
  }

  /**
   * Log HTTP response
   */
  response(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: string,
  ): void {
    const statusColor = statusCode >= 400 ? this.colors.red : this.colors.green;
    const level = `${statusColor}${this.colors.bright}   ←    ${this.colors.reset}`;
    console.log(
      this.formatMessage(
        level,
        `${this.getMethodColor(method)}${method}${this.colors.reset} ${url} ${statusColor}${statusCode}${this.colors.reset} ${this.colors.dim}${duration}ms${this.colors.reset}`,
        context || 'HTTP',
      ),
    );
  }

  private getMethodColor(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return this.colors.green;
      case 'POST':
        return this.colors.blue;
      case 'PUT':
      case 'PATCH':
        return this.colors.yellow;
      case 'DELETE':
        return this.colors.red;
      default:
        return this.colors.white;
    }
  }

  /**
   * Print startup banner
   */
  printBanner(port: number | string): void {
    console.log('');
    console.log(
      `${this.colors.cyan}${this.colors.bright}╔════════════════════════════════════════════════════════════════╗${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}                                                                  ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}   ${this.colors.green}${this.colors.bright}🔍 CYBERCRIME INTELLIGENCE SYSTEM${this.colors.reset}                          ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}   ${this.colors.dim}Backend API Server${this.colors.reset}                                        ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}                                                                  ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}╠════════════════════════════════════════════════════════════════╣${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}                                                                  ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}   ${this.colors.yellow}Server:${this.colors.reset}     http://localhost:${port}                          ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}   ${this.colors.yellow}Status:${this.colors.reset}     ${this.colors.green}● Running${this.colors.reset}                                    ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}   ${this.colors.yellow}Mode:${this.colors.reset}       ${process.env.NODE_ENV || 'development'}                                 ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}║${this.colors.reset}                                                                  ${this.colors.cyan}${this.colors.bright}║${this.colors.reset}`,
    );
    console.log(
      `${this.colors.cyan}${this.colors.bright}╚════════════════════════════════════════════════════════════════╝${this.colors.reset}`,
    );
    console.log('');
  }
}
