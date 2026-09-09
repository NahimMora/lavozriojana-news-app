-- AlterTable: authors — campos de E-E-A-T (cargo, especialidad, redes, email, tipo de firma)
ALTER TABLE `authors`
  ADD COLUMN `role` VARCHAR(160) NULL,
  ADD COLUMN `specialty` VARCHAR(160) NULL,
  ADD COLUMN `email` VARCHAR(180) NULL,
  ADD COLUMN `socialLinks` JSON NULL,
  ADD COLUMN `isInstitutional` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: post_sources
CREATE TABLE `post_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `url` VARCHAR(500) NULL,
    `type` ENUM('OFICIAL', 'ORGANISMO_PUBLICO', 'MEDIO', 'COMUNICADO', 'ENTREVISTA', 'DOCUMENTO', 'REDES_SOCIALES', 'ELABORACION_PROPIA') NOT NULL DEFAULT 'MEDIO',
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_sources_postId_order_idx`(`postId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4;

-- CreateTable: contact_messages
CREATE TABLE `contact_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('NEW', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `ipHash` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contact_messages_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4;

-- AddForeignKey
ALTER TABLE `post_sources` ADD CONSTRAINT `post_sources_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
