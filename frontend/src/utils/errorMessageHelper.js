/**
 * errorMessageHelper.js — Returns user-friendly error messages based on HTTP response or situation
 */

export const getFriendlyErrorMessage = (error, fallbackMessage = 'Kuch galat ho gaya, thodi der baad koshish karein.') => {
    if (!error) return fallbackMessage;

    // Handle Network Error (axios throws this when server is down or internet is off)
    if (error.message === 'Network Error') {
        return 'Server se connect nahi ho pa raha hai. Apna Internet check karein ya thodi der mein try karein.';
    }

    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;

    // Use backend message if it's customized and specific
    if (backendMessage && backendMessage !== 'Internal Server Error' && status !== 500) {
        return backendMessage;
    }

    switch (status) {
        case 400:
            return 'Di gayi jaankari sahi nahi hai, please check karke dobara bharein.';
        case 401:
            return 'Aapka login session khatam ho gaya hai. Please dobara login karein.';
        case 403:
            return 'Aapke paas is kaam ko karne ki permission nahi hai.';
        case 404:
            return 'Jo aap dhoond rahe hain wo nahi mila.';
        case 422:
            return 'Validation error: Di gayi detail scan nahi ho pa rahi ya galat hai.';
        case 500:
            return 'Server par kuch technical dikkat hai. Hum ise jald theek kar denge.';
        case 503:
            return 'System thodi der ke liye band hai (Maintenance). Thodi der baad try karein.';
        default:
            return fallbackMessage;
    }
};

export default getFriendlyErrorMessage;
