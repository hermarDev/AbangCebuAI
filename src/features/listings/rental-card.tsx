import { ArrowUpRight, Bath, BedDouble, Building2, MapPin, Wifi } from "lucide-react";
import type { Rental, RentalResult } from "@/contracts/preview";
import { formatDistance, formatPrice } from "@/features/search/preview-search";

export function RoomIllustration({ rental }: { rental: Rental }) {
  return (
    <div
      className={`room-art room-art-${rental.tone}`}
      aria-label="Illustration, not a property photo"
      role="img"
    >
      <svg viewBox="0 0 240 150" fill="none" aria-hidden="true">
        <path d="M0 130 82 98H240V150H0Z" fill="currentColor" opacity=".08" />
        <path d="M82 0V98L0 130M82 98H240" stroke="currentColor" opacity=".2" />
        <path d="M107 14H174V75H107Z" fill="#fff" opacity=".6" />
        <path d="M111 18H170V71H111Z" fill="currentColor" opacity=".12" />
        <path d="M140 18V71M111 45H170" stroke="currentColor" opacity=".3" />
        <path d="M98 12H108V80H98M175 12H185V80H175" fill="currentColor" opacity=".3" />
        <path d="M58 93V70Q58 65 63 65H127Q132 65 132 70V93" fill="currentColor" opacity=".35" />
        <path d="M59 82H131L165 113H27Z" fill="#fff" opacity=".9" />
        <path d="M27 113H165V128H27Z" fill="currentColor" opacity=".45" />
        <path d="M29 128V135M162 128V135" stroke="currentColor" strokeWidth="4" opacity=".6" />
        <path d="M47 96H145L165 113H27Z" fill="currentColor" opacity=".2" />
        <path d="M67 77H90L96 87H61ZM98 77H122L130 87H103Z" fill="#fff" />
        <path d="M194 99H217L214 121H198Z" fill="currentColor" opacity=".4" />
        <path d="M204 101V58M204 84Q180 78 190 64Q204 62 204 84ZM204 76Q222 71 219 55Q203 53 204 76Z" fill="currentColor" opacity=".5" />
        <path d="M19 70V104M9 70H29L25 52H14Z" stroke="currentColor" opacity=".4" />
      </svg>
      <span>Illustration</span>
    </div>
  );
}

export function RentalCard({
  rental,
  selected,
  isHovered,
  onSelect,
  onDetails,
  onMouseEnter,
  onMouseLeave,
}: {
  rental: RentalResult;
  selected: boolean;
  isHovered?: boolean;
  onSelect: () => void;
  onDetails: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const handleCardClick = () => {
    onSelect();
    onDetails();
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onDetails();
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onDetails();
  };

  const categoryLabel =
    rental.propertyType === "bedspace" || rental.type === "bedspace"
      ? "Bedspace"
      : rental.propertyType === "boarding_house" || rental.type === "boarding-house"
      ? "Boarding house"
      : rental.propertyType === "private_room" || rental.type === "room"
      ? "Private room"
      : rental.propertyType || "Rental";

  return (
    <article
      className={`rental-card${selected ? " selected" : ""}${isHovered ? " is-hovered" : ""}`}
      data-listing-id={rental.id}
      data-rental-id={rental.id}
      id={`rental-${rental.id}`}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="rental-select"
        onClick={handleSelectClick}
        aria-pressed={selected}
        aria-label={`Show ${rental.title} on map`}
      >
        <RoomIllustration rental={rental} />
        <div className="rental-summary">
          <div className="rental-category-row">
            <span className="rental-category">{categoryLabel}</span>
            {rental.bathroomType === "private" && (
              <span className="rental-badge-subtle" title="Own / Private CR">
                <Bath size={11} aria-hidden="true" />
                Own CR
              </span>
            )}
          </div>
          <h2>{rental.title}</h2>
          <span className="rental-locality">
            <MapPin size={12} />
            {rental.locality}
          </span>
          <span className="rental-price">
            {formatPrice(rental.price)}
            <small> / mo</small>
          </span>
        </div>
      </button>
      <div className="card-meta">
        <span>
          {rental.amenities.includes("Wi-Fi") || rental.wifiAvailable ? (
            <Wifi size={13} />
          ) : (
            <BedDouble size={13} />
          )}
          {rental.amenities[0] || (rental.wifiAvailable ? "Wi-Fi" : "Standard room")}
        </span>
        <span>
          {rental.distanceMeters === null ? (
            <>
              <Building2 size={13} />
              Sample listing
            </>
          ) : (
            <>{formatDistance(rental.distanceMeters)} away</>
          )}
        </span>
        <button
          type="button"
          onClick={handleDetailsClick}
          aria-label={`View details for ${rental.title}`}
        >
          Details <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

export function RentalCardSkeleton() {
  return (
    <article className="rental-card rental-card-skeleton" aria-hidden="true">
      <div className="rental-select">
        <div className="rental-skeleton-thumb" />
        <div className="rental-summary">
          <div className="rental-skeleton-line skeleton-category" />
          <div className="rental-skeleton-line skeleton-title" />
          <div className="rental-skeleton-line skeleton-locality" />
          <div className="rental-skeleton-line skeleton-price" />
        </div>
      </div>
      <div className="card-meta">
        <div className="rental-skeleton-pill" />
        <div className="rental-skeleton-pill" />
        <div className="rental-skeleton-btn" />
      </div>
    </article>
  );
}
