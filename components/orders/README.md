# Orders Components

## Overview
Reusable UI components for the Orders Management system. These components ensure consistency, maintainability, and reduce code duplication across order-related pages.

## Components

### 1. Badge
**File:** `Badge.tsx`

A versatile badge component for status indicators and labels.

**Variants:**
- `paid` - Green badge for paid orders
- `pending` - Yellow badge for pending orders  
- `cancelled` - Red badge for cancelled orders
- `tracked` - Blue badge for tracked shipments
- `ready` - Purple badge for ready digital products
- `available` - Green badge for available downloads
- `physical` - Blue badge for physical products
- `digital` - Purple badge for digital products

**Usage:**
```tsx
import { Badge } from '@/components/orders';

<Badge variant="paid">PAID</Badge>
<Badge variant="tracked" icon={Truck}>Tracked</Badge>
```

---

### 2. NotificationBanner
**File:** `NotificationBanner.tsx`

Eye-catching banner for important notifications and quick actions.

**Variants:**
- `info` - Blue gradient banner
- `success` - Green gradient banner
- `warning` - Yellow gradient banner
- `purple` - Purple/pink gradient banner
- `blue` - Blue/cyan gradient banner

**Props:**
- `icon` - Lucide icon component
- `title` - Bold heading text
- `description` - Supporting text
- `action` (optional) - React node for action buttons

**Usage:**
```tsx
import { NotificationBanner } from '@/components/orders';
import { Download } from 'lucide-react';

<NotificationBanner
    variant="purple"
    icon={Download}
    title="Digital Products Available"
    description="Your digital products are ready to download"
    action={<button>View Downloads</button>}
/>
```

---

### 3. TimelineStep
**File:** `TimelineStep.tsx`

Timeline step component for shipment progress tracking.

**Status:**
- `complete` - Green icon, completed step
- `active` - Blue icon, current step (supports animation)
- `pending` - Gray icon, future step

**Props:**
- `icon` - Lucide icon component
- `title` - Step title
- `description` - Step details/timestamp
- `animated` (optional) - Pulse animation for active steps

**Usage:**
```tsx
import { TimelineStep } from '@/components/orders';
import { Truck } from 'lucide-react';

<TimelineStep
    icon={Truck}
    status="active"
    title="In Transit"
    description="Expected: Feb 15, 2026"
    animated
/>
```

---

### 4. SummaryRow
**File:** `SummaryRow.tsx`

Order summary line item for subtotal, shipping, and total.

**Variants:**
- `default` - Normal summary row
- `total` - Bold total row with border

**Usage:**
```tsx
import { SummaryRow } from '@/components/orders';

<SummaryRow label="Subtotal" value="₹2,500.00" />
<SummaryRow label="Shipping" value="Free" />
<SummaryRow variant="total" label="Total" value="₹2,500.00" />
```

---

### 5. OrderItemCard
**File:** `OrderItemCard.tsx`

Product card for order items with image, details, and actions.

**Props:**
- `productId` - Product ID
- `productSlug` - Product slug for linking
- `productName` - Product name
- `coverImage` (optional) - Product image URL
- `quantity` - Order quantity
- `unitPrice` - Price per unit
- `productType` - `'physical'` or `'digital'`
- `isPaid` (optional) - Show download links for paid digital products
- `backendBaseUrl` - Base URL for image paths

**Features:**
- Automatic image URL handling (relative/absolute)
- Product type badge (Package/Download)
- Digital product download link for paid orders
- Clickable image and name linking to product page
- Calculated item total

**Usage:**
```tsx
import { OrderItemCard } from '@/components/orders';

<OrderItemCard
    productId="abc123"
    productSlug="python-course"
    productName="Python Masterclass"
    coverImage="/uploads/python.jpg"
    quantity={1}
    unitPrice={2500}
    productType="digital"
    isPaid={true}
    backendBaseUrl="http://localhost:5001"
/>
```

---

## Benefits

### Code Reduction
- **Before:** ~600 lines in orders page with duplicated UI patterns
- **After:** ~400 lines with clean, reusable components

### Consistency
- Unified design language across all order views
- Centralized styling for easy theme updates
- Type-safe props with TypeScript

### Maintainability  
- Single source of truth for each UI pattern
- Easy to update styles in one place
- Clear component API with documented props

### Reusability
- Can be used in admin orders page
- Available for future order-related features
- Exportable for other parts of the application

---

## Design Patterns Eliminated

1. ✅ **Badge/Pill Components** - Replaced 8+ inline badge implementations
2. ✅ **Notification Banners** - Replaced 2 duplicate banner patterns  
3. ✅ **Timeline Steps** - Replaced 4 timeline step variations
4. ✅ **Summary Rows** - Replaced 3 summary row patterns
5. ✅ **Product Cards** - Replaced complex product item rendering

---

## Future Enhancements

Potential additions for the components library:

- **OrderStatusBadge** - Specialized status badge with automatic color/icon
- **ShippingAddressCard** - Formatted shipping address display
- **PaymentMethodCard** - Payment method with card icons
- **OrderActions** - Reusable action buttons (Pay Now, View Invoice, etc.)
- **EmptyOrdersState** - Empty state illustration and messaging

---

## Testing Checklist

When using these components, verify:

- ✅ Badge colors and icons render correctly
- ✅ Notification banners show proper gradients
- ✅ Timeline animations work smoothly
- ✅ Summary rows calculate totals accurately
- ✅ Order item images load correctly (relative/absolute URLs)
- ✅ Digital product download links appear only when paid
- ✅ Components are responsive on mobile devices
- ✅ Hover states and transitions work properly

---

**Last Updated:** Feb 12, 2026  
**Version:** 1.0.0

