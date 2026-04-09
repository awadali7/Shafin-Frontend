const fs = require('fs');
let code = fs.readFileSync('app/checkout/page.tsx', 'utf8');

const regex = /\/\/ Calculate courier charges and items subtotal separately[\s\S]*?    const courierCharges = estimatedCourierCharges \+ totalExtraShipping;/;

const replacement = `    // Calculate courier charges and items subtotal using origin grouping
    const { itemsSubtotal, estimatedCourierCharges, totalExtraShipping } = useMemo(() => {
        let itemsTotal = 0;
        let extraShippingTotal = 0;

        // Default constraints for fallback
        const defaultOriginCity = "Ernakulam";
        const defaultOriginState = "Kerala";

        const originGroups: Record<string, { zone: string; totalWeight: number }> = {};

        items.forEach((item: any) => {
            const qty = Number(item.quantity) || 1;
            const weight = item.weight !== undefined && item.weight !== null ? Number(item.weight) : 0;
            const volWeight = item.volumetric_weight !== undefined && item.volumetric_weight !== null ? Number(item.volumetric_weight) : 0;
            const chargeableWeight = Math.max(weight, volWeight);
            const extraCharge = item.extra_shipping_charge !== undefined && item.extra_shipping_charge !== null ? Number(item.extra_shipping_charge) : 0;

            const itemOriginCity = item.origin_city || defaultOriginCity;
            const itemOriginState = item.origin_state || defaultOriginState;
            const originKey = \`\${itemOriginCity}_\${itemOriginState}\`.toLowerCase();

            let zone = "national";
            if (formData.city?.trim().toLowerCase() === itemOriginCity.trim().toLowerCase()) {
                zone = "local";
            } else if (formData.state?.trim().toLowerCase() === itemOriginState.trim().toLowerCase()) {
                zone = "regional";
            }

            if (!originGroups[originKey]) {
                originGroups[originKey] = { zone, totalWeight: 0 };
            }

            if (item.type === 'physical') {
                originGroups[originKey].totalWeight += chargeableWeight * qty;
                extraShippingTotal += extraCharge * qty;
            }

            if (item.quantity_pricing && item.quantity_pricing.length > 0) {
                const tier = item.quantity_pricing.find((t: any) => {
                    const minQty = Number(t.min_qty) || 1;
                    const maxQty = t.max_qty && String(t.max_qty) !== "" ? Number(t.max_qty) : Infinity;
                    return qty >= minQty && qty <= maxQty;
                });
                if (tier) {
                    itemsTotal += Number(tier.price_per_item) * qty;
                    if (item.type === 'physical') {
                        extraShippingTotal += Number(tier.courier_charge || 0) * qty;
                    }
                } else {
                    itemsTotal += Number(item.price) * qty;
                }
            } else {
                itemsTotal += Number(item.price) * qty;
            }
        });

        let totalSlabsCost = 0;
        for (const originKey in originGroups) {
            const group = originGroups[originKey];
            const zone = group.zone;
            const weight = group.totalWeight;

            if (weight > 0) {
                let baseWeight = 1000, baseRate = 100, addWeight = 1000, addRate = 90;
                if (zone === 'local') {
                    baseRate = 50; addRate = 40;
                } else if (zone === 'regional') {
                    baseRate = 70; addRate = 60;
                }

                if (weight <= baseWeight) {
                    totalSlabsCost += baseRate;
                } else {
                    const extraWeight = weight - baseWeight;
                    const slabs = Math.ceil(extraWeight / addWeight);
                    totalSlabsCost += baseRate + (slabs * addRate);
                }
            }
        }

        return { itemsSubtotal: itemsTotal, estimatedCourierCharges: totalSlabsCost, totalExtraShipping: extraShippingTotal };
    }, [items, formData.city, formData.state]);

    const courierCharges = estimatedCourierCharges + totalExtraShipping;`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('app/checkout/page.tsx', code, 'utf8');
    console.log("Successfully updated checkout page frontend grouping logic.");
} else {
    console.log("Regex pattern not found in checkout page.");
}
