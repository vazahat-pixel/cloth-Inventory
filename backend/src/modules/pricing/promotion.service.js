const Scheme = require('../../models/scheme.model');

/**
 * PROMOTION AND OFFER ENGINE (PURE SERVICE)
 * Strictly calculates values based on inputs. No Side Effects.
 */
class PromotionService {
    /**
     * Get active schemes from DB
     */
    async getActiveSchemes() {
        const now = new Date();
        const schemes = await Scheme.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $gte: now } },
                { endDate: null }
            ]
        }).sort({ value: -1 });
        console.log(`🔍 [SCHEME-DEBUG] Found ${schemes.length} active schemes in DB`);
        return schemes;
    }

    /**
     * Evaluate Promotions for a cart
     * @param {Array} items [{ variantId, qty, price, category, brand }]
     */
    async evaluate(items = []) {
        if (!items || items.length === 0) {
            return { items: [], totalDiscount: 0, appliedOffers: [] };
        }

        const schemes = await this.getActiveSchemes();
        let currentItems = items.map(it => {
            const qty = Number(it.qty || it.quantity || 0);
            const variantId = it.variantId || it.productId || it.id;
            const price = Number(it.price || it.rate || 0);
            
            return {
                ...it,
                qty,
                variantId,
                price,
                originalPrice: price,
                promoPrice: price,
                promoDiscount: 0,
                appliedOffer: null
            };
        });

        const appliedOffers = [];
        let totalDiscount = 0;

        // Process Group-Based Promotions first (BUY_X_GET_Y)
        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            console.log(`🔍 [SCHEME-DEBUG] Processing Scheme: "${scheme.name}" Type: ${type}`);
            if (type === 'BUY_X_GET_Y' || type === 'BOGO') {
                const buy = scheme.buyQuantity || 1;
                const get = scheme.getQuantity || 1;
                const totalSet = buy + get;

                // 1. Identify eligible item instances (flattened for sorting)
                let eligibleInstances = [];
                currentItems.forEach((item, idx) => {
                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.includes(item.brand?.name || item.brand);
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(item.variantId));

                    if (isCatMatch && isBrandMatch && isProductMatch && !item.appliedOffer) {
                        for (let i = 0; i < item.qty; i++) {
                            eligibleInstances.push({ ...item, cartIdx: idx });
                        }
                    }
                });

                if (eligibleInstances.length >= totalSet) {
                    // 2. Sort by Price DESC (Customer pays for the most expensive)
                    eligibleInstances.sort((a, b) => b.originalPrice - a.originalPrice);

                    // 3. Mark Sets
                    const setsCount = Math.floor(eligibleInstances.length / totalSet);
                    const freeCount = setsCount * get;
                    
                    // The last 'freeCount' items in the sorted list are the cheapest
                    const freeInstances = eligibleInstances.slice(eligibleInstances.length - freeCount);

                    freeInstances.forEach(fi => {
                        const originalItem = currentItems[fi.cartIdx];
                        // We deduct the price of ONE instance from the total
                        originalItem.promoPrice = 0; // In a real system, we might spread this or mark specific instance
                        // Since we deal with qty, we increment the discount for that line
                        originalItem.promoDiscount += fi.originalPrice;
                        originalItem.appliedOffer = scheme.name;
                        totalDiscount += fi.originalPrice;
                    });

                    appliedOffers.push({ id: scheme._id, name: scheme.name, discount: freeInstances.reduce((a, b) => a + b.originalPrice, 0) });
                }
            }
        }

        // Process Line-Based Promotions (Percentage/Flat) for items not yet under an offer
        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            if (type === 'PERCENTAGE' || type.includes('PERCENTAGE') || type === 'FLAT' || type.includes('FLAT')) {
                currentItems.forEach(item => {
                    if (item.appliedOffer) return; // Skip if already handled by BOGO

                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(item.variantId));
                    
                    console.log(`   👉 Item: ${item.variantId} Match: Cat=${isCatMatch}, Brand=${isBrandMatch}, Prod=${isProductMatch}`);

                    if (isCatMatch && isBrandMatch && isProductMatch) {
                        let discount = 0;
                        if (type === 'PERCENTAGE' || type.includes('PERCENTAGE')) {
                            discount = (item.originalPrice * item.qty) * (scheme.value / 100);
                        } else if (type === 'FLAT' || type.includes('FLAT')) {
                            discount = Math.min(scheme.value, item.originalPrice * item.qty);
                        }

                        if (discount > 0) {
                            console.log(`      ✨ Applied ${scheme.name}: -₹${discount}`);
                            item.promoDiscount += discount;
                            item.appliedOffer = scheme.name;
                            totalDiscount += discount;
                            appliedOffers.push({ _id: scheme._id, name: scheme.name, discount, type: scheme.type });
                        }
                    }
                });
            }
        }

        // Group applied offers for UI
        const groupedOffers = [];
        appliedOffers.forEach(off => {
            const existing = groupedOffers.find(g => String(g._id) === String(off._id));
            if (existing) {
                existing.discount += off.discount;
            } else {
                groupedOffers.push({ ...off });
            }
        });

        return {
            items: currentItems,
            totalDiscount,
            appliedOffers: groupedOffers
        };
    }
}

module.exports = new PromotionService();
