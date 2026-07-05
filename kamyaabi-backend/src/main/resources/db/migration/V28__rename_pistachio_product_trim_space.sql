-- Migration to handle trailing space when renaming "Premium Roasted & Salted Pistachio"
UPDATE products 
SET name = 'Premium Roasted & Salted Pistachios (Pista) | Kamyaabi Dry Fruits' 
WHERE TRIM(name) = 'Premium Roasted & Salted Pistachio' 
  AND category_id = (SELECT id FROM categories WHERE UPPER(name) = 'PISTACHIO' LIMIT 1);
