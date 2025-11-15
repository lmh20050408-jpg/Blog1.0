const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// 确保IP访问日志目录存在
const ipLogDir = path.join(process.cwd(), 'logs');
const ipLogFile = path.join(ipLogDir, 'ip-access.log');

// 创建日志目录（如果不存在）
if (!fs.existsSync(ipLogDir)) {
  fs.mkdirSync(ipLogDir, { recursive: true });
}

// IP访问日志格式
const ipLogFormat = (req, res, next) => {
  // 更简洁的IP获取方式
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'unknown';
  const referer = req.get('Referer') || 'direct';
  
  // 格式化日志条目
  const logEntry = `${timestamp} | IP: ${clientIP} | ${method} ${url} | UA: ${userAgent} | Ref: ${referer}\n`;
  
  // 异步写入文件，不阻塞请求
  fs.promises.appendFile(ipLogFile, logEntry).catch(err => {
    logger.error('Failed to write IP access log:', err);
  });
  
  // 同时记录到主日志
  logger.info(`Access from IP: ${clientIP} - ${method} ${url}`);
  
  next();
};

module.exports = ipLogFormat;