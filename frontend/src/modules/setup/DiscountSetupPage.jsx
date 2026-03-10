import React from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography, Button } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useAppNavigate } from '../../hooks/useAppNavigate';

const DiscountSetupPage = () => {
    const navigate = useAppNavigate();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Discount Setup & Pricing</Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' } }} onClick={() => navigate('/ho/pricing/schemes')}>
                        <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: '12px', mr: 3 }}>
                                <LocalOfferOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700}>Promotional Schemes</Typography>
                                <Typography variant="body2" color="textSecondary">Manage Buy-X Get-Y, Combo offers and bulk discounts.</Typography>
                            </Box>
                            <IconButton>
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' } }} onClick={() => navigate('/ho/pricing/coupons')}>
                        <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: '12px', mr: 3 }}>
                                <LoyaltyOutlinedIcon color="secondary" sx={{ fontSize: 32 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700}>Vouchers & Coupons</Typography>
                                <Typography variant="body2" color="textSecondary">Generate discount codes for marketing campaigns.</Typography>
                            </Box>
                            <IconButton>
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)' } }} onClick={() => navigate('/ho/pricing/price-lists')}>
                        <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: '12px', mr: 3 }}>
                                <DescriptionOutlinedIcon color="success" sx={{ fontSize: 32 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700}>Price Lists</Typography>
                                <Typography variant="body2" color="textSecondary">Dynamic pricing strategy per store or season.</Typography>
                            </Box>
                            <IconButton>
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// Mock icon imports for consistency
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { IconButton } from '@mui/material';

export default DiscountSetupPage;
