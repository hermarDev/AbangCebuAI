import "server-only";

import type {
  BathroomType,
  CurfewType,
  ElectricityPricingType,
  FurnishingType,
  PropertyType,
  TenantPolicy,
  VisitorsPolicy,
  WaterPricingType,
} from "@/contracts/rental-filters";

export interface ParsedField<T> {
  value: T | null;
  confidence: number;
  sourceText?: string;
}

export interface NormalizedRentalDraft {
  monthlyRent: ParsedField<number>;
  minOccupants: ParsedField<number>;
  maxOccupants: ParsedField<number>;
  propertyType: ParsedField<PropertyType>;
  bathroomType: ParsedField<BathroomType>;
  aircon: ParsedField<boolean>;
  electricFan: ParsedField<boolean>;
  terrace: ParsedField<boolean>;
  furnishingType: ParsedField<FurnishingType>;
  tenantPolicy: ParsedField<TenantPolicy>;
  curfewType: ParsedField<CurfewType>;
  visitorsPolicy: ParsedField<VisitorsPolicy>;
  petsAllowed: ParsedField<boolean>;
  cookingAllowed: ParsedField<boolean>;
  laundryAllowed: ParsedField<boolean>;
  wifiAvailable: ParsedField<boolean>;
  wifiIncluded: ParsedField<boolean>;
  waterPricingType: ParsedField<WaterPricingType>;
  waterFee: ParsedField<number>;
  electricityPricingType: ParsedField<ElectricityPricingType>;
  electricityRatePerKwh: ParsedField<number>;
  advanceMonths: ParsedField<number>;
  depositMonths: ParsedField<number>;
  locationText: ParsedField<string>;
}

/**
 * Normalizes unstructured Facebook or marketplace rental post text into structured attributes.
 * Follows Section 42 & 43 of ABANGCEBU_AI_AGENT_REAL_RENTAL_FILTERS_SPEC.md.
 * 
 * Safety Rule: Unmentioned attributes MUST evaluate to null with 0 confidence.
 * Never infer missing details as false.
 */
