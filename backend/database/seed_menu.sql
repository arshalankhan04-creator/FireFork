-- Seed categories + menu items extracted from menu.html
-- Prices are stored as DECIMAL(10,2) in INR.

BEGIN;

INSERT INTO categories (name, display_order) VALUES
  ('Starters', 1),
  ('Mains', 2),
  ('Sides & Sauces', 3),
  ('Sweet Endings', 4)
ON CONFLICT (name) DO NOTHING;

-- Helper: grab category ids
WITH cat AS (
  SELECT
    (SELECT id FROM categories WHERE name = 'Starters') AS starters,
    (SELECT id FROM categories WHERE name = 'Mains') AS mains,
    (SELECT id FROM categories WHERE name = 'Sides & Sauces') AS sides,
    (SELECT id FROM categories WHERE name = 'Sweet Endings') AS desserts
)
INSERT INTO menu_items (category_id, name, description, price, is_veg, image_url)
SELECT * FROM (
  -- Starters (Non-Veg)
  SELECT cat.starters, 'Bone Marrow Brulée', 'Roasted marrow with a chili-garlic crust, served with sourdough crostini.', 1500.00, FALSE, 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Wagyu Carpaccio (Imported)', 'Paper-thin slices, caper berries, Grana Padano, and a drizzle of truffle oil.', 2000.00, FALSE, 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Lamb Riblets', 'Slow-cooked for 12 hours, glazed in a spicy tamarind and jaggery reduction.', 1650.00, FALSE, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9581ba?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Charred Octopus', 'Wood-fired with chorizo butter and a chickpea purée.', 1850.00, FALSE, 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Starters (Veg)
  UNION ALL SELECT cat.starters, 'Smoked Burrata', 'Coal-fired heirloom tomatoes, basil pesto, and balsamic pearls.', 1350.00, TRUE, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Truffle Mushroom Pâté', 'Creamy forest mushrooms served with grilled baguette and onion jam.', 1150.00, TRUE, 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Cauliflower \"Wings\"', 'Tempura battered, tossed in a fermented chili and lime glaze.', 1000.00, TRUE, 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.starters, 'Hearth-Roasted Asparagus', 'Topped with toasted hazelnuts and a lemon-tahini dressing.', 1100.00, TRUE, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Mains (Non-Veg)
  UNION ALL SELECT cat.mains, 'The Signature Tenderloin (Buff)', '21-day dry-aged, grass-fed. Served with roasted garlic.', 5400.00, FALSE, 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'Dukkah-Crusted Lamb Rack', 'New Zealand lamb chops with a Middle Eastern spice crust and mint jus.', 4000.00, FALSE, 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'Smoked Spatchcock Chicken', 'Half a bird marinated in peri-peri and rosemary, finished over charcoal.', 2650.00, FALSE, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'The \"Iron\" T-Bone', 'A massive 600g cut for the serious carnivore, seared at 400°C.', 6000.00, FALSE, 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Mains (Veg)
  UNION ALL SELECT cat.mains, 'The King Oyster Steak', 'Thick-cut mushroom \"scallops\" pan-seared in garlic butter and thyme.', 2350.00, TRUE, 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'Tandoori Portobello Slab', 'Large grilled mushrooms stuffed with herbed goat cheese.', 2150.00, TRUE, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'Cauliflower \"Steak\" (The OG)', 'A cross-section of cauliflower, charred and served over a bed of romesco sauce.', 2000.00, TRUE, 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.mains, 'Cottage Cheese \"Ribs\"', 'Compressed paneer blocks, hickory-smoked and basted in a BBQ-makhani fusion sauce.', 2100.00, TRUE, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Sides & Sauces (Non-Veg)
  UNION ALL SELECT cat.sides, 'Truffle Parm Fries', 'Hand-cut fries tossed with truffle oil and Parmesan.', 750.00, FALSE, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Bone Marrow Mash', 'Creamy mashed potatoes enriched with roasted bone marrow.', 900.00, FALSE, 'https://images.unsplash.com/photo-1585238341710-4a9b7a5e2b8f?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Creamed Spinach with Nutmeg', 'Classic steakhouse side with a hint of fresh nutmeg.', 650.00, FALSE, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Sauces (Non-Veg)', 'Cognac Peppercorn, Red Wine Jus, Bearnaise, Bhut Jolokia (Ghost Pepper) Butter.', 350.00, FALSE, 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Sides & Sauces (Veg)
  UNION ALL SELECT cat.sides, 'Gunpowder Baby Potatoes', 'Crispy roasted potatoes tossed in South Indian spice blend.', 650.00, TRUE, 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Honey-Glazed Carrots', 'Roasted heritage carrots with wildflower honey and thyme.', 750.00, TRUE, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Mac & Cheese', 'Three-cheese blend with a crusty herb crumble topping.', 850.00, TRUE, 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.sides, 'Sauces (Veg)', 'Chimichurri, Mushroom Gravy, Lemon Herb Butter, Roasted Garlic Aioli.', 350.00, TRUE, 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Sweet Endings (Non-Veg container)
  UNION ALL SELECT cat.desserts, 'Dark Chocolate Fondant', 'With a molten salted caramel center and vanilla bean gelato.', 1150.00, FALSE, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.desserts, 'Whiskey Bread Pudding', 'Brioche soaked in custard and topped with a bourbon-toffee glaze.', 1100.00, FALSE, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?q=80&w=600&auto=format&fit=crop' FROM cat

  -- Sweet Endings (Veg container)
  UNION ALL SELECT cat.desserts, 'Grilled Pineapple Tarte Tatin', 'Caramelized pineapple on puff pastry with coconut sorbet.', 1000.00, TRUE, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop' FROM cat
  UNION ALL SELECT cat.desserts, 'Saffron & Pistachio Cheesecake', 'A deconstructed baked cheesecake with an Indian floral twist.', 1100.00, TRUE, 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=600&auto=format&fit=crop' FROM cat
) AS rows(category_id, name, description, price, is_veg, image_url)
ON CONFLICT DO NOTHING;

COMMIT;

