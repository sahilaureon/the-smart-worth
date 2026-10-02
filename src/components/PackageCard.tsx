import React from 'react';
import { Link } from 'react-router-dom';
import BrutalistButton from './BrutalistButton';
import CleanPackageImage from './CleanPackageImage';
import { formatPackagePrice } from '../lib/packageUtils';

interface PackageCardProps {
  pkg: any;
  index?: number;
  allCourses?: any[];
  onEnroll?: (packageId: string | number) => void;
  enrollingId?: string | null;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, allCourses }) => {
  const offerPrice = Number(pkg.offer_price || pkg.price || 0);
  const detailsUrl = `/packages/${encodeURIComponent(String(pkg.id))}`;
  const linkState = { pkg, allCourses };

  return (
    <div className="bg-white rounded-2xl border border-[#615DFA]/45 hover:border-[#615DFA] shadow-[0_6px_20px_rgba(97,93,250,0.06)] hover:shadow-[0_12px_28px_rgba(97,93,250,0.14)] transition-all duration-300 px-3 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-col items-center text-center relative mt-10 sm:mt-12 group">
      {/* Pop-Out Top Package Box Artwork — 100% Original Clean Image Without Dark Shadow/Background */}
      <Link
        to={detailsUrl}
        state={linkState}
        className="-mt-10 sm:-mt-12 mb-2.5 w-28 h-32 sm:w-40 sm:h-44 flex items-center justify-center shrink-0 bg-transparent"
      >
        <CleanPackageImage
          src={pkg.thumbnail_url}
          mode="box"
          alt={pkg.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* Package Title */}
      <Link
        to={detailsUrl}
        state={linkState}
        className="text-sm sm:text-lg font-bold text-[#0A0E27] hover:text-[#615DFA] transition-colors leading-snug mb-1 line-clamp-1"
      >
        {pkg.name}
      </Link>

      {/* Package Price */}
      <p className="text-xs sm:text-base font-extrabold text-[#615DFA] mb-3.5 tabular-nums">
        {formatPackagePrice(offerPrice)}
      </p>

      {/* Signature BrutalistButton -> Opens Full Package & Course Modules Page Instantly */}
      <div className="w-full mt-auto">
        <BrutalistButton
          to={detailsUrl}
          state={linkState}
          variant="primary"
          size="sm"
          className="py-2 sm:py-2.5 px-3 text-xs sm:text-sm"
          fullWidth
        >
          {pkg.button_text || 'Buy Now'}
        </BrutalistButton>
      </div>
    </div>
  );
};

export default PackageCard;
