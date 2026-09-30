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

            // Secondary sort: Type specificity
            // FLAT_PRICE / FIXED_PRICE run FIRST to set effective price, then BUY_X_GET_Y stacks on top
            const getTypeScore = (s) => {
                const t = (s.type || '').toUpperCase();
                if (t === 'FIXED_PRICE' || t === 'FLAT_PRICE') return 1; // Price-setters run first
                if (t === 'FREE_GIFT') return 2;
                if (t === 'BOGO' || t === 'BUY_X_GET_Y') return 3; // Quantity deals stack on top
                return 4; // PERCENTAGE / FLAT
            };

            const typeScoreA = getTypeScore(a);
            const typeScoreB = getTypeScore(b);
            if (typeScoreA !== typeScoreB) return typeScoreA - typeScoreB;

            // Specificity by product count: fewer products = more specific (higher priority)
            const countA = a.applicableProducts?.length || 0;
            const countB = b.applicableProducts?.length || 0;
            if (countA > 0 && countB > 0 && countA !== countB) {
                return countA - countB; // Ascending: fewer products first
            }

            return (b.value || 0) - (a.value || 0);
        });

        return schemes;
    }

    /**
     * Helper to check if a cart item matches a scheme's targeting constraints
     */
    isItemEligible(item, scheme, schemeProductsMap = new Map()) {
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
                let isProdInGroup = group.applicableProducts?.some(id => String(id) === item.variantId || String(id) === item.productId);
                
                // If no direct match, check match by itemName (for items sharing the same name)
                if (!isProdInGroup && group.applicableProducts?.length > 0 && item.resolvedItemName) {
                    const cartItemNameLower = item.resolvedItemName.trim().toLowerCase();
                    isProdInGroup = group.applicableProducts.some(groupProdId => {
                        const groupItem = schemeProductsMap.get(String(groupProdId));
                        return groupItem && groupItem.itemName && groupItem.itemName.trim().toLowerCase() === cartItemNameLower;
                    });
                }
                
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
            // First check direct ID match
            let directMatch = scheme.applicableProducts.some(id => String(id) === item.variantId || String(id) === item.productId);

            // If no direct match, check if variantId is a size of a parent item that IS in the scheme
            // (schemeProductsMap already maps sizes._id → parentItem, built above)
            if (!directMatch) {
                const parentItem = schemeProductsMap.get(item.variantId) || schemeProductsMap.get(item.productId);
                if (parentItem) {
                    directMatch = scheme.applicableProducts.some(id => String(id) === String(parentItem._id));
                }
            }
            
            // If no direct match, check match by itemName (for items sharing the same name/style)
            if (!directMatch && item.resolvedItemName) {
                const cartItemNameLower = item.resolvedItemName.trim().toLowerCase();
                directMatch = scheme.applicableProducts.some(schemeProdId => {
                    const schemeItem = schemeProductsMap.get(String(schemeProdId));
                    return schemeItem && schemeItem.itemName && schemeItem.itemName.trim().toLowerCase() === cartItemNameLower;
                });
            }
            productMatched = directMatch;
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

        // Pre-fetch all targeted item details in applicableProducts from active schemes and their promotion groups
        const allSchemeProductIds = new Set();
        schemes.forEach(s => {
            if (s.applicableProducts?.length > 0) {
                s.applicableProducts.forEach(id => allSchemeProductIds.add(String(id)));
            }
            if (s.applicablePromotionGroups?.length > 0) {
                s.applicablePromotionGroups.forEach(group => {
                    if (group.applicableProducts?.length > 0) {
                        group.applicableProducts.forEach(id => allSchemeProductIds.add(String(id)));
                    }
                });
            }
        });

        const schemeProductsMap = new Map();
        if (allSchemeProductIds.size > 0) {
            try {
                const targetItems = await Item.find({
                    $or: [
                        { _id: { $in: Array.from(allSchemeProductIds) } },
                        { "sizes._id": { $in: Array.from(allSchemeProductIds) } }
                    ]
                }).select('_id itemName itemCode sizes').lean();
                targetItems.forEach(it => {
                    schemeProductsMap.set(String(it._id), it);
                    if (it.sizes) {
                        it.sizes.forEach(sz => {
                            schemeProductsMap.set(String(sz._id), it);
                        });
                    }
                });
            } catch (err) {
                console.error('⚠️ [PromotionService] Error fetching scheme target items:', err);
            }
        }

        // Fetch DB items to get reliable brand/category IDs and names
        let dbItemsMap = new Map();
        try {
            const productIds = items.map(it => it.productId || it.variantId || it.id).filter(Boolean);
            if (productIds.length > 0) {
                const dbItems = await Item.find({
                    $or: [
                        { _id: { $in: productIds } },
                        { "sizes._id": { $in: productIds } }
                    ]
                }).select('_id categoryId categoryName brand brandName sizes itemName').lean();
                dbItems.forEach(item => {
                    dbItemsMap.set(String(item._id), item);
                    if (item.sizes) {
                        item.sizes.forEach(sz => {
                            if (sz._id) dbItemsMap.set(String(sz._id), item);
                        });
                    }
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
            const resolvedItemName = dbItem ? String(dbItem.itemName || '') : '';

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
                resolvedItemName,
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
                    // BUY_X_GET_Y is STACKABLE — it applies even if item already has a price-setter offer
                    // (e.g. FLAT_PRICE ₹300 was already applied, now Buy 4 Get 1 Free stacks on top)
                    // But skip if another BUY_X_GET_Y offer was already applied to avoid double free-item
                    if (item.buyXGetYApplied) return;

                    const matched = this.isItemEligible(item, scheme, schemeProductsMap);

                    if (matched) {
                        // Use effectivePrice (after any price-setter discount) for free-item value calculation
                        // effectivePrice = originalPrice - per-unit promoDiscount already applied
                        const perUnitPromoDiscount = item.qty > 0 ? (item.promoDiscount || 0) / item.qty : 0;
                        const effectivePrice = Math.max(0, item.originalPrice - perUnitPromoDiscount);
                        for (let i = 0; i < item.qty; i++) {
                            eligibleInstances.push({ ...item, cartIdx: idx, instanceIdx: i, effectivePrice });
                        }
                    }
                });

                if (eligibleInstances.length >= totalSet) {
                    // Sort by effectivePrice DESC: most expensive first
                    eligibleInstances.sort((a, b) => b.effectivePrice - a.effectivePrice);
                    
                    const setsCount = Math.floor(eligibleInstances.length / totalSet);
                    const paidCount = setsCount * buy;
                    const freeCount = setsCount * get;
                    
                    // PAID = first 'paidCount' (most expensive) — customer pays these
                    const paidInstances = eligibleInstances.slice(0, paidCount);
                    // FREE = last 'freeCount' (cheapest effective price) — customer gets these free
                    const freeInstances = eligibleInstances.slice(paidCount, paidCount + freeCount);

                    // Mark ALL matched items as 'applied' for BUY_X_GET_Y (prevent double free-item)
                    const allMatchedCartIdx = new Set([...paidInstances, ...freeInstances].map(fi => fi.cartIdx));
                    allMatchedCartIdx.forEach(idx => {
                        currentItems[idx].buyXGetYApplied = scheme.name;
                        // Set appliedOffer only if no price-setter was already applied
                        // (so price-setter label is preserved and visible)
                        if (!currentItems[idx].appliedOffer) {
                            currentItems[idx].appliedOffer = scheme.name;
                        } else {
                            // Stack: append the BUY_X_GET_Y label
                            currentItems[idx].appliedOffer = currentItems[idx].appliedOffer + ' + ' + scheme.name;
                        }
                    });

                    // Calculate discount using effectivePrice (post FLAT_PRICE)
                    // Free items get a discount equal to their effectivePrice (the ₹300 price, not original MRP)
                    const matchedInstances = [...paidInstances, ...freeInstances];
                    const matchedEffectiveTotal = matchedInstances.reduce((sum, inst) => sum + inst.effectivePrice, 0);
                    const paidEffectiveTotal = paidInstances.reduce((sum, inst) => sum + inst.effectivePrice, 0);
                    // Discount = value of all free items at their effective price
                    const totalSetDiscount = matchedEffectiveTotal - paidEffectiveTotal;

                    let remainingDiscount = totalSetDiscount;
                    const ruleLabelSetForIdx = new Set(); // track per-item to avoid duplicate label
                    matchedInstances.forEach((inst, index) => {
                        const originalItem = currentItems[inst.cartIdx];
                        let allocatedDiscount;
                        if (index === matchedInstances.length - 1) {
                            // Give all remaining discount to the last item to prevent rounding issues
                            allocatedDiscount = Number(remainingDiscount.toFixed(2));
                        } else {
                            const share = matchedEffectiveTotal > 0 ? inst.effectivePrice / matchedEffectiveTotal : 0;
                            allocatedDiscount = Number((totalSetDiscount * share).toFixed(2));
                            remainingDiscount -= allocatedDiscount;
                        }

                        originalItem.promoDiscount += allocatedDiscount;

                        // Only set ruleLabel once per cart item (not once per instance)
                        if (!ruleLabelSetForIdx.has(inst.cartIdx)) {
                            const buyGetLabel = type === 'BOGO' ? 'BOGO' : `Buy ${buy} Get ${get} Free`;
                            originalItem.ruleLabel = (originalItem.ruleLabel ? originalItem.ruleLabel + ' + ' : '') + buyGetLabel;
                            ruleLabelSetForIdx.add(inst.cartIdx);
                        }
                        
                        rawAppliedOffers.push({ 
                            _id: scheme._id, 
                            name: scheme.name, 
                            discount: allocatedDiscount, 
                            ruleLabel: type === 'BOGO' ? 'BOGO' : `Buy ${buy} Get ${get} Free`,
                            type: scheme.type
                        });
                    });

                    totalDiscount += totalSetDiscount;
                }
            } else {
                currentItems.forEach(item => {
                    if (item.appliedOffer) return;

                    const matched = this.isItemEligible(item, scheme, schemeProductsMap);
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
                        discount = Number(((item.originalPrice * item.qty) * (scheme.value / 100)).toFixed(2));
                    } else if (type === 'FLAT_PRICE' || type === 'FIXED_PRICE') {
                        const targetPrice = scheme.value;
                        if (item.originalPrice > targetPrice) {
                            discount = Number(((item.originalPrice - targetPrice) * item.qty).toFixed(2));
                        }
                    } else if (type === 'FLAT' || type === 'FLAT_DISCOUNT' || type === 'MANUAL') {
                        discount = Number(Math.min(scheme.value * item.qty, item.originalPrice * item.qty).toFixed(2));
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
