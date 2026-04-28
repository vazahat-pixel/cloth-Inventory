const Scheme = require('../../models/scheme.model');
const Coupon = require('../../models/coupon.model');

/**
 * PRICING AND OFFER ELIGIBILITY ENGINE
 */
class PricingService {
    /**
     * Get active schemes based on current date
     */
    async getActiveSchemes() {
        const now = new Date();
        return await Scheme.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $gte: now } },
                { endDate: null }
            ]
        }).sort({ value: -1 }); 
    }

    /**
     * Get active coupons based on current date/code
     */
    async findCouponByCode(code) {
        const now = new Date();
        return await Coupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true,
            expiry: { $gte: now }
        });
    }

    /**
     * Main Evaluation Logic
     * @param {Object} cartData { items: [{ productId, quantity, price, brand, category }], totalAmount, storeId }
     */
    async evaluateAllOffers(cartData) {
        const { items, totalAmount } = cartData;
        const schemes = await this.getActiveSchemes();
        const results = {
            eligibleSchemes: [],
            totalSchemeDiscount: 0,
            itemWiseDiscounts: items.map(i => ({ ...i, appliedDiscount: 0 }))
        };

        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            // 1. Basic Threshold Check
            if (scheme.minPurchaseAmount > 0 && totalAmount < scheme.minPurchaseAmount) continue;
            
            const totalQty = items.reduce((acc, i) => acc + Number(i.qty || i.quantity || 0), 0);
            if (scheme.minPurchaseQuantity > 0 && totalQty < scheme.minPurchaseQuantity) continue;

            // 2. Eligibility by Category/Brand/Product
            const eligibleItems = items.filter(item => {
                const category = item.category;
                const brand = item.brand;
                const productId = item.productId || item.variantId || item.id;

                const isCatApplicable = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(category));
                const isBrandApplicable = !scheme.applicableBrands?.length || scheme.applicableBrands.some(b => String(b) === String(brand));
                const isProductApplicable = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(productId));
                return isCatApplicable && isBrandApplicable && isProductApplicable;
            });

            if (!eligibleItems.length) continue;

            let schemeDiscount = 0;

            // 3. Apply Scheme logic
            if (type === 'PERCENTAGE' || type.includes('PERCENTAGE')) {
                schemeDiscount = eligibleItems.reduce((acc, item) => {
                    const q = Number(item.qty || item.quantity || 0);
                    const p = Number(item.price || item.rate || 0);
                    return acc + (p * q * (scheme.value / 100));
                }, 0);
            } else if (type === 'FLAT' || type.includes('FLAT')) {
                schemeDiscount = scheme.value;
            } else if (type === 'BOGO') {
                schemeDiscount = eligibleItems.reduce((acc, item) => {
                    const q = Number(item.qty || item.quantity || 0);
                    const p = Number(item.price || item.rate || 0);
                    const freeCount = Math.floor(q / 2);
                    return acc + (freeCount * p);
                }, 0);
            } else if (type === 'BUY_X_GET_Y') {
                schemeDiscount = eligibleItems.reduce((acc, item) => {
                    const q = Number(item.qty || item.quantity || 0);
                    const p = Number(item.price || item.rate || 0);
                    const sets = Math.floor(q / (scheme.buyQuantity + scheme.getQuantity));
                    const freeCount = sets * scheme.getQuantity;
                    return acc + (freeCount * p);
                }, 0);
            } else if (type === 'FIXED_PRICE') {
                schemeDiscount = eligibleItems.reduce((acc, item) => {
                    const q = Number(item.qty || item.quantity || 0);
                    const p = Number(item.price || item.rate || 0);
                    if (scheme.buyQuantity > 0) {
                        const sets = Math.floor(q / scheme.buyQuantity);
                        const standardCost = sets * scheme.buyQuantity * p;
                        const comboCost = sets * (scheme.value || 0);
                        return acc + (standardCost - comboCost);
                    }
                    return acc;
                }, 0);
            } else if (type === 'FREE_GIFT') {
                schemeDiscount = 0;
            }

            if (schemeDiscount > 0 || eligibleItems.length > 0) {
                results.eligibleSchemes.push({
                    _id: scheme._id,
                    name: scheme.name,
                    type: scheme.type,
                    discount: schemeDiscount,
                    description: scheme.description,
                    isTriggered: schemeDiscount > 0
                });
            }
        }

        // Suggest the best single scheme? Or let them stack? Logic ERP usually stacks where applicable but we'll return list for 1-click select
        return results;
    }

    // CRUD FOR SCHEMES/COUPONS
    async listSchemes() {
        return await Scheme.find().sort({ createdAt: -1 });
    }

    async createScheme(data, userId) {
        return await Scheme.create({ ...data, createdBy: userId });
    }

    async createCoupon(data, userId) {
        return await Coupon.create({ ...data, createdBy: userId });
    }

}

module.exports = new PricingService();