export function normalizeRentalPost(rawText: string): NormalizedRentalDraft {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  const emptyField = <T>(): ParsedField<T> => ({ value: null, confidence: 0 });

  // 1. Monthly Rent
  let monthlyRent: ParsedField<number> = emptyField();
  const priceMatch = lower.match(/(?:(?:₱|php|rent\s*(?:is|at|:|of)?)\s*([\d,]+)|\b([\d,]{4,6})\s*(?:\/mo|per month|monthly|\/month)?\b)/);
  if (priceMatch) {
    const rawVal = (priceMatch[1] || priceMatch[2]).replace(/,/g, "");
    const num = Number(rawVal);
    if (Number.isFinite(num) && num >= 500 && num <= 100000) {
      monthlyRent = { value: num, confidence: 0.9, sourceText: priceMatch[0] };
    }
  }

  // 2. Occupancy (pax / heads / borders)
  let minOccupants: ParsedField<number> = emptyField();
  let maxOccupants: ParsedField<number> = emptyField();
  const paxRangeMatch = lower.match(/(?:good for|up to|max(?:imum)? of)?\s*(\d)\s*(?:to|-)\s*(\d)\s*(?:pax|heads?|borders?|persons?|people)/);
  if (paxRangeMatch) {
    minOccupants = { value: Number(paxRangeMatch[1]), confidence: 0.95, sourceText: paxRangeMatch[0] };
    maxOccupants = { value: Number(paxRangeMatch[2]), confidence: 0.95, sourceText: paxRangeMatch[0] };
  } else {
    const singlePaxMatch = lower.match(/(?:good for|solo|single|\bfor\b)\s*(\d)?\s*(?:pax|heads?|borders?|person|people)/);
    if (singlePaxMatch) {
      const count = singlePaxMatch[1] ? Number(singlePaxMatch[1]) : 1;
      minOccupants = { value: count, confidence: 0.85, sourceText: singlePaxMatch[0] };
      maxOccupants = { value: count, confidence: 0.85, sourceText: singlePaxMatch[0] };
    }
  }

  // 3. Property Type
  let propertyType: ParsedField<PropertyType> = emptyField();
  if (/\b(?:bedspace|bed space|bed-space)\b/.test(lower)) {
    propertyType = { value: "bedspace", confidence: 0.95, sourceText: "bedspace" };
  } else if (/\b(?:boarding house|bh|boarding)\b/.test(lower)) {
    propertyType = { value: "boarding_house", confidence: 0.9, sourceText: "boarding house" };
  } else if (/\b(?:studio|studio-type|studio type)\b/.test(lower)) {
    propertyType = { value: "studio", confidence: 0.95, sourceText: "studio" };
  } else if (/\b(?:apartment|apt)\b/.test(lower)) {
    propertyType = { value: "apartment", confidence: 0.9, sourceText: "apartment" };
  } else if (/\b(?:condo|condominium)\b/.test(lower)) {
    propertyType = { value: "condo", confidence: 0.95, sourceText: "condo" };
  } else if (/\b(?:private room|solo room|single room)\b/.test(lower)) {
    propertyType = { value: "private_room", confidence: 0.9, sourceText: "private room" };
  } else if (/\b(?:shared room)\b/.test(lower)) {
    propertyType = { value: "shared_room", confidence: 0.9, sourceText: "shared room" };
  }

  // 4. Bathroom (CR)
  let bathroomType: ParsedField<BathroomType> = emptyField();
  if (/(?:own|private|exclusive|inside)\s*(?:cr|comfort room|bath|toilet)/.test(lower)) {
    bathroomType = { value: "private", confidence: 0.95, sourceText: "own cr" };
  } else if (/(?:common|shared)\s*(?:cr|comfort room|bath|toilet)/.test(lower)) {
    bathroomType = { value: "shared", confidence: 0.95, sourceText: "common cr" };
  }

  // 5. Aircon & Fan
  let aircon: ParsedField<boolean> = emptyField();
  if (/(?:no\s*ac|no\s*aircon|non-aircon|non aircon|without ac)/.test(lower)) {
    aircon = { value: false, confidence: 0.95, sourceText: "no ac" };
  } else if (/(?:with\s*ac|with\s*aircon|airconditioned|air-conditioned|\bac\b|\baircon\b)/.test(lower)) {
    aircon = { value: true, confidence: 0.9, sourceText: "aircon" };
  }

  let electricFan: ParsedField<boolean> = emptyField();
  if (/(?:fan only|electric fan|with fan)/.test(lower)) {
    electricFan = { value: true, confidence: 0.85, sourceText: "electric fan" };
  }

  // 6. Terrace / Balcony
  let terrace: ParsedField<boolean> = emptyField();
  if (/(?:with\s*terrace|with\s*balcony|terrace|balcony)/.test(lower)) {
    terrace = { value: true, confidence: 0.9, sourceText: "terrace/balcony" };
  }

  // 7. Tenant Policy
  let tenantPolicy: ParsedField<TenantPolicy> = emptyField();
  if (/(?:female only|female borders?|ladies only|for female|all female|babaye ra)/.test(lower)) {
    tenantPolicy = { value: "female_only", confidence: 0.95, sourceText: "female only" };
  } else if (/(?:male only|male borders?|boys only|for male|all male|lalaki ra)/.test(lower)) {
    tenantPolicy = { value: "male_only", confidence: 0.95, sourceText: "male only" };
  } else if (/(?:girls and boys|boys and girls|mixed|all genders?|couple allowed|open for all)/.test(lower)) {
    tenantPolicy = { value: "mixed", confidence: 0.9, sourceText: "mixed" };
  }

  // 8. Daily Living (Cooking & Laundry)
  let cookingAllowed: ParsedField<boolean> = emptyField();
  if (/(?:can cook|cooking allowed|pwede (?:mag)?luto|allowed to cook)/.test(lower)) {
    cookingAllowed = { value: true, confidence: 0.95, sourceText: "can cook" };
  } else if (/(?:no cooking|bawal (?:mag)?luto|cooking not allowed)/.test(lower)) {
    cookingAllowed = { value: false, confidence: 0.95, sourceText: "no cooking" };
  }

  let laundryAllowed: ParsedField<boolean> = emptyField();
  if (/(?:can do laundry|can wash|laundry allowed|pwede (?:mag)?laba|laundry area)/.test(lower)) {
    laundryAllowed = { value: true, confidence: 0.9, sourceText: "can do laundry" };
  } else if (/(?:no laundry|bawal (?:mag)?laba)/.test(lower)) {
    laundryAllowed = { value: false, confidence: 0.95, sourceText: "no laundry" };
  }

  // 9. Curfew
  let curfewType: ParsedField<CurfewType> = emptyField();
  if (/(?:no curfew|way curfew|walang curfew|24\/7 access)/.test(lower)) {
    curfewType = { value: "none", confidence: 0.95, sourceText: "no curfew" };
  } else if (/(?:curfew|has curfew|with curfew)/.test(lower)) {
    curfewType = { value: "fixed", confidence: 0.85, sourceText: "curfew" };
  }

  // 10. Utilities (Water & Electricity)
  let waterPricingType: ParsedField<WaterPricingType> = emptyField();
  let waterFee: ParsedField<number> = emptyField();
  if (/(?:free water|water included|apil tubig|libre tubig)/.test(lower)) {
    waterPricingType = { value: "included", confidence: 0.95, sourceText: "free water" };
  } else {
    const waterPerHeadMatch = lower.match(/(?:tubig|water)\s*[:\-]?\s*(\d+)\s*(?:per head|\/head|\/person|each)/);
    if (waterPerHeadMatch) {
      waterPricingType = { value: "per_person", confidence: 0.95, sourceText: waterPerHeadMatch[0] };
      waterFee = { value: Number(waterPerHeadMatch[1]), confidence: 0.95, sourceText: waterPerHeadMatch[0] };
    }
  }

  let electricityPricingType: ParsedField<ElectricityPricingType> = emptyField();
  let electricityRatePerKwh: ParsedField<number> = emptyField();
  if (/(?:free electricity|power included|apil kuryente|free light)/.test(lower)) {
    electricityPricingType = { value: "included", confidence: 0.95, sourceText: "free electricity" };
  } else {
    const kwhMatch = lower.match(/(?:kuryente|electricity|power|rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:\/kwh|kwh|per kwh)/);
    if (kwhMatch) {
      electricityPricingType = { value: "submetered", confidence: 0.95, sourceText: kwhMatch[0] };
      electricityRatePerKwh = { value: Number(kwhMatch[1]), confidence: 0.95, sourceText: kwhMatch[0] };
    } else if (/(?:submeter|sub-meter|sub metered|submetered)/.test(lower)) {
      electricityPricingType = { value: "submetered", confidence: 0.9, sourceText: "submeter" };
    }
  }

  // 11. Move-in Advance & Deposit
  let advanceMonths: ParsedField<number> = emptyField();
  let depositMonths: ParsedField<number> = emptyField();
  const advDepMatch = lower.match(/(\d)\s*(?:month|mos?)?\s*(?:adv(?:ance)?)\s*(?:and|,|&)?\s*(\d)\s*(?:month|mos?)?\s*(?:depo(?:sit)?)/);
  if (advDepMatch) {
    advanceMonths = { value: Number(advDepMatch[1]), confidence: 0.95, sourceText: advDepMatch[0] };
    depositMonths = { value: Number(advDepMatch[2]), confidence: 0.95, sourceText: advDepMatch[0] };
  }

  // 12. Wi-Fi
  let wifiAvailable: ParsedField<boolean> = emptyField();
  let wifiIncluded: ParsedField<boolean> = emptyField();
  if (/(?:free wi-?fi|wifi included|free internet)/.test(lower)) {
    wifiAvailable = { value: true, confidence: 0.95, sourceText: "free wifi" };
    wifiIncluded = { value: true, confidence: 0.95, sourceText: "free wifi" };
  } else if (/(?:wi-?fi available|with wi-?fi|\bwifi\b|\bwi-fi\b)/.test(lower)) {
    wifiAvailable = { value: true, confidence: 0.9, sourceText: "wifi available" };
  }

  // 13. Location
  let locationText: ParsedField<string> = emptyField();
  const locMatch = text.match(/(?:location|located at|loc|near|address)\s*[:\-]?\s*([^\n,]+(?:,\s*[^\n,]+)*)/i);
  if (locMatch && locMatch[1]) {
    locationText = { value: locMatch[1].trim(), confidence: 0.8, sourceText: locMatch[0] };
  }

  return {
    monthlyRent,
    minOccupants,
    maxOccupants,
    propertyType,
    bathroomType,
    aircon,
    electricFan,
    terrace,
    furnishingType: emptyField(),
    tenantPolicy,
    curfewType,
    visitorsPolicy: emptyField(),
    petsAllowed: emptyField(),
    cookingAllowed,
    laundryAllowed,
    wifiAvailable,
    wifiIncluded,
    waterPricingType,
    waterFee,
    electricityPricingType,
    electricityRatePerKwh,
    advanceMonths,
    depositMonths,
    locationText,
  };
}
