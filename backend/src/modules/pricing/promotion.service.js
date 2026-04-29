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
        let schemes = await Scheme.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $gte: now } },
                { endDate: null }
            ]
        }).lean();

        // Sort by Specificity first, then by Value
        // Specific = has Products, Categories, or Brands defined
        schemes.sort((a, b) => {
            const specificityA = (a.applicableProducts?.length || 0) + (a.applicableCategories?.length || 0) + (a.applicableBrands?.length || 0);
            const specificityB = (b.applicableProducts?.length || 0) + (b.applicableCategories?.length || 0) + (b.applicableBrands?.length || 0);

            if (specificityA !== specificityB) {
                // If specificity is different, higher specificity (more filters) comes first
                return specificityB - specificityA;
            }
            
            // If specificity is same, higher value comes first
            return (b.value || 0) - (a.value || 0);
        });

        console.log(`🔍 [SCHEME-DEBUG] Found and prioritized ${schemes.length} active schemes`);
        return schemes;
    }

    /**
     * Evaluate Promotions for a cart
     * @param {Array} items [{ variantId, qty, price, category, brand }]
     * @param {String} storeId The ID of the store making the sale
     */
    async evaluate(items = [], storeId = null) {
        if (!items || items.length === 0) {
            return { items: [], totalDiscount: 0, appliedOffers: [] };
        }

        let schemes = await this.getActiveSchemes();
        
        // Filter by applicableStores if defined
        if (storeId) {
            schemes = schemes.filter(s => !s.applicableStores?.length || s.applicableStores.some(id => String(id) === String(storeId)));
        }

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

        // Process Group-Based Promotions first (BUY_X_GET_Y, FIXED_PRICE)
        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            console.log(`🔍 [SCHEME-DEBUG] Processing Scheme: "${scheme.name}" Type: ${type}`);
            if (type === 'BUY_X_GET_Y' || type === 'BOGO' || type === 'FIXED_PRICE') {
                const buy = scheme.buyQuantity || 1;
                const get = scheme.getQuantity || (type === 'FIXED_PRICE' ? 0 : 1);
                const totalSet = type === 'FIXED_PRICE' ? buy : (buy + get);

                // 1. Identify eligible item instances (flattened for sorting)
                let eligibleInstances = [];
                currentItems.forEach((item, idx) => {
                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.includes(item.brand?.name || item.brand);
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(item.variantId) || String(id) === String(item.productId));

                    if (isCatMatch && isBrandMatch && isProductMatch && !item.appliedOffer) {
                        for (let i = 0; i < item.qty; i++) {
                            eligibleInstances.push({ ...item, cartIdx: idx });
                        }
                    }
                });

                if (eligibleInstances.length >= totalSet) {
                    // 2. Sort by Price DESC (Customer pays for the most expensive in BOGO)
                    eligibleInstances.sort((a, b) => b.originalPrice - a.originalPrice);

                    // 3. Mark Sets
                    const setsCount = Math.floor(eligibleInstances.length / totalSet);
                    
                    if (type === 'FIXED_PRICE') {
                        // FIXED_PRICE: the entire set of `buy` items costs `scheme.value`
                        const totalComboInstances = setsCount * totalSet;
                        let setDiscountTotal = 0;
                        
                        for (let i = 0; i < totalComboInstances; i++) {
                            const instance = eligibleInstances[i];
                            const originalItem = currentItems[instance.cartIdx];
                            
                            // Calculate discount ratio for this item in the combo
                            const setOriginalValue = eligibleInstances.slice(Math.floor(i / totalSet) * totalSet, (Math.floor(i / totalSet) + 1) * totalSet).reduce((sum, it) => sum + it.originalPrice, 0);
                            const itemDiscount = instance.originalPrice - (scheme.value * (instance.originalPrice / setOriginalValue));
                            
                            originalItem.promoDiscount += itemDiscount;
                            originalItem.appliedOffer = scheme.name;
                            totalDiscount += itemDiscount;
                            setDiscountTotal += itemDiscount;
                        }
                        
                        appliedOffers.push({ id: scheme._id, name: scheme.name, discount: setDiscountTotal });
                    } else {
                        // BOGO / BUY_X_GET_Y
                        const freeCount = setsCount * get;
                        
                        // The last 'freeCount' items in the sorted list are the cheapest
                        const freeInstances = eligibleInstances.slice(eligibleInstances.length - freeCount);

                        freeInstances.forEach(fi => {
                            const originalItem = currentItems[fi.cartIdx];
                            // We deduct the price of ONE instance from the total
                            originalItem.promoPrice = 0; 
                            // Since we deal with qty, we increment the discount for that line
                            originalItem.promoDiscount += fi.originalPrice;
                            originalItem.appliedOffer = scheme.name;
                            totalDiscount += fi.originalPrice;
                        });

                        appliedOffers.push({ id: scheme._id, name: scheme.name, discount: freeInstances.reduce((a, b) => a + b.originalPrice, 0) });
                    }
                }
            }
        }

        // Process Line-Based Promotions (Percentage/Flat) for items not yet under an offer
        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            if (type === 'PERCENTAGE' || type.includes('PERCENTAGE') || type === 'FLAT' || type.includes('FLAT') || type === 'MANUAL') {
                currentItems.forEach(item => {
                    if (item.appliedOffer) return; // Skip if already handled by BOGO

                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(item.variantId) || String(id) === String(item.productId));
                    
                    console.log(`   👉 Item: ${item.variantId} Match: Cat=${isCatMatch}, Brand=${isBrandMatch}, Prod=${isProductMatch}`);

                    if (isCatMatch && isBrandMatch && isProductMatch) {
                        let discount = 0;
                        if (type === 'PERCENTAGE' || type.includes('PERCENTAGE')) {
                            discount = (item.originalPrice * item.qty) * (scheme.value / 100);
                        } else if (type === 'FLAT' || type.includes('FLAT') || type === 'MANUAL') {
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
