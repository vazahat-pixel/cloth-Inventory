/**
 * calculateGST — Pure utility for GST tax split
 * @param {Number} amount - Taxable amount
 * @param {Number} gstPercent - GST percentage (e.g. 5, 12, 18, 28)
 * @param {String} type - GstType enum (CGST_SGST or IGST)
 */
function calculateGST(amount, gstPercent, type) {
    const totalTax = Number(((Number(amount) * Number(gstPercent)) / 100).toFixed(2));

    if (type === "CGST_SGST") {
        const cgst = Number((totalTax / 2).toFixed(2));
        const sgst = Number((totalTax - cgst).toFixed(2));
        return {
            cgst,
            sgst,
            igst: 0,
            totalTax
        };
    }

    return {
        cgst: 0,
        sgst: 0,
        igst: totalTax,
        totalTax
    };
}

/**
 * getFallbackHsn — Fallback HSN lookup based on category and item name
 * @param {String} category 
 * @param {String} itemName 
 * @returns {String} HSN Code
 */
function getFallbackHsn(category, itemName) {
    const cat = (category || '').toUpperCase().trim();
    const name = (itemName || '').toUpperCase().trim();

    // 1. Check Belt
    if (cat.includes('BELT') || name.includes('BELT')) {
        return '42033000';
    }
    // 2. Check Shorts, Short Set, T-Shirts, Sweatshirts, Hoodies, Hosiery (specifically before checking Shirt)
    if (cat.includes('SHORT') || name.includes('SHORT') || cat.includes('HOSIERY') || name.includes('HOSIERY') || cat.includes('T-SHIRT') || name.includes('T-SHIRT') || cat.includes('TSHIRT') || name.includes('TSHIRT') || cat.includes('T SHIRT') || name.includes('T SHIRT') || cat.includes('SWEATSHIRT') || name.includes('SWEATSHIRT') || cat.includes('HOODIE') || name.includes('HOODIE')) {
        return '61099090';
    }
    // 3. Check Shirt
    if (cat.includes('SHIRT') || name.includes('SHIRT')) {
        return '61059090';
    }
    // 4. Check Trouser / Jeans / FTR
    if (cat.includes('TROUSER') || name.includes('TROUSER') || cat.includes('JEANS') || name.includes('JEANS') || name.includes('FTR') || name.includes('FTRZ')) {
        return '61034200';
    }
    // 5. Check Jacket / Blazer / Coat / Suit
    if (cat.includes('JACKET') || name.includes('JACKET') || cat.includes('BLAZER') || name.includes('BLAZER') || cat.includes('COAT') || name.includes('COAT') || cat.includes('SUIT') || name.includes('SUIT')) {
        return '61031990';
    }
    // 6. Check Tie
    if (cat.includes('TIE') || name.includes('TIE')) {
        return '621590';
    }

    return '61099090';
}

module.exports = { calculateGST, getFallbackHsn };

