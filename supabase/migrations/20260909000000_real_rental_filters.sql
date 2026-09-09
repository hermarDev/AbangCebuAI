-- AbangCebu Real-World Rental Filters & Inventory Schema
-- Generated according to ABANGCEBU_AI_AGENT_REAL_RENTAL_FILTERS_SPEC.md

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create rentals table
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  monthly_rent NUMERIC(10, 2) NOT NULL CHECK (monthly_rent >= 0),
  property_type TEXT NOT NULL CHECK (
    property_type IN ('bedspace', 'boarding_house', 'private_room', 'shared_room', 'studio', 'apartment', 'condo', 'house')
  ),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  barangay TEXT,
  city TEXT NOT NULL DEFAULT 'Cebu City',
  location_text TEXT,

  -- Occupancy
  min_occupants INTEGER NOT NULL DEFAULT 1 CHECK (min_occupants >= 1),
  max_occupants INTEGER NOT NULL DEFAULT 1 CHECK (max_occupants >= min_occupants),

  -- Room & Bathroom (Unknown = NULL)
  bathroom_type TEXT CHECK (bathroom_type IN ('private', 'shared')),
  aircon BOOLEAN,
  electric_fan BOOLEAN,
  terrace BOOLEAN,
  furnishing_type TEXT CHECK (furnishing_type IN ('unfurnished', 'semi_furnished', 'furnished')),

  -- Policies (Unknown = NULL)
  tenant_policy TEXT NOT NULL DEFAULT 'any' CHECK (tenant_policy IN ('any', 'female_only', 'male_only', 'mixed')),
  curfew_type TEXT NOT NULL DEFAULT 'none' CHECK (curfew_type IN ('none', 'fixed', 'conditional')),
  curfew_time TEXT,
  visitors_policy TEXT CHECK (visitors_policy IN ('allowed', 'restricted', 'not_allowed')),
  pets_allowed BOOLEAN,
  children_allowed BOOLEAN,
  smoking_allowed BOOLEAN,

  -- Daily living
  cooking_allowed BOOLEAN,
  laundry_allowed BOOLEAN,
  kitchen_available BOOLEAN,
  laundry_area BOOLEAN,

  -- Internet
  wifi_available BOOLEAN,
  wifi_included BOOLEAN,
  wfh_suitable BOOLEAN,
  internet_speed_mbps INTEGER,

  -- Utilities
  water_pricing_type TEXT CHECK (water_pricing_type IN ('included', 'fixed', 'per_person', 'metered')),
  water_fee NUMERIC(10, 2),
  electricity_pricing_type TEXT CHECK (electricity_pricing_type IN ('included', 'submetered', 'fixed')),
  electricity_rate_per_kwh NUMERIC(10, 2),
  electricity_fixed_fee NUMERIC(10, 2),

  -- Parking
  motorcycle_parking BOOLEAN,
  car_parking BOOLEAN,
  bicycle_parking BOOLEAN,

  -- Contract
  advance_months INTEGER,
  deposit_months INTEGER,
  available_from DATE,
  minimum_stay_months INTEGER,

  -- Security
  gated BOOLEAN,
  cctv BOOLEAN,
  security_guard BOOLEAN,
  own_entrance BOOLEAN,
  well_lit_entrance BOOLEAN,

  -- Flood Information
  landlord_reports_no_flooding BOOLEAN,

  -- Trust & Verification
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (
    verification_status IN ('unverified', 'identity_verified', 'property_verified', 'fully_verified')
  ),
  direct_landlord BOOLEAN NOT NULL DEFAULT true,
  exact_location_verified BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  available BOOLEAN NOT NULL DEFAULT true,
  basis TEXT NOT NULL DEFAULT 'room' CHECK (basis IN ('room', 'bed')),
  area NUMERIC(6, 2),
  tone TEXT NOT NULL DEFAULT 'sand' CHECK (tone IN ('sage', 'sand', 'clay', 'blue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ DEFAULT now(),

  -- PostGIS geometry column generated from lat/lng
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED
);

-- 2. Spatial and search indexes
CREATE INDEX IF NOT EXISTS idx_rentals_geom ON public.rentals USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_rentals_monthly_rent ON public.rentals (monthly_rent);
CREATE INDEX IF NOT EXISTS idx_rentals_property_type ON public.rentals (property_type);
CREATE INDEX IF NOT EXISTS idx_rentals_published_at ON public.rentals (published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rentals_available ON public.rentals (available) WHERE available = true;

-- 3. Row Level Security (RLS)
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for published and available rentals"
  ON public.rentals
  FOR SELECT
  USING (published_at IS NOT NULL AND available = true);

-- 4. PostGIS RPC search function
CREATE OR REPLACE FUNCTION public.search_rentals(
  p_center_lng DOUBLE PRECISION,
  p_center_lat DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_property_types TEXT[] DEFAULT NULL,
  p_occupants INTEGER DEFAULT NULL,
  p_bathroom_type TEXT DEFAULT NULL,
  p_tenant_policy TEXT DEFAULT NULL,
  p_cooking_allowed BOOLEAN DEFAULT NULL,
  p_laundry_allowed BOOLEAN DEFAULT NULL,
  p_curfew_none BOOLEAN DEFAULT NULL,
  p_wifi_available BOOLEAN DEFAULT NULL,
  p_aircon BOOLEAN DEFAULT NULL,
  p_motorcycle_parking BOOLEAN DEFAULT NULL,
  p_car_parking BOOLEAN DEFAULT NULL,
  p_water_included BOOLEAN DEFAULT NULL,
  p_power_included BOOLEAN DEFAULT NULL,
  p_verified_only BOOLEAN DEFAULT NULL,
  p_direct_landlord_only BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  monthly_rent NUMERIC,
  property_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  locality TEXT,
  barangay TEXT,
  city TEXT,
  min_occupants INTEGER,
  max_occupants INTEGER,
  bathroom_type TEXT,
  aircon BOOLEAN,
  electric_fan BOOLEAN,
  terrace BOOLEAN,
  furnishing_type TEXT,
  tenant_policy TEXT,
  curfew_type TEXT,
  curfew_time TEXT,
  visitors_policy TEXT,
  pets_allowed BOOLEAN,
  cooking_allowed BOOLEAN,
  laundry_allowed BOOLEAN,
  wifi_available BOOLEAN,
  wifi_included BOOLEAN,
  water_pricing_type TEXT,
  electricity_pricing_type TEXT,
  motorcycle_parking BOOLEAN,
  car_parking BOOLEAN,
  advance_months INTEGER,
  deposit_months INTEGER,
  verification_status TEXT,
  direct_landlord BOOLEAN,
  exact_location_verified BOOLEAN,
  basis TEXT,
  area NUMERIC,
  tone TEXT,
  available BOOLEAN,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    r.title,
    r.description,
    r.monthly_rent,
    r.property_type,
    r.latitude,
    r.longitude,
    COALESCE(r.location_text, r.barangay || ', ' || r.city, r.city) AS locality,
    r.barangay,
    r.city,
    r.min_occupants,
    r.max_occupants,
    r.bathroom_type,
    r.aircon,
    r.electric_fan,
    r.terrace,
    r.furnishing_type,
    r.tenant_policy,
    r.curfew_type,
    r.curfew_time,
    r.visitors_policy,
    r.pets_allowed,
    r.cooking_allowed,
    r.laundry_allowed,
    r.wifi_available,
    r.wifi_included,
    r.water_pricing_type,
    r.electricity_pricing_type,
    r.motorcycle_parking,
    r.car_parking,
    r.advance_months,
    r.deposit_months,
    r.verification_status,
    r.direct_landlord,
    r.exact_location_verified,
    r.basis,
    r.area,
    r.tone,
    r.available,
    ST_Distance(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(p_center_lng, p_center_lat), 4326)::geography
    ) AS distance_meters
  FROM public.rentals r
  WHERE
    r.published_at IS NOT NULL
    AND r.available = true
    AND ST_DWithin(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(p_center_lng, p_center_lat), 4326)::geography,
      p_radius_meters
    )
    AND (p_min_price IS NULL OR r.monthly_rent >= p_min_price)
    AND (p_max_price IS NULL OR r.monthly_rent <= p_max_price)
    AND (p_property_types IS NULL OR cardinality(p_property_types) = 0 OR r.property_type = ANY(p_property_types))
    AND (p_occupants IS NULL OR r.max_occupants >= p_occupants)
    AND (p_bathroom_type IS NULL OR r.bathroom_type = p_bathroom_type)
    AND (p_tenant_policy IS NULL OR p_tenant_policy = 'any' OR r.tenant_policy = p_tenant_policy OR r.tenant_policy = 'any' OR r.tenant_policy = 'mixed')
    AND (p_cooking_allowed IS NULL OR r.cooking_allowed = true)
    AND (p_laundry_allowed IS NULL OR r.laundry_allowed = true)
    AND (p_curfew_none IS NULL OR r.curfew_type = 'none')
    AND (p_wifi_available IS NULL OR r.wifi_available = true)
    AND (p_aircon IS NULL OR r.aircon = true)
    AND (p_motorcycle_parking IS NULL OR r.motorcycle_parking = true)
    AND (p_car_parking IS NULL OR r.car_parking = true)
    AND (p_water_included IS NULL OR r.water_pricing_type = 'included')
    AND (p_power_included IS NULL OR r.electricity_pricing_type = 'included')
    AND (p_verified_only IS NULL OR r.verification_status IN ('property_verified', 'fully_verified'))
    AND (p_direct_landlord_only IS NULL OR r.direct_landlord = true)
  ORDER BY distance_meters ASC, r.monthly_rent ASC
  LIMIT p_limit;
$$;
