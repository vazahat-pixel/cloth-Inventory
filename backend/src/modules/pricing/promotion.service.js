const Scheme = require('../../models/scheme.model');
const PromotionGroup = require('../../models/promotionGroup.model');
const Item = require('../../models/item.model');

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
     * Helper to check if a cart item matches a scheme's targeting constraints
     */
    isItemEligible(item, scheme) {
        if (scheme.isUniversal) return true;

        const hasProductRestriction = scheme.applicableProducts?.length > 0;
        const hasGroupRestriction = scheme.applicablePromotionGroups?.length > 0;
        const hasCatRestriction = scheme.applicableCategories?.length > 0;
        const hasBrandRestriction = scheme.applicableBrands?.length > 0;

        if (!hasProductRestriction && !hasGroupRestriction && !hasCatRestriction && !hasBrandRestriction) {
            return true;
        }

        // 1. Group check
        let groupMatched = true;
        if (hasGroupRestriction) {
            groupMatched = scheme.applicablePromotionGroups.some(group => {
                const isProdInGroup = group.applicableProducts?.some(id => String(id) === item.variantId || String(id) === item.productId);
                
                const isCatInGroup = group.applicableCategories?.some(id => {
                    const sId = String(id);
                    return sId === String(item.resolvedCategory) || sId === String(item.category) || sId === String(item.resolvedCategoryName) || sId === String(item.categoryName);
                });
                
                const isBrandInGroup = group.applicableBrands?.some(id => {
                    const sId = String(id);
                    return sId === String(item.resolvedBrand) || sId === String(item.brand) || sId === String(item.resolvedBrandName) || sId === String(item.brandName);
                });
                
                return isProdInGroup || isCatInGroup || isBrandInGroup;
            });
        }

        // 2. Product check
        let productMatched = true;
        if (hasProductRestriction) {
            productMatched = scheme.applicableProducts.some(id => String(id) === item.variantId || String(id) === item.productId);
        }

        // 3. Category check
        let categoryMatched = true;
        if (hasCatRestriction) {
            categoryMatched = scheme.applicableCategories.some(id => {
                const sId = String(id);
                return sId === String(item.resolvedCategory) || sId === String(item.category) || sId === String(item.resolvedCategoryName) || sId === String(item.categoryName);
            });
        }

        // 4. Brand check
        let brandMatched = true;
        if (hasBrandRestriction) {
            brandMatched = scheme.applicableBrands.some(id => {
                const sId = String(id);
                return sId === String(item.resolvedBrand) || sId === String(item.brand) || sId === String(item.resolvedBrandName) || sId === String(item.brandName);
            });
        }

        return groupMatched && productMatched && categoryMatched && brandMatched;
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

        // Fetch DB items to get reliable brand/category IDs and names
        let dbItemsMap = new Map();
        try {
            const productIds = items.map(it => it.productId || it.variantId || it.id).filter(Boolean);
            if (productIds.length > 0) {
                const dbItems = await Item.find({ _id: { $in: productIds } }).lean();
                dbItems.forEach(item => {
                    dbItemsMap.set(String(item._id), item);
                });
            }
        } catch (err) {
            console.error('⚠️ [PromotionService] Error fetching DB items for evaluation:', err);
        }

        let currentItems = items.map(it => {
            const itemId = it.productId || it.variantId || it.id;
            const dbItem = dbItemsMap.get(String(itemId));
            
            const resolvedCategory = dbItem ? String(dbItem.categoryId || dbItem.category || '') : '';
            const resolvedBrand = dbItem ? String(dbItem.brand || dbItem.brandId || '') : '';
            const resolvedCategoryName = dbItem ? String(dbItem.categoryName || '') : '';
            const resolvedBrandName = dbItem ? String(dbItem.brandName || '') : '';

            return {
                ...it,
                qty: Number(it.qty || it.quantity || 0),
                variantId: String(it.variantId || it.productId || it.id),
                productId: String(it.productId || ''),
                originalPrice: Number(it.price || it.rate || 0),
                resolvedCategory,
                resolvedBrand,
                resolvedCategoryName,
                resolvedBrandName,
                promoDiscount: 0,
                appliedOffer: null
            };
        });

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

                    const matched = this.isItemEligible(item, scheme);

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

                    const matched = this.isItemEligible(item, scheme);
                    if (!matched) return;

                    let appliedSource = 'General';
                    if (scheme.applicableProducts?.length > 0) {
                        appliedSource = 'Item';
                    } else if (scheme.applicablePromotionGroups?.length > 0) {
                        appliedSource = 'Group';
                    } else if (scheme.applicableCategories?.length > 0) {
                        appliedSource = 'Category';
                    } else if (scheme.applicableBrands?.length > 0) {
                        appliedSource = 'Brand';
                    }

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
