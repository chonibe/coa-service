"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = void 0;
exports.cn = cn;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
const formatCurrency = (amount, currency = "USD") => {
    const currencyMap = {
        USD: "en-US",
        GBP: "en-GB",
        EUR: "de-DE",
        CAD: "en-CA",
        AUD: "en-AU",
        JPY: "ja-JP",
    };
    const locale = currencyMap[currency] || "en-US";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
    }).format(Number(amount));
};
exports.formatCurrency = formatCurrency;
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
