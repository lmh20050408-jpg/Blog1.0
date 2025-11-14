'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
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
      education: []
    };

    // 使用原生 SQL 以支持 Postgres 的 ON CONFLICT
    const sql = `
      INSERT INTO "configs" ("key", "value", "type", "description", "is_public", "created_at", "updated_at")
      VALUES (:key, :value, 'json', :description, true, :createdAt, :updatedAt)
      ON CONFLICT ("key") DO NOTHING;
    `;

    await queryInterface.sequelize.query(sql, {
      replacements: {
        key: 'about_profile',
        value: JSON.stringify(payload),
        description: '关于页面配置数据',
        createdAt: now,
        updatedAt: now,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'DELETE FROM "configs" WHERE "key" = :key',
      { replacements: { key: 'about_profile' } }
    );
  }
};
