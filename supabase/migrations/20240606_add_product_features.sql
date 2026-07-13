-- Add image_urls column to products table for multi-image support
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add tags column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add variants column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
