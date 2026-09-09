"use client";

import {
  Bath,
  CheckCircle2,
  Clock,
  Droplet,
  Info,
  Key,
  ShieldCheck,
  Users,
  Utensils,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Rental } from "@/contracts/preview";
import { RoomIllustration } from "@/features/listings/rental-card";
import { formatPrice } from "@/features/search/preview-search";

export interface FinderDetailsDialogProps {
  rental: Rental | null;
  onClose: () => void;
}

export function FinderDetailsDialog({
  rental,
  onClose,
}: FinderDetailsDialogProps) {
  // Move-in cost estimate calculation
  const moveInEstimate = rental
    ? rental.price * (1 + (rental.advanceMonths ?? 0) + (rental.depositMonths ?? 0))
    : null;

  return (
    <Dialog
      open={Boolean(rental)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="details-dialog" showCloseButton>
        {rental && (
          <>
            <DialogHeader>
              <RoomIllustration rental={rental} />
              <DialogTitle asChild>
                <h2>{rental.title}</h2>
              </DialogTitle>
              <DialogDescription>
                {rental.locality} ·{" "}
                {rental.propertyType === "private_room" || rental.type === "room"
                  ? "Private room"
                  : rental.propertyType === "bedspace" || rental.type === "bedspace"
                  ? "Bedspace"
                  : rental.propertyType === "boarding_house" || rental.type === "boarding-house"
                  ? "Boarding house"
                  : rental.propertyType || "Rental"}
              </DialogDescription>
            </DialogHeader>

            <div className="details-body">
              <div className="details-pricing">
                <span className="details-price">{formatPrice(rental.price)}</span>
                <span className="details-basis"> / {rental.basis || "month"} / mo</span>
              </div>

              <p className="details-description">{rental.description}</p>

              {/* Cebu Quick Facts Grid */}
              <div className="details-spec-grid">
                {rental.bathroomType && (
                  <div className="spec-card">
                    <Bath size={15} />
                    <div>
                      <div className="spec-title">Bathroom</div>
                      <div className="spec-val">
                        {rental.bathroomType === "private" ? "Own / Private CR" : "Shared Common CR"}
                      </div>
                    </div>
                  </div>
                )}

                {rental.maxOccupants && (
                  <div className="spec-card">
                    <Users size={15} />
                    <div>
                      <div className="spec-title">Occupancy</div>
                      <div className="spec-val">
                        {rental.minOccupants && rental.minOccupants !== rental.maxOccupants
                          ? `${rental.minOccupants}–${rental.maxOccupants} pax`
                          : `Good for ${rental.maxOccupants} pax`}
                      </div>
                    </div>
                  </div>
                )}

                {rental.curfewType && (
                  <div className="spec-card">
                    <Clock size={15} />
                    <div>
                      <div className="spec-title">Curfew</div>
                      <div className="spec-val">
                        {rental.curfewType === "none"
                          ? "No curfew"
                          : rental.curfewTime
                          ? `Curfew: ${rental.curfewTime}`
                          : "Has curfew"}
                      </div>
                    </div>
                  </div>
                )}

                {rental.cookingAllowed !== undefined && rental.cookingAllowed !== null && (
                  <div className="spec-card">
                    <Utensils size={15} />
                    <div>
                      <div className="spec-title">Cooking</div>
                      <div className="spec-val">
                        {rental.cookingAllowed ? "Cooking allowed" : "No cooking"}
                      </div>
                    </div>
                  </div>
                )}

                {rental.waterPricingType && (
                  <div className="spec-card">
                    <Droplet size={15} />
                    <div>
                      <div className="spec-title">Water</div>
                      <div className="spec-val">
                        {rental.waterPricingType === "included"
                          ? "Water included"
                          : rental.waterFee
                          ? `₱${rental.waterFee}/head`
                          : "Metered / separate"}
                      </div>
                    </div>
                  </div>
                )}

                {rental.electricityPricingType && (
                  <div className="spec-card">
                    <Zap size={15} />
                    <div>
                      <div className="spec-title">Electricity</div>
                      <div className="spec-val">
                        {rental.electricityPricingType === "included"
                          ? "Power included"
                          : rental.electricityRatePerKwh
                          ? `₱${rental.electricityRatePerKwh}/kWh`
                          : "Submetered"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Move-in Cost Estimator */}
              {rental.advanceMonths !== undefined &&
                rental.advanceMonths !== null &&
                rental.depositMonths !== undefined &&
                rental.depositMonths !== null && (
                  <div className="details-movein-box">
                    <div className="movein-title">
                      <Key size={14} />
                      <span>Move-in Terms</span>
                    </div>
                    <div className="movein-rows">
                      <div className="movein-row">
                        <span>Advance</span>
                        <span>{rental.advanceMonths} month ({formatPrice(rental.price * rental.advanceMonths)})</span>
                      </div>
                      <div className="movein-row">
                        <span>Security deposit</span>
                        <span>{rental.depositMonths} month ({formatPrice(rental.price * rental.depositMonths)})</span>
                      </div>
                      {moveInEstimate !== null && (
                        <div className="movein-total">
                          <span>Estimated total move-in</span>
                          <span>{formatPrice(moveInEstimate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Amenities List */}
              <div className="details-amenities">
                <h3>Included amenities & features</h3>
                <div className="amenities-tags">
                  {rental.amenities.map((item) => (
                    <span key={item} className="amenity-tag">
                      <CheckCircle2 size={12} className="mr-1 text-sky-600" />
                      {item}
                    </span>
                  ))}
                  {rental.aircon && (
                    <span className="amenity-tag">
                      <CheckCircle2 size={12} className="mr-1 text-sky-600" />
                      Air conditioning
                    </span>
                  )}
                  {rental.motorcycleParking && (
                    <span className="amenity-tag">
                      <CheckCircle2 size={12} className="mr-1 text-sky-600" />
                      Motorcycle parking
                    </span>
                  )}
                  {rental.carParking && (
                    <span className="amenity-tag">
                      <CheckCircle2 size={12} className="mr-1 text-sky-600" />
                      Car parking
                    </span>
                  )}
                  {rental.gated && (
                    <span className="amenity-tag">
                      <ShieldCheck size={12} className="mr-1 text-emerald-600" />
                      Gated property
                    </span>
                  )}
                  {rental.cctv && (
                    <span className="amenity-tag">
                      <ShieldCheck size={12} className="mr-1 text-emerald-600" />
                      CCTV monitored
                    </span>
                  )}
                </div>
              </div>

              <div className="details-disclaimer">
                <Info size={15} aria-hidden="true" />
                <p>
                  This is a synthetic sample listing for preview purposes. Real property details and landlord direct contact will be enabled when the Supabase database is connected.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
