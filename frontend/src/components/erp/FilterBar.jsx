import { Paper, Stack } from '@mui/material';

function FilterBar({ children, sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        p: 2,
        bgcolor: '#fff',
        ...sx,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        {children}
      </Stack>
    </Paper>
  );
}

export default FilterBar;

