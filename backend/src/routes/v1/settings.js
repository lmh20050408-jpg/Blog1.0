const express = require('express');
const router = express.Router();
const RateLimitMiddleware = require('../../middlewares/rateLimit');
const configService = require('../../services/configService');
const statsController = require('../../controllers/statsController');
const { generateFileUrl } = require('../../utils/urlHelper');

// 公开：网站配置（兼容前端已有调用）
router.get('/site', RateLimitMiddleware.api(), async (req, res, next) => {
  try {
    const [name, description, footer, logo, url, social] = await Promise.all([
      configService.getConfig('site_name'),
      configService.getConfig('site_description'),
      configService.getConfig('site_footer'),
      configService.getConfig('site_logo'),
      configService.getConfig('site_url'),
      configService.getConfig('site_social'), // 期望为 json
    ]);

    res.status(200).json({
      success: true,
      data: {
        siteName: name?.value || '',
        siteDescription: description?.value || '',
        siteLogo: logo?.value || '',
        siteUrl: url?.value || '',
        footerText: footer?.value || '',
        socialLinks: (social?.value || {})
      }
    });
  } catch (error) {
    next(error);
  }
});

// 公开：SEO 配置
router.get('/seo', RateLimitMiddleware.api(), async (req, res, next) => {
  try {
    const [title, desc, keywords, og] = await Promise.all([
      configService.getConfig('seo_title'),
      configService.getConfig('seo_description'),
      configService.getConfig('seo_keywords'), // 可为逗号分隔或数组
      configService.getConfig('seo_og_image'),
    ]);

    const kw = Array.isArray(keywords?.value)
      ? keywords.value
      : (typeof keywords?.value === 'string' && keywords.value
          ? keywords.value.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    res.status(200).json({
      success: true,
      data: {
        defaultTitle: title?.value || '',
        defaultDescription: desc?.value || '',
        defaultKeywords: kw,
        ogImage: og?.value || ''
      }
    });
  } catch (error) {
    next(error);
  }
});

// 公开：统计数据（直接复用现有 controller）
router.get('/stats', RateLimitMiddleware.api(), statsController.getStats);

// 公开：关于页资料
router.get('/about', RateLimitMiddleware.api(), async (req, res, next) => {
  try {
    const about = await configService.getConfig('about_profile');

    // 默认值，避免前端空指针
    const defaultProfile = {
      name: '',
      title: '',
      avatar: '/images/avatar.png',
      bio: ['', '', ''],
      socialLinks: [
        { name: 'twitter', url: '' },
        { name: 'linkedin', url: '' },
        { name: 'github', url: '' },
        { name: 'email', url: '' }
      ],
      skills: [
        { category: '前端', items: [] },
        { category: '后端', items: [] },
        { category: '工具', items: [] }
      ],
      experience: [],
      education: []
    };

    const payload = about?.value || defaultProfile;
    // 仅对 /uploads 开头的资源做 URL 拼接；其他（如前端内置 /images）保持原样
    if (payload && typeof payload.avatar === 'string' && payload.avatar.startsWith('/uploads')) {
      payload.avatar = generateFileUrl(payload.avatar, req);
    }

    res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
