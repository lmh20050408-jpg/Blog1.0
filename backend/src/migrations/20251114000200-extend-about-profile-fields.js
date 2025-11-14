'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT id, key, value FROM "configs" WHERE key = :key LIMIT 1',
      { replacements: { key: 'about_profile' } }
    );

    // 定义要追加的新字段（仅在缺失时添加）
    const additions = {
      location: '',
      website: '',
      resumeUrl: '',
      contacts: { email: '', phone: '', wechat: '' },
      interests: [],
      languages: [],
      projects: [
        // { name: '', link: '', description: '' }
      ],
    };

    const mergeIfMissing = (obj, extra) => {
      const result = Array.isArray(obj) || typeof obj !== 'object' || obj === null ? {} : { ...obj };
      for (const [k, v] of Object.entries(extra)) {
        if (result[k] === undefined) {
          result[k] = v;
        } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          // 嵌套对象，做浅层递归合并（仅补缺）
          result[k] = mergeIfMissing(result[k], v);
        }
      }
      return result;
    };

    if (rows && rows.length > 0) {
      const row = rows[0];
      let current;
      try {
        current = row.value ? JSON.parse(row.value) : {};
      } catch (e) {
        current = {};
      }

      const next = mergeIfMissing(current, additions);

      // 仅当有变化时写回
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        await queryInterface.sequelize.query(
          'UPDATE "configs" SET value = :value, updated_at = :now WHERE key = :key',
          {
            replacements: {
              key: 'about_profile',
              value: JSON.stringify(next),
              now: new Date(),
            },
          }
        );
      }
    } else {
      // 若不存在 about_profile，则创建一个带新增字段的默认对象（与先前策略保持一致）
      const payload = {
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
        education: [],
        ...additions,
      };

      await queryInterface.sequelize.query(
        'INSERT INTO "configs" ("key", "value", "type", "description", "is_public", "created_at", "updated_at") VALUES (:key, :value, :type, :description, :isPublic, :createdAt, :updatedAt) ON CONFLICT ("key") DO NOTHING',
        {
          replacements: {
            key: 'about_profile',
            value: JSON.stringify(payload),
            type: 'json',
            description: '关于页面配置数据',
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const removeKeys = ['location', 'website', 'resumeUrl', 'contacts', 'interests', 'languages', 'projects'];

    const [rows] = await queryInterface.sequelize.query(
      'SELECT id, key, value FROM "configs" WHERE key = :key LIMIT 1',
      { replacements: { key: 'about_profile' } }
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      let current;
      try {
        current = row.value ? JSON.parse(row.value) : {};
      } catch (e) {
        current = {};
      }

      let changed = false;
      for (const k of removeKeys) {
        if (k in current) {
          delete current[k];
          changed = true;
        }
      }
      if (changed) {
        await queryInterface.sequelize.query(
          'UPDATE "configs" SET value = :value, updated_at = :now WHERE key = :key',
          {
            replacements: {
              key: 'about_profile',
              value: JSON.stringify(current),
              now: new Date(),
            },
          }
        );
      }
    }
  }
};
