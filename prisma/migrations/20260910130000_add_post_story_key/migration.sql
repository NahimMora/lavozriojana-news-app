-- AlterTable: posts — storyKey opcional (historia longitudinal asignada por
-- el Story Engine del autopublicador). Nullable, sin default: aditiva y
-- backward-compatible, no toca notas existentes.
ALTER TABLE `posts` ADD COLUMN `storyKey` VARCHAR(160) NULL;

-- CreateIndex
CREATE INDEX `posts_storyKey_publishedAt_idx` ON `posts`(`storyKey`, `publishedAt`);
