import React from 'react';
import Link from 'next/link';
import { Package, Download, CheckCircle } from 'lucide-react';
import { Badge } from './Badge';

interface OrderItemCardProps {
  productId: string;
  productSlug: string;
  productName: string;
  coverImage?: string;
  quantity: number;
  unitPrice: number;
  productType: 'physical' | 'digital';
  isPaid?: boolean;
  backendBaseUrl: string;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  productSlug,
  productName,
  coverImage,
  quantity,
  unitPrice,
  productType,
  isPaid = false,
  backendBaseUrl,
}) => {
  const itemTotal = unitPrice * quantity;

  return (
    <div className="bg-white rounded-lg p-3 flex items-center gap-4">
      {/* Product Image */}
      <Link href={`/shop/${productSlug}`} className="flex-shrink-0">
        {coverImage ? (
          <img
            src={
              coverImage.startsWith('http')
                ? coverImage
                : `${backendBaseUrl}${coverImage}`
            }
            alt={productName}
            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/shop/${productSlug}`}
          className="text-sm font-medium text-slate-900 hover:text-[#B00000] transition-colors line-clamp-2"
        >
          {productName}
        </Link>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
          <span>Qty: {quantity}</span>
          <span>•</span>
          <span>₹{unitPrice.toFixed(2)} each</span>
          <span>•</span>
          <Badge variant={productType} icon={productType === 'digital' ? Download : Package}>
            {productType}
          </Badge>
        </div>

        {/* Digital Product - Download Link */}
        {productType === 'digital' && isPaid && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="available" icon={CheckCircle}>
              Available
            </Badge>
            <Link
              href="/downloads"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              <Download className="w-3 h-3" />
              Go to Downloads
            </Link>
          </div>
        )}
      </div>

      {/* Item Total */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-slate-900">
          ₹{itemTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default OrderItemCard;

