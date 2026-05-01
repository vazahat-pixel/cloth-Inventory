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
        
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        let schemes = await Scheme.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $gte: todayStart } },
                { endDate: null }
            ]
        }).populate('applicablePromotionGroups').lean();

        console.log(`🔍 [SCHEME-ENGINE] Total Active Schemes in DB: ${schemes.length}`);
        
        // Sort by Strict Priority Hierarchy: 
        // 1. Specific Product(s) - Highest
        // 2. Promotion Group(s)
        // 3. Specific Category / Brand
        // 4. Global Fallback (All items) - Lowest
        schemes.sort((a, b) => {
            const getPriorityValue = (s) => {
                let score = 100; // Default lowest priority
                if (s.applicableProducts?.length) score = 10;
                else if (s.applicablePromotionGroups?.length) score = 20;
                else if (s.applicableCategories?.length || s.applicableBrands?.length) score = 30;
                
                // Tie-breaker: if priorities are same, use the higher value (discount %)
                return score;
            };

            const priorityA = getPriorityValue(a);
            const priorityB = getPriorityValue(b);

            if (priorityA !== priorityB) return priorityA - priorityB;
            
            // If same priority, higher value wins
            return (b.value || 0) - (a.value || 0);
        });

        console.log(`🔍 [SCHEME-ENGINE] Found and prioritized ${schemes.length} active schemes by hierarchy`);
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

        // Process Group-Based Promotions first (BUY_X_GET_Y, BOGO)
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
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === String(item.variantId) || String(id) === String(item.productId));
                    
                    // Check Promotion Groups
                    let isGroupMatch = false;
                    if (scheme.applicablePromotionGroups?.length) {
                        isGroupMatch = scheme.applicablePromotionGroups.some(group => {
                            const isProdInGroup = group.applicableProducts?.some(id => String(id) === String(item.variantId));
                            const isCatInGroup = group.applicableCategories?.some(id => String(id) === String(item.category?._id || item.category));
                            const isBrandInGroup = group.applicableBrands?.some(id => String(id) === String(item.brand?._id || item.brand));
                            return isProdInGroup || isCatInGroup || isBrandInGroup;
                        });
                    }

                    if ((isCatMatch && isBrandMatch && isProductMatch || isGroupMatch) && !item.appliedOffer) {
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
                    const freeCount = setsCount * get;
                    
                    // The last 'freeCount' items in the sorted list are the cheapest
                    const freeInstances = eligibleInstances.slice(eligibleInstances.length - freeCount);

                    freeInstances.forEach(fi => {
                        const originalItem = currentItems[fi.cartIdx];
                        originalItem.promoPrice = 0; 
                        originalItem.promoDiscount += fi.originalPrice;
                        originalItem.appliedOffer = scheme.name;
                        totalDiscount += fi.originalPrice;
                    });

                    appliedOffers.push({ _id: scheme._id, name: scheme.name, discount: freeInstances.reduce((a, b) => a + b.originalPrice, 0), ruleLabel: type === 'BOGO' ? 'BOGO' : `Buy ${buy} Get ${get}` });
                }
            }
        }

        // Process Line-Based Promotions (Percentage/Flat) for items not yet under an offer
        for (const scheme of schemes) {
            const type = (scheme.type || '').toUpperCase();
            if (type === 'PERCENTAGE' || type.includes('PERCENTAGE') || type === 'FLAT' || type.includes('FLAT') || type === 'FLAT_PRICE' || type === 'MANUAL') {
                currentItems.forEach(item => {
                    if (item.appliedOffer) return; // Skip if already handled by BOGO

                    const isCatMatch = !scheme.applicableCategories?.length || scheme.applicableCategories.some(id => String(id) === String(item.category?._id || item.category));
                    const isBrandMatch = !scheme.applicableBrands?.length || scheme.applicableBrands.some(id => String(id) === String(item.brand?._id || item.brand?.name || item.brand));
                    
                    const itemVarId = String(item.variantId || item.id);
                    const itemProdId = String(item.productId || '');
                    const isProductMatch = !scheme.applicableProducts?.length || scheme.applicableProducts.some(id => String(id) === itemVarId || String(id) === itemProdId);
                    
                    // Check Promotion Groups
                    let isGroupMatch = false;
                    let appliedSource = 'General';
                    if (scheme.applicableProducts?.length && isProductMatch) appliedSource = 'Item';
                    else if (scheme.applicablePromotionGroups?.length) {
                        isGroupMatch = scheme.applicablePromotionGroups.some(group => {
                            const isProdInGroup = group.applicableProducts?.some(id => String(id) === itemVarId);
                            const isCatInGroup = group.applicableCategories?.some(id => String(id) === String(item.category?._id || item.category));
                            const isBrandInGroup = group.applicableBrands?.some(id => String(id) === String(item.brand?._id || item.brand));
                            return isProdInGroup || isCatInGroup || isBrandInGroup;
                        });
                        if (isGroupMatch) appliedSource = 'Group';
                    }
                    else if (scheme.applicableCategories?.length && isCatMatch) appliedSource = 'Category';
                    else if (scheme.applicableBrands?.length && isBrandMatch) appliedSource = 'Brand';

                    console.log(`   👉 Item: ${itemVarId} (Prod: ${itemProdId}) | Match: Cat=${isCatMatch}, Brand=${isBrandMatch}, Prod=${isProductMatch}, Group=${isGroupMatch}`);

                    if (isCatMatch && isBrandMatch && isProductMatch || isGroupMatch) {
                        let discount = 0;
                        if (type === 'PERCENTAGE' || type.includes('PERCENTAGE')) {
                            discount = (item.originalPrice * item.qty) * (scheme.value / 100);
                        } else if (type === 'FLAT_PRICE' || type === 'FIXED_PRICE') {
                            // Flat Selling Price: Target price per item instance
                            const targetPrice = scheme.value;
                            if (item.originalPrice > targetPrice) {
                                discount = (item.originalPrice - targetPrice) * item.qty;
                            }
                        } else if (type === 'FLAT' || type === 'FLAT_DISCOUNT') {
                            // Standard Flat OFF discount
                            discount = Math.min(scheme.value, item.originalPrice * item.qty);
                        } else if (type === 'MANUAL') {
                            discount = Math.min(scheme.value, item.originalPrice * item.qty);
                        }

                            if (discount > 0) {
                                console.log(`      ✨ Applied ${scheme.name} (${appliedSource}): -₹${discount}`);
                                item.promoDiscount += discount;
                                item.appliedOffer = scheme.name;
                                item.appliedOfferType = type;
                                item.appliedOfferValue = scheme.value;
                                item.appliedOfferSource = appliedSource;
                                totalDiscount += discount;
                                
                                let ruleLabel = '';
                                if (type.includes('PERCENTAGE')) ruleLabel = `${scheme.value}%`;
                                else if (type === 'FLAT_PRICE' || type === 'FIXED_PRICE') ruleLabel = `Fixed: ₹${scheme.value}`;
                                else if (type === 'BOGO') ruleLabel = 'BOGO';
                                else ruleLabel = `Flat: ₹${scheme.value}`;

                                appliedOffers.push({ 
                                    _id: scheme._id, 
                                    name: scheme.name, 
                                    discount, 
                                    type: scheme.type, 
                                    value: scheme.value,
                                    ruleLabel,
                                    source: appliedSource 
                                });
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
