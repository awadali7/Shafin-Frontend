export type ShippingZone = "local" | "regional" | "national";

export type ShippingEstimateItem = {
    id: string;
    type: "physical" | "digital" | "course";
    quantity: number;
    price: number;
    weight?: number;
    volumetric_weight?: number;
    extra_shipping_charge?: number;
    origin_city?: string | null;
    origin_state?: string | null;
    quantity_pricing?: Array<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
        courier_charge?: number;
    }>;
};

export type ShippingEstimateGroup = {
    key: string;
    originCity: string;
    originState: string;
    zone: ShippingZone;
    totalWeight: number;
    slabCost: number;
};

const DEFAULT_ORIGIN_CITY = "Ernakulam";
const DEFAULT_ORIGIN_STATE = "Kerala";

function normalizeLocationValue(value?: string | null) {
    return String(value || "").trim().toLowerCase();
}

function getTierForQuantity(item: ShippingEstimateItem) {
    if (!item.quantity_pricing?.length) return null;

    return (
        item.quantity_pricing.find((tier) => {
            const minQty = Number(tier.min_qty || 1);
            const maxQty =
                tier.max_qty !== null && tier.max_qty !== undefined
                    ? Number(tier.max_qty)
                    : Infinity;
            return item.quantity >= minQty && item.quantity <= maxQty;
        }) || null
    );
}

export function getShippingZone(
    originCity?: string | null,
    originState?: string | null,
    destinationCity?: string | null,
    destinationState?: string | null
): ShippingZone {
    const normalizedOriginCity = normalizeLocationValue(originCity);
    const normalizedOriginState = normalizeLocationValue(originState);
    const normalizedDestinationCity = normalizeLocationValue(destinationCity);
    const normalizedDestinationState = normalizeLocationValue(destinationState);

    if (
        normalizedOriginCity &&
        normalizedDestinationCity &&
        normalizedOriginCity === normalizedDestinationCity
    ) {
        return "local";
    }

    if (
        normalizedOriginState &&
        normalizedDestinationState &&
        normalizedOriginState === normalizedDestinationState
    ) {
        return "regional";
    }

    return "national";
}

export function calculateWeightBasedShipping(
    weight: number,
    zone: ShippingZone
) {
    if (weight <= 0) return 0;

    const baseWeight = 1000;
    let baseRate = 100;
    const additionalWeight = 1000;
    let additionalRate = 90;

    if (zone === "local") {
        baseRate = 50;
        additionalRate = 40;
    } else if (zone === "regional") {
        baseRate = 70;
        additionalRate = 60;
    }

    if (weight <= baseWeight) {
        return baseRate;
    }

    const extraWeight = weight - baseWeight;
    const extraSlabs = Math.ceil(extraWeight / additionalWeight);
    return baseRate + extraSlabs * additionalRate;
}

export function calculateCartShippingEstimate(
    items: ShippingEstimateItem[],
    destination: { city?: string | null; state?: string | null }
) {
    let itemsSubtotal = 0;
    let tierCourierCharges = 0;
    let extraShippingTotal = 0;
    const originGroups: Record<
        string,
        Omit<ShippingEstimateGroup, "slabCost">
    > = {};

    items.forEach((item) => {
        const quantity = Number(item.quantity) || 1;
        const tier = getTierForQuantity(item);
        const pricePerItem = tier
            ? Number(tier.price_per_item || 0)
            : Number(item.price || 0);

        itemsSubtotal += pricePerItem * quantity;

        if (item.type !== "physical") {
            return;
        }

        const originCity = item.origin_city || DEFAULT_ORIGIN_CITY;
        const originState = item.origin_state || DEFAULT_ORIGIN_STATE;
        const zone = getShippingZone(
            originCity,
            originState,
            destination.city,
            destination.state
        );
        const key = `${normalizeLocationValue(originCity)}|${normalizeLocationValue(originState)}`;
        const chargeableWeight = Math.max(
            Number(item.weight || 0),
            Number(item.volumetric_weight || 0)
        );

        if (!originGroups[key]) {
            originGroups[key] = {
                key,
                originCity,
                originState,
                zone,
                totalWeight: 0,
            };
        }

        originGroups[key].totalWeight += chargeableWeight * quantity;
        extraShippingTotal += Number(item.extra_shipping_charge || 0) * quantity;
        tierCourierCharges += Number(tier?.courier_charge || 0) * quantity;
    });

    const shippingGroups = Object.values(originGroups).map((group) => ({
        ...group,
        slabCost: calculateWeightBasedShipping(group.totalWeight, group.zone),
    }));

    const slabShippingTotal = shippingGroups.reduce(
        (sum, group) => sum + group.slabCost,
        0
    );

    return {
        itemsSubtotal,
        tierCourierCharges,
        totalExtraShipping: extraShippingTotal,
        estimatedCourierCharges: slabShippingTotal,
        shippingGroups,
        totalShipping: slabShippingTotal + tierCourierCharges + extraShippingTotal,
    };
}
