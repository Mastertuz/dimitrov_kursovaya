-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT NOT NULL DEFAULT 'brand1',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'black',
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'unisex',
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "material" TEXT NOT NULL DEFAULT 'cotton',
ADD COLUMN     "oldPrice" DECIMAL(10,2),
ADD COLUMN     "season" TEXT NOT NULL DEFAULT 'demi',
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
