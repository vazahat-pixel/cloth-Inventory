import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import dayjs from 'dayjs';

function FinanceActivityTable({ transactions = [] }) {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
            <Table sx={{ minWidth: 650 }} aria-label="recent finance activity">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Account</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Voucher Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Debit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Credit</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b' }}>
                                No recent financial activity found.
                            </TableCell>
                        </TableRow>
                    )}
                    {transactions.map((row, i) => (
                        <TableRow
                            key={i}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s' }}
                        >
                            <TableCell sx={{ color: '#1e293b' }}>{dayjs(row.date).format('DD MMM YYYY')}</TableCell>
                            <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{row.account}</TableCell>
                            <TableCell sx={{ color: '#64748b' }}>
                                <span style={{
                                    background: row.type === 'Receipt' ? '#dcfce7' : '#fee2e2',
                                    color: row.type === 'Receipt' ? '#166534' : '#991b1b',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    {row.type}
                                </span>
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 600 }}>
                                {row.debit > 0 ? `₹${Number(row.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 600 }}>
                                {row.credit > 0 ? `₹${Number(row.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default FinanceActivityTable;
