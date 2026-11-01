<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261027214052 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE board (id BINARY(16) NOT NULL, type VARCHAR(32) NOT NULL, name VARCHAR(120) NOT NULL, currency CHAR(3) NOT NULL, settings JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, archived_at DATETIME DEFAULT NULL, owner_id BINARY(16) NOT NULL, INDEX idx_board_owner_type (owner_id, type), INDEX IDX_58562B477E3C61F9 (owner_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE board_link (id BINARY(16) NOT NULL, type VARCHAR(32) NOT NULL, params JSON NOT NULL, active_from DATE NOT NULL, active_to DATE DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, source_board_id BINARY(16) NOT NULL, target_board_id BINARY(16) NOT NULL, member_id BINARY(16) DEFAULT NULL, INDEX idx_board_link_target (target_board_id, active_from), INDEX IDX_EC3AC0D2A4CC6157 (source_board_id), INDEX IDX_EC3AC0D23D4787EC (target_board_id), INDEX IDX_EC3AC0D27597D3FE (member_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE board_member (id BINARY(16) NOT NULL, display_name VARCHAR(80) NOT NULL, role VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL, joined_at DATETIME DEFAULT NULL, left_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, board_id BINARY(16) NOT NULL, user_id BINARY(16) DEFAULT NULL, UNIQUE INDEX uniq_board_member_user (board_id, user_id), INDEX IDX_DCFABEDFE7EC5785 (board_id), INDEX IDX_DCFABEDFA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE budget_item (id BINARY(16) NOT NULL, kind VARCHAR(32) NOT NULL, label VARCHAR(120) NOT NULL, position INT DEFAULT 0 NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, archived_at DATETIME DEFAULT NULL, board_id BINARY(16) NOT NULL, created_by_id BINARY(16) DEFAULT NULL, INDEX idx_budget_item_board_position (board_id, position), INDEX IDX_65DF274EE7EC5785 (board_id), INDEX IDX_65DF274EB03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE budget_item_adjustment (id BINARY(16) NOT NULL, created_at DATETIME NOT NULL, period DATE NOT NULL, type VARCHAR(32) NOT NULL, amount_cents BIGINT DEFAULT NULL, params JSON NOT NULL, note VARCHAR(255) DEFAULT NULL, item_id BINARY(16) NOT NULL, created_by_id BINARY(16) DEFAULT NULL, UNIQUE INDEX uniq_adjustment_item_period (item_id, period), INDEX IDX_90B88219126F525E (item_id), INDEX IDX_90B88219B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE budget_item_revision (id BINARY(16) NOT NULL, created_at DATETIME NOT NULL, effective_from DATE NOT NULL, recurrence_type VARCHAR(32) NOT NULL, recurrence_params JSON NOT NULL, allocation VARCHAR(32) NOT NULL, end_period DATE DEFAULT NULL, due_day SMALLINT DEFAULT NULL, amount_cents BIGINT NOT NULL, currency CHAR(3) NOT NULL, item_id BINARY(16) NOT NULL, paid_by_member_id BINARY(16) DEFAULT NULL, created_by_id BINARY(16) DEFAULT NULL, UNIQUE INDEX uniq_revision_item_period (item_id, effective_from), INDEX IDX_A3F20E33126F525E (item_id), INDEX IDX_A3F20E332F321756 (paid_by_member_id), INDEX IDX_A3F20E33B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE budget_item_tag (id BINARY(16) NOT NULL, created_at DATETIME NOT NULL, item_id BINARY(16) NOT NULL, tag_id BINARY(16) NOT NULL, UNIQUE INDEX uniq_budget_item_tag (item_id, tag_id), INDEX IDX_33539D15126F525E (item_id), INDEX IDX_33539D15BAD26311 (tag_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE domain_event (id BINARY(16) NOT NULL, occurred_at DATETIME NOT NULL, aggregate_type VARCHAR(64) NOT NULL, aggregate_id BINARY(16) NOT NULL, type VARCHAR(64) NOT NULL, payload JSON NOT NULL, actor_id BINARY(16) DEFAULT NULL, INDEX idx_domain_event_aggregate (aggregate_type, aggregate_id, occurred_at), INDEX IDX_E8D5227110DAF24A (actor_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE expense (id BINARY(16) NOT NULL, voided_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, label VARCHAR(120) NOT NULL, spent_on DATE NOT NULL, split_strategy VARCHAR(32) NOT NULL, amount_cents BIGINT NOT NULL, currency CHAR(3) NOT NULL, board_id BINARY(16) NOT NULL, paid_by_member_id BINARY(16) NOT NULL, tag_id BINARY(16) DEFAULT NULL, supersedes_id BINARY(16) DEFAULT NULL, created_by_id BINARY(16) DEFAULT NULL, INDEX idx_expense_board_spent (board_id, spent_on), INDEX IDX_2D3A8DA6E7EC5785 (board_id), INDEX IDX_2D3A8DA62F321756 (paid_by_member_id), INDEX IDX_2D3A8DA6BAD26311 (tag_id), INDEX IDX_2D3A8DA67A7685A8 (supersedes_id), INDEX IDX_2D3A8DA6B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE expense_share (id BINARY(16) NOT NULL, amount_cents BIGINT NOT NULL, input_value BIGINT DEFAULT NULL, expense_id BINARY(16) NOT NULL, member_id BINARY(16) NOT NULL, UNIQUE INDEX uniq_expense_share_member (expense_id, member_id), INDEX IDX_4C0E3A60F395DB7B (expense_id), INDEX IDX_4C0E3A607597D3FE (member_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE invitation (id BINARY(16) NOT NULL, email VARCHAR(180) DEFAULT NULL, channel VARCHAR(32) NOT NULL, token_hash VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, expires_at DATETIME NOT NULL, max_uses INT DEFAULT 1 NOT NULL, use_count INT DEFAULT 0 NOT NULL, accepted_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, board_id BINARY(16) NOT NULL, member_id BINARY(16) NOT NULL, invited_by_id BINARY(16) DEFAULT NULL, accepted_by_id BINARY(16) DEFAULT NULL, INDEX idx_invitation_board_status (board_id, status), UNIQUE INDEX uniq_invitation_token_hash (token_hash), INDEX IDX_F11D61A2E7EC5785 (board_id), INDEX IDX_F11D61A27597D3FE (member_id), INDEX IDX_F11D61A2A7B4A7E3 (invited_by_id), INDEX IDX_F11D61A220F699D9 (accepted_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE settlement (id BINARY(16) NOT NULL, voided_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, settled_on DATE NOT NULL, note VARCHAR(255) DEFAULT NULL, amount_cents BIGINT NOT NULL, currency CHAR(3) NOT NULL, board_id BINARY(16) NOT NULL, from_member_id BINARY(16) NOT NULL, to_member_id BINARY(16) NOT NULL, created_by_id BINARY(16) DEFAULT NULL, INDEX idx_settlement_board (board_id, settled_on), INDEX IDX_DD9F1B51E7EC5785 (board_id), INDEX IDX_DD9F1B51650B4644 (from_member_id), INDEX IDX_DD9F1B514434048F (to_member_id), INDEX IDX_DD9F1B51B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE split_rule (id BINARY(16) NOT NULL, created_at DATETIME NOT NULL, effective_from DATE NOT NULL, strategy VARCHAR(32) NOT NULL, board_id BINARY(16) NOT NULL, item_id BINARY(16) DEFAULT NULL, created_by_id BINARY(16) DEFAULT NULL, INDEX idx_split_rule_board_period (board_id, effective_from), INDEX IDX_DA514DE7E7EC5785 (board_id), INDEX IDX_DA514DE7126F525E (item_id), INDEX IDX_DA514DE7B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE split_rule_entry (id BINARY(16) NOT NULL, value BIGINT DEFAULT NULL, split_rule_id BINARY(16) NOT NULL, member_id BINARY(16) NOT NULL, UNIQUE INDEX uniq_split_entry_member (split_rule_id, member_id), INDEX IDX_F9941E0F935753E5 (split_rule_id), INDEX IDX_F9941E0F7597D3FE (member_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tag (id BINARY(16) NOT NULL, name VARCHAR(50) NOT NULL, color VARCHAR(32) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, owner_user_id BINARY(16) DEFAULT NULL, owner_board_id BINARY(16) DEFAULT NULL, UNIQUE INDEX uniq_tag_user_color (owner_user_id, color), UNIQUE INDEX uniq_tag_board_color (owner_board_id, color), INDEX IDX_389B7832B18554A (owner_user_id), INDEX IDX_389B783F10CEE46 (owner_board_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (id BINARY(16) NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, username VARCHAR(90) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, email_verified_at DATETIME DEFAULT NULL, firstname VARCHAR(80) DEFAULT NULL, is_verified TINYINT DEFAULT NULL, lastname VARCHAR(80) DEFAULT NULL, avatar VARCHAR(255) DEFAULT NULL, settings JSON DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME (username), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_request (id BINARY(16) NOT NULL, code VARCHAR(20) DEFAULT NULL, token VARCHAR(128) DEFAULT NULL, type VARCHAR(40) NOT NULL, payload JSON DEFAULT NULL, is_used TINYINT DEFAULT 0 NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id BINARY(16) NOT NULL, INDEX idx_user_request_token (token), INDEX idx_user_request_code (code), INDEX IDX_639A9195A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE board ADD CONSTRAINT FK_58562B477E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_link ADD CONSTRAINT FK_EC3AC0D2A4CC6157 FOREIGN KEY (source_board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_link ADD CONSTRAINT FK_EC3AC0D23D4787EC FOREIGN KEY (target_board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_link ADD CONSTRAINT FK_EC3AC0D27597D3FE FOREIGN KEY (member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_member ADD CONSTRAINT FK_DCFABEDFE7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE board_member ADD CONSTRAINT FK_DCFABEDFA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE budget_item ADD CONSTRAINT FK_65DF274EE7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE budget_item ADD CONSTRAINT FK_65DF274EB03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE budget_item_adjustment ADD CONSTRAINT FK_90B88219126F525E FOREIGN KEY (item_id) REFERENCES budget_item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE budget_item_adjustment ADD CONSTRAINT FK_90B88219B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE budget_item_revision ADD CONSTRAINT FK_A3F20E33126F525E FOREIGN KEY (item_id) REFERENCES budget_item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE budget_item_revision ADD CONSTRAINT FK_A3F20E332F321756 FOREIGN KEY (paid_by_member_id) REFERENCES board_member (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE budget_item_revision ADD CONSTRAINT FK_A3F20E33B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE budget_item_tag ADD CONSTRAINT FK_33539D15126F525E FOREIGN KEY (item_id) REFERENCES budget_item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE budget_item_tag ADD CONSTRAINT FK_33539D15BAD26311 FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE domain_event ADD CONSTRAINT FK_E8D5227110DAF24A FOREIGN KEY (actor_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE expense ADD CONSTRAINT FK_2D3A8DA6E7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE expense ADD CONSTRAINT FK_2D3A8DA62F321756 FOREIGN KEY (paid_by_member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE expense ADD CONSTRAINT FK_2D3A8DA6BAD26311 FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE expense ADD CONSTRAINT FK_2D3A8DA67A7685A8 FOREIGN KEY (supersedes_id) REFERENCES expense (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE expense ADD CONSTRAINT FK_2D3A8DA6B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE expense_share ADD CONSTRAINT FK_4C0E3A60F395DB7B FOREIGN KEY (expense_id) REFERENCES expense (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE expense_share ADD CONSTRAINT FK_4C0E3A607597D3FE FOREIGN KEY (member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2E7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A27597D3FE FOREIGN KEY (member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A220F699D9 FOREIGN KEY (accepted_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE settlement ADD CONSTRAINT FK_DD9F1B51E7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE settlement ADD CONSTRAINT FK_DD9F1B51650B4644 FOREIGN KEY (from_member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE settlement ADD CONSTRAINT FK_DD9F1B514434048F FOREIGN KEY (to_member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE settlement ADD CONSTRAINT FK_DD9F1B51B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE split_rule ADD CONSTRAINT FK_DA514DE7E7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE split_rule ADD CONSTRAINT FK_DA514DE7126F525E FOREIGN KEY (item_id) REFERENCES budget_item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE split_rule ADD CONSTRAINT FK_DA514DE7B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE split_rule_entry ADD CONSTRAINT FK_F9941E0F935753E5 FOREIGN KEY (split_rule_id) REFERENCES split_rule (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE split_rule_entry ADD CONSTRAINT FK_F9941E0F7597D3FE FOREIGN KEY (member_id) REFERENCES board_member (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tag ADD CONSTRAINT FK_389B7832B18554A FOREIGN KEY (owner_user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tag ADD CONSTRAINT FK_389B783F10CEE46 FOREIGN KEY (owner_board_id) REFERENCES board (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_request ADD CONSTRAINT FK_639A9195A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE board DROP FOREIGN KEY FK_58562B477E3C61F9');
        $this->addSql('ALTER TABLE board_link DROP FOREIGN KEY FK_EC3AC0D2A4CC6157');
        $this->addSql('ALTER TABLE board_link DROP FOREIGN KEY FK_EC3AC0D23D4787EC');
        $this->addSql('ALTER TABLE board_link DROP FOREIGN KEY FK_EC3AC0D27597D3FE');
        $this->addSql('ALTER TABLE board_member DROP FOREIGN KEY FK_DCFABEDFE7EC5785');
        $this->addSql('ALTER TABLE board_member DROP FOREIGN KEY FK_DCFABEDFA76ED395');
        $this->addSql('ALTER TABLE budget_item DROP FOREIGN KEY FK_65DF274EE7EC5785');
        $this->addSql('ALTER TABLE budget_item DROP FOREIGN KEY FK_65DF274EB03A8386');
        $this->addSql('ALTER TABLE budget_item_adjustment DROP FOREIGN KEY FK_90B88219126F525E');
        $this->addSql('ALTER TABLE budget_item_adjustment DROP FOREIGN KEY FK_90B88219B03A8386');
        $this->addSql('ALTER TABLE budget_item_revision DROP FOREIGN KEY FK_A3F20E33126F525E');
        $this->addSql('ALTER TABLE budget_item_revision DROP FOREIGN KEY FK_A3F20E332F321756');
        $this->addSql('ALTER TABLE budget_item_revision DROP FOREIGN KEY FK_A3F20E33B03A8386');
        $this->addSql('ALTER TABLE budget_item_tag DROP FOREIGN KEY FK_33539D15126F525E');
        $this->addSql('ALTER TABLE budget_item_tag DROP FOREIGN KEY FK_33539D15BAD26311');
        $this->addSql('ALTER TABLE domain_event DROP FOREIGN KEY FK_E8D5227110DAF24A');
        $this->addSql('ALTER TABLE expense DROP FOREIGN KEY FK_2D3A8DA6E7EC5785');
        $this->addSql('ALTER TABLE expense DROP FOREIGN KEY FK_2D3A8DA62F321756');
        $this->addSql('ALTER TABLE expense DROP FOREIGN KEY FK_2D3A8DA6BAD26311');
        $this->addSql('ALTER TABLE expense DROP FOREIGN KEY FK_2D3A8DA67A7685A8');
        $this->addSql('ALTER TABLE expense DROP FOREIGN KEY FK_2D3A8DA6B03A8386');
        $this->addSql('ALTER TABLE expense_share DROP FOREIGN KEY FK_4C0E3A60F395DB7B');
        $this->addSql('ALTER TABLE expense_share DROP FOREIGN KEY FK_4C0E3A607597D3FE');
        $this->addSql('ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A2E7EC5785');
        $this->addSql('ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A27597D3FE');
        $this->addSql('ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A2A7B4A7E3');
        $this->addSql('ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A220F699D9');
        $this->addSql('ALTER TABLE settlement DROP FOREIGN KEY FK_DD9F1B51E7EC5785');
        $this->addSql('ALTER TABLE settlement DROP FOREIGN KEY FK_DD9F1B51650B4644');
        $this->addSql('ALTER TABLE settlement DROP FOREIGN KEY FK_DD9F1B514434048F');
        $this->addSql('ALTER TABLE settlement DROP FOREIGN KEY FK_DD9F1B51B03A8386');
        $this->addSql('ALTER TABLE split_rule DROP FOREIGN KEY FK_DA514DE7E7EC5785');
        $this->addSql('ALTER TABLE split_rule DROP FOREIGN KEY FK_DA514DE7126F525E');
        $this->addSql('ALTER TABLE split_rule DROP FOREIGN KEY FK_DA514DE7B03A8386');
        $this->addSql('ALTER TABLE split_rule_entry DROP FOREIGN KEY FK_F9941E0F935753E5');
        $this->addSql('ALTER TABLE split_rule_entry DROP FOREIGN KEY FK_F9941E0F7597D3FE');
        $this->addSql('ALTER TABLE tag DROP FOREIGN KEY FK_389B7832B18554A');
        $this->addSql('ALTER TABLE tag DROP FOREIGN KEY FK_389B783F10CEE46');
        $this->addSql('ALTER TABLE user_request DROP FOREIGN KEY FK_639A9195A76ED395');
        $this->addSql('DROP TABLE board');
        $this->addSql('DROP TABLE board_link');
        $this->addSql('DROP TABLE board_member');
        $this->addSql('DROP TABLE budget_item');
        $this->addSql('DROP TABLE budget_item_adjustment');
        $this->addSql('DROP TABLE budget_item_revision');
        $this->addSql('DROP TABLE budget_item_tag');
        $this->addSql('DROP TABLE domain_event');
        $this->addSql('DROP TABLE expense');
        $this->addSql('DROP TABLE expense_share');
        $this->addSql('DROP TABLE invitation');
        $this->addSql('DROP TABLE settlement');
        $this->addSql('DROP TABLE split_rule');
        $this->addSql('DROP TABLE split_rule_entry');
        $this->addSql('DROP TABLE tag');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE user_request');
    }
}
