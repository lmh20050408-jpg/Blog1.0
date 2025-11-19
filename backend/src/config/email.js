const nodemailer = require('nodemailer');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * 创建 Nodemailer 传输器
 * 配置 126 邮箱 SMTP 连接（smtp.126.com:465）
 */
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure, // true for 465, false for other ports
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });

    // 根据环境变量决定是否进行传输器验证（开发环境中常常没有可用 SMTP）
    const skipVerify = process.env.SKIP_SMTP_VERIFY === 'true'
      || !config.smtp.host
      || !config.smtp.auth?.user
      || !config.smtp.auth?.pass

    if (skipVerify) {
      logger.info('Email transporter verification skipped (SKIP_SMTP_VERIFY or incomplete config)');
    } else {
      // 验证传输器配置
      transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('Email transporter is ready to send messages');
        }
      });
    }

    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter:', error);
    throw error;
  }
};

// 创建并导出传输器实例
const transporter = createTransporter();

module.exports = {
  transporter,
  from: config.smtp.from,
};
