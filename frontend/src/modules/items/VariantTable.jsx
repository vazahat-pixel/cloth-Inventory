import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Controller, useForm } from 'react-hook-form';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';
import api from '../../services/api';

const INITIAL_COLORS = ['Black', 'Blue', 'Red', 'White', 'Green', 'Grey', 'Navy', 'Yellow', 'Pink', 'Cream', 'Olive', 'Multi'];

const createVariantId = () => `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const sanitizeSkuPart = (value, fallback) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return normalized || fallback;
};

const generateSku = (styleCode, size, color) =>
  `${sanitizeSkuPart(styleCode, 'STYLE')}-${sanitizeSkuPart(size, 'SIZE')}-${sanitizeSkuPart(color, 'COLOR')}`;

const generateSequentialPreviewSku = (prefix, sequence) =>
  `${sanitizeSkuPart(prefix, 'BR')}-${String(sequence).padStart(4, '0')}`;

const normalizeSizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

const STANDARD_SIZE_ORDER = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '4XL',
  '5XL',
  '6XL',
  '7XL',
  '8XL',
  '9XL',
  '10XL',
  'XXXS',
  'XXS',
  'XS',
];

const normalizeStandardSize = (size) => {
  const normalized = normalizeSizeCode(size).replace(/\s/g, '');
  if (normalized === '2XL') return 'XXL';
  if (normalized === '3XL') return 'XXXL';
  if (normalized === 'ONESIZE' || normalized === 'ONESIZEFITSALL') return 'FREE';
  if (normalized === 'FREESIZE') return 'FREE';
  if (normalized === 'UNIVERSAL') return 'UNI';
  return normalized;
};

const getHeuristicSizeRank = (size) => {
  const normalized = normalizeStandardSize(size);

  // Put common "free/universal" near the end (before unknowns)
  if (['FREE', 'FS', 'UNI', 'OS', 'ONE', 'UNSIZED'].includes(normalized)) return 9000;

  // Numeric sizes (e.g. 28, 30, 44) after apparel sizes
  if (/^\d+$/.test(normalized)) return 10000 + Number(normalized);

  // Waist-style (e.g. W28, 28W)
  const waistMatch = normalized.match(/^(?:W)?(\d+)(?:W)?$/);
  if (waistMatch) return 11000 + Number(waistMatch[1]);

  const standardIndex = STANDARD_SIZE_ORDER.indexOf(normalized);
  if (standardIndex !== -1) return standardIndex;

  // Other measurement-like sizes (e.g. MTR, CMS) after numeric
  if (['MTR', 'METER', 'METRE', 'CM', 'CMS', 'INCH', 'INCHES', 'MM'].includes(normalized)) return 20000;

  return 30000;
};

const getSequentialSkuNumber = (sku) => {
  const normalized = String(sku || '').trim().toUpperCase();
  const match = normalized.match(/-(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
};

const createVariantPayload = (overrides = {}) => ({
  id: createVariantId(),
  size: '',
  color: '',
  sku: '',
  barcodePrefix: '',
  mrp: 0,
  stock: 0,
  reorderLevel: 0,
  status: 'Active',
  ...overrides,
});

function VariantTable({ variants, onChange, styleCode, readOnly = false, sizeOptions = [], brandId = null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [localColors, setLocalColors] = useState(INITIAL_COLORS);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [generatorFeedback, setGeneratorFeedback] = useState(null);

  const previousStyleCodeRef = useRef(styleCode);

  useEffect(() => {
    if (previousStyleCodeRef.current !== styleCode) {
      const prevCode = previousStyleCodeRef.current;
      let hasChanges = false;
      const updatedVariants = variants.map((v) => {
        const expectedOldSku = generateSku(prevCode, v.size, v.color);
        if (v.sku === expectedOldSku) {
          hasChanges = true;
          return { ...v, sku: generateSku(styleCode, v.size, v.color) };
        }
        return v;
      });

      if (hasChanges) {
        onChange(updatedVariants);
      }
      previousStyleCodeRef.current = styleCode;
    }
  }, [styleCode, variants, onChange]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: createVariantPayload({
      sku: generateSku(styleCode, '', ''),
    }),
  });

  const compareSizes = useMemo(() => {
    return (a, b) => {
      const sizeA = normalizeSizeCode(a);
      const sizeB = normalizeSizeCode(b);

      const rankA = getHeuristicSizeRank(sizeA);
      const rankB = getHeuristicSizeRank(sizeB);
      if (rankA !== rankB) return rankA - rankB;

      return sizeA.localeCompare(sizeB);
    };
  }, []);

  const compareVariants = useMemo(() => {
    return (a, b) => {
      const bySize = compareSizes(a.size, b.size);
      if (bySize) return bySize;
      const byColor = String(a.color || '').localeCompare(String(b.color || ''), undefined, { sensitivity: 'base' });
      if (byColor) return byColor;
      const bySku = String(a.sku || '').localeCompare(String(b.sku || ''), undefined, { sensitivity: 'base' });
      if (bySku) return bySku;
      return String(a.id || '').localeCompare(String(b.id || ''));
    };
  }, [compareSizes]);

  const applySortedVariants = (nextVariants) => [...nextVariants].sort(compareVariants);

  const normalizedSizeOptions = useMemo(
    () =>
      sizeOptions
        .map((option) =>
          typeof option === 'string'
            ? { value: option, label: option }
            : {
                value: option?.value || option?.sizeCode || option?.name || option?.sizeLabel || '',
                label: option?.label || option?.sizeLabel || option?.name || option?.value || option?.sizeCode || '',
              },
        )
        .filter((option) => option.value),
    [sizeOptions],
  );
  const sizeLabelLookup = useMemo(
    () =>
      buildSizeLabelLookup(
        normalizedSizeOptions.map((option) => ({
          sizeCode: option.value,
          sizeLabel: option.label,
        })),
      ),
    [normalizedSizeOptions],
  );

  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  const peekBarcodes = async (count) => {
    if (!brandId) return [];
    try {
      const response = await api.get('/items/peek-barcodes', { params: { brandId, count } });
      return response.data?.barcodes || [];
    } catch (err) {
      console.error('Failed to peek barcodes:', err);
      return [];
    }
  };

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    [variants],
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVariant(null);
  };

  const openAddDialog = async () => {
    if (readOnly) {
      return;
    }
    setEditingVariant(null);
    setAutoGenerateSku(true);
    const [peek] = await peekBarcodes(1);
    const nextSequence = variants.reduce((maxSequence, variant) => {
      const sequence = getSequentialSkuNumber(variant.sku);
      return sequence && sequence > maxSequence ? sequence : maxSequence;
    }, 0) + 1;
    reset(
      createVariantPayload({
        sku: peek || generateSequentialPreviewSku(styleCode, nextSequence),
        barcodePrefix: sanitizeSkuPart(styleCode, 'BAR'),
      }),
    );
    setDialogOpen(true);
  };

  const openEditDialog = (variant) => {
    if (readOnly) {
      return;
    }
    setEditingVariant(variant);
    const generatedSku = generateSku(styleCode, variant.size, variant.color);
    setAutoGenerateSku(variant.sku === generatedSku);
    reset(createVariantPayload(variant));
    setDialogOpen(true);
  };

  const handleDeleteVariant = (variantId) => {
    if (readOnly) {
      return;
    }
    onChange(variants.filter((variant) => variant.id !== variantId));
  };

  const handleVariantSave = (formValues) => {
    const payload = createVariantPayload({
      ...formValues,
      id: editingVariant?.id || createVariantId(),
      mrp: Number(formValues.mrp),
      stock: Number(formValues.stock),
      barcodePrefix: autoGenerateSku ? sanitizeSkuPart(styleCode, 'BAR') : '',
    });

    if (editingVariant) {
      onChange(variants.map((variant) => (variant.id === editingVariant.id ? payload : variant)));
    } else {
      onChange([...variants, payload]);
    }

    closeDialog();
  };

  const toggleBulkSelection = (value, selectedList, setter) => {
    if (selectedList.includes(value)) {
      setter(selectedList.filter((item) => item !== value));
      return;
    }

    setter([...selectedList, value]);
  };

  const handleAddCustomColor = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const val = newColorInput.trim();
      if (!val) return;
      if (!localColors.includes(val)) {
        setLocalColors([...localColors, val]);
      }
      if (!selectedColors.includes(val)) {
        setSelectedColors([...selectedColors, val]);
      }
      setNewColorInput('');
    }
  };

  const handleAddCustomSize = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const val = newSizeInput.trim().toUpperCase();
      if (!val) return;
      
      if (!selectedSizes.includes(val)) {
        setSelectedSizes([...selectedSizes, val]);
      }
      setNewSizeInput('');
    }
  };

  const handleGenerateVariants = async () => {
    if (!selectedSizes.length || !selectedColors.length) {
      setGeneratorFeedback({
        severity: 'warning',
        text: 'Select at least one size and one color to generate combinations.',
      });
      return;
    }

    // 1. Sort sizes in a human-friendly order (S -> M -> L -> XL ...), using master sequence when configured.
    const sortedSelectedSizes = [...selectedSizes].sort(compareSizes);

    const combinations = [];
    sortedSelectedSizes.forEach((size) => {
      selectedColors.forEach((color) => {
        combinations.push({ size, color });
      });
    });

    const existingKeys = new Set(
      variants.map((variant) => `${variant.size}|${variant.color}`.trim().toLowerCase()),
    );

    const newCombinations = combinations.filter(
      (c) => !existingKeys.has(`${c.size}|${c.color}`.toLowerCase())
    );

    if (!newCombinations.length) {
      onChange(applySortedVariants(variants));
      setGeneratorFeedback({
        severity: 'info',
        text: 'All selected combinations already exist. Variants reordered by size.',
      });
      return;
    }

    const peekList = await peekBarcodes(newCombinations.length);
    const currentAutoVariantCount = variants.reduce((maxSequence, variant) => {
      const sequence = getSequentialSkuNumber(variant.sku);
      return sequence && sequence > maxSequence ? sequence : maxSequence;
    }, 0);
    const generatedVariants = newCombinations.map((combo, index) => {
      const sequence = currentAutoVariantCount + index + 1;
      return createVariantPayload({
        size: combo.size,
        color: combo.color,
        sku: peekList[index] || generateSequentialPreviewSku(styleCode, sequence),
        barcodePrefix: sanitizeSkuPart(styleCode, 'BAR'),
      });
    });

    onChange(applySortedVariants([...variants, ...generatedVariants]));
    setGeneratorFeedback({
      severity: 'success',
      text: `Generated ${generatedVariants.length} new variants with local preview SKUs.`,
    });
  };

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Variant Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add size-color combinations with SKU, pricing, and opening stock.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip label={`Variants: ${variants.length}`} color="primary" variant="outlined" />
            <Chip label={`Total Stock: ${totalStock}`} color="success" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
          Bulk Variant Generator
        </Typography>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Select Sizes
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1, mb: 1 }}>
              {normalizedSizeOptions.map((sizeOption) => (
                <Chip
                  key={sizeOption.value}
                  label={sizeOption.label}
                  clickable
                  color={selectedSizes.includes(sizeOption.value) ? 'primary' : 'default'}
                  variant={selectedSizes.includes(sizeOption.value) ? 'filled' : 'outlined'}
                  onClick={() => toggleBulkSelection(sizeOption.value, selectedSizes, setSelectedSizes)}
                  sx={{ mb: 1 }}
                />
              ))}
              {/* Display manually added sizes that aren't in normalizedSizeOptions */}
              {selectedSizes.filter(s => !normalizedSizeOptions.some(o => o.value === s)).map(customSize => (
                 <Chip
                  key={customSize}
                  label={customSize}
                  clickable
                  color="secondary"
                  variant="filled"
                  onDelete={() => toggleBulkSelection(customSize, selectedSizes, setSelectedSizes)}
                  onClick={() => toggleBulkSelection(customSize, selectedSizes, setSelectedSizes)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            <TextField
              size="small"
              placeholder="Add Custom Size (e.g. 44) + Press Enter"
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              onKeyDown={handleAddCustomSize}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Button size="small" onClick={handleAddCustomSize}>Add</Button>
                )
              }}
              sx={{ mt: 1 }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Select Colors
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1, mb: 1 }}>
              {localColors.map((color) => (
                <Chip
                  key={color}
                  label={color}
                  clickable
                  color={selectedColors.includes(color) ? 'primary' : 'default'}
                  variant={selectedColors.includes(color) ? 'filled' : 'outlined'}
                  onClick={() => toggleBulkSelection(color, selectedColors, setSelectedColors)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            <TextField
              size="small"
              placeholder="Add Custom Color (e.g. Ocean Blue) + Press Enter"
              value={newColorInput}
              onChange={(e) => setNewColorInput(e.target.value)}
              onKeyDown={handleAddCustomColor}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Button size="small" onClick={handleAddCustomColor}>Add</Button>
                )
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          {!readOnly ? (
            <>
              <Button
                variant="contained"
                type="button"
                startIcon={<AutoFixHighIcon />}
                onClick={handleGenerateVariants}
              >
                Generate Combinations
              </Button>
              <Button 
                variant="outlined" 
                type="button"
                startIcon={<AddCircleOutlineIcon />} 
                onClick={openAddDialog}
              >
                Add Variant Manually
              </Button>
            </>
          ) : null}
        </Stack>

        {generatorFeedback && (
          <Alert severity={generatorFeedback.severity} sx={{ mt: 2 }}>
            {generatorFeedback.text}
          </Alert>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {variants.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    MRP
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Stock
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    ROL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...variants].sort(compareVariants).map((variant) => (
                  <TableRow key={variant.id} hover>
                    <TableCell>{getSizeLabel(variant.size)}</TableCell>
                    <TableCell>{variant.color}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    <TableCell align="right">{variant.mrp}</TableCell>
                    <TableCell align="right">{variant.stock}</TableCell>
                    <TableCell align="right">{variant.reorderLevel || 0}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={variant.status}
                        color={variant.status === 'Active' ? 'success' : 'default'}
                        variant={variant.status === 'Active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {!readOnly ? (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="primary" onClick={() => openEditDialog(variant)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Read only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No variants added yet.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Generate combinations or add variants manually to continue.
            </Typography>
            {!readOnly ? (
              <Button variant="contained" onClick={openAddDialog} startIcon={<AddCircleOutlineIcon />}>
                Add First Variant
              </Button>
            ) : null}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <Box>
          <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Controller
                  name="size"
                  control={control}
                  rules={{ required: 'Size is required.' }}
                  render={({ field }) => {
                    const isManualSize = field.value && !normalizedSizeOptions.some(o => o.value === field.value);
                    return (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        label="Size"
                        placeholder="Ex: 42 or XL"
                        error={Boolean(errors.size)}
                        helperText={errors.size?.message || ' '}
                        InputProps={isManualSize ? {
                           endAdornment: <Chip label="Custom" size="small" color="secondary" sx={{ mr: 1 }} />
                        } : {}}
                      />
                    );
                  }}
                />

                <Controller
                  name="color"
                  control={control}
                  rules={{ required: 'Color is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      label="Color (Name)"
                      placeholder="Ex: Navy Blue"
                      error={Boolean(errors.color)}
                      helperText={errors.color?.message || ' '}
                    />
                  )}
                />

                <Controller
                  name="colorCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      label="Color Hex/Brand Code"
                      placeholder="Ex: #000080"
                    />
                  )}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={autoGenerateSku}
                    onChange={(event) => setAutoGenerateSku(event.target.checked)}
                  />
                }
                label="Auto-generate SKU from style code + size + color"
              />

              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    fullWidth
                    label="SKU (Master Code)"
                    placeholder="Ex: TSHIRT-S-BLUE"
                    disabled={autoGenerateSku}
                    error={Boolean(errors.sku)}
                    helperText={errors.sku?.message || 'Unique identifier for this variant. Note: Physical barcodes/stickers are generated post-purchase/GRN.'}
                  />
                )}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Controller
                  name="stock"
                  control={control}
                  rules={{ required: 'Stock is required.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      fullWidth
                      label="Initial Stock"
                      error={Boolean(errors.stock)}
                      helperText={errors.stock?.message || ' '}
                    />
                  )}
                />

                <Controller
                  name="reorderLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      fullWidth
                      label="Reorder Level (ROL)"
                      error={Boolean(errors.reorderLevel)}
                      helperText={errors.reorderLevel?.message || 'Trigger for Low Stock Alert'}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="mrp"
                control={control}
                rules={{ required: 'MRP is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    size="small"
                    fullWidth
                    label="MRP"
                    error={Boolean(errors.mrp)}
                    helperText={errors.mrp?.message || ' '}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                rules={{ required: 'Status is required.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    size="small"
                    fullWidth
                    label="Status"
                    error={Boolean(errors.status)}
                    helperText={errors.status?.message || ' '}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(handleVariantSave)();
              }}
            >
              {editingVariant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}

export default VariantTable;
