-- Function to search food items by location
CREATE OR REPLACE FUNCTION search_food_items_nearby(
  user_lat DECIMAL,
  user_lon DECIMAL,
  search_radius INTEGER,
  search_category UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  image_url TEXT,
  is_available BOOLEAN,
  inventory_count INTEGER,
  allow_purchase BOOLEAN,
  business_id UUID,
  business_name TEXT,
  business_type TEXT,
  phone_number TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance DECIMAL,
  category_id UUID,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fi.id,
    fi.name,
    fi.description,
    fi.price,
    fi.image_url,
    fi.is_available,
    fi.inventory_count,
    fi.allow_purchase,
    b.id as business_id,
    b.business_name,
    b.business_type,
    b.phone_number,
    b.address,
    b.latitude,
    b.longitude,
    calculate_distance(user_lat, user_lon, b.latitude, b.longitude) as distance,
    c.id as category_id,
    c.name as category_name
  FROM food_items fi
  JOIN businesses b ON fi.business_id = b.id
  LEFT JOIN categories c ON fi.category_id = c.id
  WHERE 
    b.is_active = true
    AND fi.is_available = true
    AND calculate_distance(user_lat, user_lon, b.latitude, b.longitude) <= search_radius
    AND (
      search_category IS NULL OR
      fi.category_id = search_category
    )
    AND (search_query IS NULL OR 
         fi.name ILIKE '%' || search_query || '%' OR
         fi.description ILIKE '%' || search_query || '%' OR
         b.business_name ILIKE '%' || search_query || '%')
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;