import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import {
  fetchProducts,
  fetchProductsByCategory,
  searchProducts,
  fetchCategories,
} from '../features/product/productSlice';
import ProductCard from '../components/common/ProductCard';
import ProductCardSkeleton from '../components/common/ProductCardSkeleton';
import PageTransition from '../components/common/PageTransition';

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, totalPages, totalElements, currentPage, pageSize, loading } =
    useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const categoryId = searchParams.get('category');
  const urlPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const zeroBasedPage = urlPage - 1;

  const updateParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    setSearchParams(params, { replace: false });
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery) {
      dispatch(searchProducts({ keyword: searchQuery, page: zeroBasedPage }));
    } else if (categoryId) {
      dispatch(fetchProductsByCategory({ categoryId: Number(categoryId), page: zeroBasedPage }));
    } else {
      dispatch(fetchProducts({ page: zeroBasedPage, sortBy, sortDir }));
    }
  }, [dispatch, categoryId, sortBy, sortDir, searchQuery, zeroBasedPage]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    updateParams({ page: page === 1 ? null : String(page) });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({});
      dispatch(searchProducts({ keyword: searchQuery.trim(), page: 0 }));
    }
  };

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  return (
    <PageTransition>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {selectedCategory ? selectedCategory.name : 'All Products'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {selectedCategory ? selectedCategory.description : 'Browse our premium dry fruits collection'}
      </Typography>

      {}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: 1, minWidth: 200 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="createdAt">Newest</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortDir}
            label="Order"
            onChange={(e) => setSortDir(e.target.value)}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          variant={!categoryId ? 'filled' : 'outlined'}
          color={!categoryId ? 'primary' : 'default'}
          onClick={() => { setSearchParams({}); setSearchQuery(''); }}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            variant={categoryId === String(cat.id) ? 'filled' : 'outlined'}
            color={categoryId === String(cat.id) ? 'primary' : 'default'}
            onClick={() => {
              setSearchParams({ category: String(cat.id) });
              setSearchQuery('');
            }}
          />
        ))}
      </Box>

      {isAdmin ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Admin users cannot browse products. Please use the Admin Dashboard to manage products.
          </Typography>
        </Box>
      ) : loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: pageSize || 6 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <ProductCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchQuery ? `No products found for "${searchQuery}".` : 'No products found.'}
          </Typography>
          {searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try a different search term or browse our categories.
            </Typography>
          )}
        </Box>
      ) : (
        <>
          {totalElements > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {currentPage * pageSize + 1}
              –{Math.min(currentPage * pageSize + products.length, totalElements)} of {totalElements}
              {' '}{totalElements === 1 ? 'product' : 'products'}
            </Typography>
          )}

          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={Math.min(urlPage, totalPages)}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
    </PageTransition>
  );
};

export default ProductsPage;
