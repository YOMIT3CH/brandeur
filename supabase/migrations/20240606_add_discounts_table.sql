-- Create discounts table for vendor discount codes
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_order DECIMAL(10,2) DEFAULT 0,
    expires_at TIMESTAMP,
    max_uses INTEGER,
    uses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discounts_vendor_id ON discounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own discounts"
    ON discounts FOR SELECT
    USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create their own discounts"
    ON discounts FOR INSERT
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own discounts"
    ON discounts FOR UPDATE
    USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own discounts"
    ON discounts FOR DELETE
    USING (auth.uid() = vendor_id);

-- Public can view active discounts (for validation during checkout)
CREATE POLICY "Public can view active discounts"
    ON discounts FOR SELECT
    USING (true);

-- Add discount columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
