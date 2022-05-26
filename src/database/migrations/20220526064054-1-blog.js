'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.tableExists('blog');
    if (exists) {
      return;
    }

    await queryInterface.createTable('blog', {
      id: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: false
      },
      content: {
        type: Sequelize.STRING(10000),
        allowNull: false,
        unique: false
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true,
        unique: false
      },
      image: {
        type: Sequelize.STRING(150),
        allowNull: true,
        unique: false
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('blog');
  }
};
