<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261028015633 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remplace la colonne JSON user.roles par une colonne VARCHAR(50) user.role (RoleEnum)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE user ADD role VARCHAR(50) DEFAULT 'ROLE_USER' NOT NULL");
        $this->addSql("UPDATE user SET role = 'ROLE_ADMIN' WHERE JSON_CONTAINS(roles, '\"ROLE_ADMIN\"')");
        $this->addSql('ALTER TABLE user CHANGE role role VARCHAR(50) NOT NULL, DROP roles');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD roles JSON DEFAULT NULL');
        $this->addSql('UPDATE user SET roles = JSON_ARRAY(role)');
        $this->addSql('ALTER TABLE user CHANGE roles roles JSON NOT NULL, DROP role');
    }
}
