-- Migration to rename "Premium Roasted & Salted Pistachio" to match the other pistachio product names for variant grouping.
UPDATE products 
SET name = 'Premium Roasted & Salted Pistachios (Pista) | Kamyaabi Dry Fruits' 
WHERE name = 'Premium Roasted & Salted Pistachio' 
  AND category_id = (SELECT id FROM categories WHERE UPPER(name) = 'PISTACHIO' LIMIT 1);
