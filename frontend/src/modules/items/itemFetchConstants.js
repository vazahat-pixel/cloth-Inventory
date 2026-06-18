/** Default page size for item pickers (GRN, purchase forms, barcode, etc.). */
export const ITEM_PICKER_LIMIT = 300;

/** Tighter limit for quick search-as-you-type pickers. */
export const ITEM_SEARCH_LIMIT = 150;

export const itemPickerParams = (search = '', limit = ITEM_PICKER_LIMIT) => ({
  page: 1,
  limit,
  search: search?.trim() || undefined,
});
