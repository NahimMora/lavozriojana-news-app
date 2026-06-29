-- CreateTable
CREATE TABLE `categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NOT NULL,
  `description` VARCHAR(280) NULL,
  `color` VARCHAR(24) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `categories_slug_key`(`slug`),
  INDEX `categories_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authors` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `bio` TEXT NULL,
  `avatarUrl` VARCHAR(500) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `authors_slug_key`(`slug`),
  INDEX `authors_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(240) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `excerpt` TEXT NOT NULL,
  `contentHtml` LONGTEXT NOT NULL,
  `contentText` LONGTEXT NOT NULL,
  `categoryId` INTEGER NOT NULL,
  `authorId` INTEGER NOT NULL,
  `sourceName` VARCHAR(180) NULL,
  `sourceUrl` VARCHAR(500) NULL,
  `mainImageUrl` VARCHAR(500) NULL,
  `mainImageWidth` INTEGER NULL,
  `mainImageHeight` INTEGER NULL,
  `mainImageAlt` VARCHAR(240) NULL,
  `mainImageCaption` VARCHAR(320) NULL,
  `mainImageCredit` VARCHAR(180) NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(320) NULL,
  `ogTitle` VARCHAR(255) NULL,
  `ogDescription` VARCHAR(320) NULL,
  `ogImageUrl` VARCHAR(500) NULL,
  `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  `isBreaking` BOOLEAN NOT NULL DEFAULT false,
  `editorialPriority` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `viewCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `posts_slug_key`(`slug`),
  INDEX `posts_status_publishedAt_idx`(`status`, `publishedAt`),
  INDEX `posts_categoryId_publishedAt_idx`(`categoryId`, `publishedAt`),
  INDEX `posts_authorId_idx`(`authorId`),
  INDEX `posts_isFeatured_status_publishedAt_idx`(`isFeatured`, `status`, `publishedAt`),
  INDEX `posts_isBreaking_status_publishedAt_idx`(`isBreaking`, `status`, `publishedAt`),
  INDEX `posts_viewCount_idx`(`viewCount`),
  FULLTEXT INDEX `posts_title_excerpt_contentText_idx`(`title`, `excerpt`, `contentText`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `tags_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tags` (
  `postId` INTEGER NOT NULL,
  `tagId` INTEGER NOT NULL,
  INDEX `post_tags_tagId_idx`(`tagId`),
  PRIMARY KEY (`postId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(500) NOT NULL,
  `alt` VARCHAR(240) NULL,
  `caption` VARCHAR(320) NULL,
  `credit` VARCHAR(180) NULL,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `mimeType` VARCHAR(120) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `media_assets_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `slot` ENUM('HOME_TOP', 'HOME_MIDDLE', 'SIDEBAR', 'ARTICLE_INLINE', 'ARTICLE_AFTER_CONTENT', 'FOOTER', 'CATEGORY_TOP', 'SEARCH_TOP') NOT NULL,
  `imageUrl` VARCHAR(500) NULL,
  `linkUrl` VARCHAR(500) NULL,
  `altText` VARCHAR(240) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `priority` INTEGER NOT NULL DEFAULT 0,
  `impressionCount` INTEGER NOT NULL DEFAULT 0,
  `clickCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `banners_slot_isActive_priority_idx`(`slot`, `isActive`, `priority`),
  INDEX `banners_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `postId` INTEGER NOT NULL,
  `authorName` VARCHAR(120) NOT NULL,
  `body` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `ipHash` VARCHAR(128) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `comments_postId_status_createdAt_idx`(`postId`, `status`, `createdAt`),
  INDEX `comments_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phone_leads` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NULL,
  `phone` VARCHAR(40) NOT NULL,
  `consent` BOOLEAN NOT NULL DEFAULT true,
  `source` VARCHAR(240) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `phone_leads_phone_idx`(`phone`),
  INDEX `phone_leads_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_views` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `postId` INTEGER NOT NULL,
  `ipHash` VARCHAR(128) NULL,
  `userAgentHash` VARCHAR(128) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `page_views_postId_createdAt_idx`(`postId`, `createdAt`),
  INDEX `page_views_ipHash_postId_createdAt_idx`(`ipHash`, `postId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `static_pages` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(160) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `contentHtml` LONGTEXT NOT NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` VARCHAR(320) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `static_pages_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redirects` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `fromSlug` VARCHAR(220) NOT NULL,
  `toSlug` VARCHAR(220) NOT NULL,
  `postId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `redirects_fromSlug_key`(`fromSlug`),
  INDEX `redirects_toSlug_idx`(`toSlug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `page_views` ADD CONSTRAINT `page_views_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redirects` ADD CONSTRAINT `redirects_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
