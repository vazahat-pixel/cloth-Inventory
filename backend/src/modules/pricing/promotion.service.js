const Scheme = require('../../models/scheme.model');
const PromotionGroup = require('../../models/promotionGroup.model');

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
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        let schemes = await Scheme.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $gte: todayStart } },
                { endDate: null }
            ]
        }).populate('applicablePromotionGroups').lean();

        // Sort by Strict Priority Hierarchy: 
        // 1. Specific Product(s) - Priority 10
        // 2. Promotion Group(s) - Priority 20
        // 3. Specific Category / Brand - Priority 30
        // 4. Global Fallback - Priority 100
        schemes.sort((a, b) => {
            const getPriorityValue = (s) => {
                if (s.isUniversal) return 100; // Always global fallback
                let score = 100;
                if (s.applicableProducts?.length) score = 10;
                else if (s.applicablePromotionGroups?.length) score = 20;
                else if (s.applicableCategories?.length || s.applicableBrands?.length) score = 30;
                return score;
            };

            const priorityA = getPriorityValue(a);
            const priorityB = getPriorityValue(b);

            if (priorityA !== priorityB) return priorityA - priorityB;
            return (b.value || 0) - (a.value || 0);
        });

        return schemes;
    }

    /**
     * Evaluate Promotions for a cart
     */
    async evaluate(items = [], storeId = null) {
        if (!items || items.length === 0) {
            return { items: [], totalDiscount: 0, appliedOffers: [] };
        }

        let schemes = await this.getActiveSchemes();
        
        if (storeId) {
            schemes = schemes.filter(s => !s.applicableStores?.length || s.applicableStores.some(id => String(id) === String(storeId)));
        }

        let currentItems = items.map(it => ({
            ...it,
            qty: Number(it.qty || it.quantity || 0),
            variantId: String(it.variantId || it.productId || it.id),
            productId: String(it.productId || ''),
            originalPrice: Number(it.price || it.rate || 0),
            promoDiscount: 0,
            appliedOffer: null
        }));

        let totalDiscount = 0;
        const rawAppliedOffers = [];

        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            
            if (type === 'BUY_X_GET_Y' || type === 'BOGO') {
                const buy = scheme.buyQuantity || 1;
                const get = scheme.getQuantity || 1;
                const totalSet = buy + get;

                let eligibleInstances = [];
                currentItems.forEach((item, idx) => {
                    if (item.appliedOffer) return;

                    // Check all targeting restrictions
                    const hasProductRestriction = scheme.applicableProducts?.length > 0;
                    const hasGroupRestriction = scheme.applicablePromotionGroups?.length > 0;
                    const hasCatRestriction = scheme.applicableCategories?.length > 0;
                    const hasBrandRestriction = scheme.applicableBrands?.length > 0;

                    let matched = false;

                    if (hasGroupRestriction) {
                        matched = scheme.applicablePromotionGroups.some(group => {
                            const isProdInGroup = group.applicableProducts?.some(id => String(id) === item.variantId || String(id) === item.productId);
                            const isCatInGroup = group.applicableCategories?.some(id => String(id) === String(item.category?._id || item.category));
                            const isBrandInGroup = group.applicableBrands?.some(id => String(id) === String(item.brand?._id || item.brand));
                            return isProdInGroup || isCatInGroup || isBrandInGroup;
                        });
                    } else if (hasProductRestriction) {
                        matched = scheme.applicableProducts.some(id => String(id) === item.variantId || String(id) === item.productId);
                    } else if (hasCatRestriction) {
                        matched = scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    } else if (hasBrandRestriction) {
                        matched = scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    } else {
                        matched = true; // Global BOGO, applies to all
                    }

                    if (matched) {
                        for (let i = 0; i < item.qty; i++) {
                            eligibleInstances.push({ ...item, cartIdx: idx, instanceIdx: i });
                        }
                    }
                });

                if (eligibleInstances.length >= totalSet) {
                    // Sort by price DESC: most expensive first
                    eligibleInstances.sort((a, b) => b.originalPrice - a.originalPrice);
                    
                    const setsCount = Math.floor(eligibleInstances.length / totalSet);
                    const paidCount = setsCount * buy;
                    const freeCount = setsCount * get;
                    
                    // PAID = first 'paidCount' (most expensive) — customer pays these
                    const paidInstances = eligibleInstances.slice(0, paidCount);
                    // FREE = last 'freeCount' (cheapest) — customer gets these free
                    const freeInstances = eligibleInstances.slice(paidCount, paidCount + freeCount);

                    // Mark ALL matched items as 'applied' to prevent double-discounting.
                    // This includes BOTH the items the customer pays for AND the free items.
                    // A 'paid' item in a BOGO set cannot receive another discount (like 80% off).
                    const allMatchedCartIdx = new Set([...paidInstances, ...freeInstances].map(fi => fi.cartIdx));
                    allMatchedCartIdx.forEach(idx => {
                        currentItems[idx].appliedOffer = scheme.name;
                    });

                    // Apply discount only to FREE instances
                    freeInstances.forEach(fi => {
                        const originalItem = currentItems[fi.cartIdx];
                        originalItem.promoDiscount += fi.originalPrice;
                        totalDiscount += fi.originalPrice;
                        originalItem.ruleLabel = type === 'BOGO' ? 'BOGO' : `Buy ${buy} Get ${get} Free`;
                        
                        rawAppliedOffers.push({ 
                            _id: scheme._id, 
                            name: scheme.name, 
                            discount: fi.originalPrice, 
                            ruleLabel: originalItem.ruleLabel,
                            type: scheme.type
                        });
                    });
                }
            } else {
                currentItems.forEach(item => {
                    if (item.appliedOffer) return;

                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    
                    let isGroupMatch = false;
                    let appliedSource = 'General';

                    // Determine the offer's targeting scope
                    const hasProductRestriction = scheme.applicableProducts?.length > 0;
                    const hasGroupRestriction = scheme.applicablePromotionGroups?.length > 0;
                    const hasCatRestriction = scheme.applicableCategories?.length > 0;
                    const hasBrandRestriction = scheme.applicableBrands?.length > 0;
                    const isTrulyGlobal = !hasProductRestriction && !hasGroupRestriction && !hasCatRestriction && !hasBrandRestriction;

                    if (hasGroupRestriction) {
                        isGroupMatch = scheme.applicablePromotionGroups.some(group => {
                            const isProdInGroup = group.applicableProducts?.some(id => String(id) === item.variantId || String(id) === item.productId);
                            const isCatInGroup = group.applicableCategories?.some(id => String(id) === String(item.category?._id || item.category));
                            const isBrandInGroup = group.applicableBrands?.some(id => String(id) === String(item.brand?._id || item.brand));
                            return isProdInGroup || isCatInGroup || isBrandInGroup;
                        });
                        if (!isGroupMatch) return; // scheme has groups but item isn't in any → skip this scheme
                        appliedSource = 'Group';
                    } else if (hasProductRestriction) {
                        const isProductMatch = scheme.applicableProducts.some(id => String(id) === item.variantId || String(id) === item.productId);
                        if (!isProductMatch) {
                            // If scheme is explicitly marked universal, apply to all items even if not in list
                            if (scheme.isUniversal) {
                                appliedSource = 'General';
                            } else {
                                return; // Strict specific offer — skip items not in the list
                            }
                        } else {
                            appliedSource = 'Item';
                        }
                    } else if (hasCatRestriction && !isCatMatch) {
                        return; // scheme targets specific categories, item doesn't match → skip
                    } else if (hasBrandRestriction && !isBrandMatch) {
                        return; // scheme targets specific brands, item doesn't match → skip
                    } else if (hasCatRestriction && isCatMatch) {
                        appliedSource = 'Category';
                    } else if (hasBrandRestriction && isBrandMatch) {
                        appliedSource = 'Brand';
                    }
                    // else: isTrulyGlobal → appliedSource stays 'General', applies to ALL

                        let discount = 0;
                        if (type === 'PERCENTAGE' || type.includes('PERCENTAGE')) {
                            discount = (item.originalPrice * item.qty) * (scheme.value / 100);
                        } else if (type === 'FLAT_PRICE' || type === 'FIXED_PRICE') {
                            const targetPrice = scheme.value;
                            if (item.originalPrice > targetPrice) {
                                discount = (item.originalPrice - targetPrice) * item.qty;
                            }
                        } else if (type === 'FLAT' || type === 'FLAT_DISCOUNT' || type === 'MANUAL') {
                            discount = Math.min(scheme.value * item.qty, item.originalPrice * item.qty);
                        }

                        let ruleLabel = '';
                        if (type.includes('PERCENTAGE')) ruleLabel = `${scheme.value}%`;
                        else if (type === 'FLAT_PRICE' || type === 'FIXED_PRICE') ruleLabel = `Fixed: ₹${scheme.value}`;
                        else ruleLabel = `Flat: ₹${scheme.value}`;

                        if (discount > 0) {
                            item.promoDiscount += discount;
                            item.appliedOffer = scheme.name;
                            item.ruleLabel = ruleLabel;
                            totalDiscount += discount;
                            
                            rawAppliedOffers.push({ 
                                _id: scheme._id, 
                                name: scheme.name, 
                                discount: discount, 
                                type: scheme.type, 
                                value: scheme.value,
                                ruleLabel,
                                source: appliedSource 
                            });
                        }
                });
            }
        }

        // --- Final Grouping: Build appliedOffers from actual item discounts ---
        // We trust the item.appliedOffer and item.promoDiscount as the single source of truth.
        const finalOffersMap = {};
        currentItems.forEach(item => {
            if (item.appliedOffer && item.promoDiscount > 0) {
                const key = item.appliedOffer;
                if (!finalOffersMap[key]) {
                    // Find the scheme to get its ID and type
                    const scheme = schemes.find(s => s.name === key);
                    finalOffersMap[key] = {
                        _id: scheme?._id,
                        name: key,
                        discount: 0,
                        type: scheme?.type,
                        ruleLabel: item.ruleLabel || key // fallback
                    };
                }
                finalOffersMap[key].discount += item.promoDiscount;
            }
        });

        const finalAppliedOffers = Object.values(finalOffersMap);

        return { 
            items: currentItems, 
            totalDiscount: Number(totalDiscount.toFixed(2)), 
            appliedOffers: finalAppliedOffers 
        };
    }
}

module.exports = new PromotionService();
