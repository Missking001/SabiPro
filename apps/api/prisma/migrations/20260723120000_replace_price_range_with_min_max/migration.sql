-- Replace priceRange string with priceRangeMin and priceRangeMax Int fields

ALTER TABLE "Provider" DROP COLUMN IF EXISTS "priceRange";
ALTER TABLE "Provider" ADD COLUMN "priceRangeMin" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "priceRangeMax" INTEGER;
