import { useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

const getDefaultValues = (fields, initialValues) =>
  fields.reduce((accumulator, field) => {
    accumulator[field.name] = initialValues?.[field.name] ?? field.defaultValue ?? '';
    return accumulator;
  }, {});

function MasterFormDialog({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initialValues,
  fields,
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues(fields, initialValues),
  });

  useEffect(() => {
    reset(getDefaultValues(fields, initialValues));
  }, [fields, initialValues, open, reset]);

  const submitHandler = (formValues) => {
    const normalizedValues = { ...formValues };

    fields.forEach((field) => {
      if (field.type === 'number' && normalizedValues[field.name] !== '') {
        normalizedValues[field.name] = Number(normalizedValues[field.name]);
      }
    });

    onSubmit(normalizedValues);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={handleSubmit(submitHandler)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid key={field.name} item xs={12} sm={field.size || 6}>
                <Controller
                  name={field.name}
                  control={control}
                  rules={{
                    required: field.required ? `${field.label} is required.` : false,
                    pattern: field.type === 'email' ? { value: /\S+@\S+\.\S+/, message: 'Enter a valid email.' } : undefined,
                  }}
                  render={({ field: controlledField }) => (
                    <TextField
                      {...controlledField}
                      fullWidth
                      size="small"
                      label={field.label}
                      type={field.type === 'select' ? 'text' : field.type || 'text'}
                      multiline={Boolean(field.multiline)}
                      minRows={field.minRows || 1}
                      select={field.type === 'select'}
                      error={Boolean(errors[field.name])}
                      helperText={errors[field.name]?.message || ' '}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    >
                      {field.type === 'select' &&
                        field.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {submitLabel || 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default MasterFormDialog;
