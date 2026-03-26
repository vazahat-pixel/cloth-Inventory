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

module.exports = { calculateGST };
