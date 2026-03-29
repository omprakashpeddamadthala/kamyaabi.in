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
import Loading from '../components/common/Loading';

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, totalPages, currentPage, loading } = useAppSelector(
    (state) => state.products
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const categoryId = searchParams.get('category');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery) {
      dispatch(searchProducts({ keyword: searchQuery, page: 0 }));
    } else if (categoryId) {
      dispatch(fetchProductsByCategory({ categoryId: Number(categoryId), page: 0 }));
    } else {
      dispatch(fetchProducts({ page: 0, sortBy, sortDir }));
    }
  }, [dispatch, categoryId, sortBy, sortDir, searchQuery]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    const zeroBasedPage = page - 1;
    if (searchQuery) {
      dispatch(searchProducts({ keyword: searchQuery, page: zeroBasedPage }));
    } else if (categoryId) {
      dispatch(fetchProductsByCategory({ categoryId: Number(categoryId), page: zeroBasedPage }));
    } else {
      dispatch(fetchProducts({ page: zeroBasedPage, sortBy, sortDir }));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({});
      dispatch(searchProducts({ keyword: searchQuery.trim() }));
    }
  };

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {selectedCategory ? selectedCategory.name : 'All Products'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {selectedCategory ? selectedCategory.description : 'Browse our premium dry fruits collection'}
      </Typography>

      {/* Filters */}
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

      {/* Category chips */}
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
            onClick={() => { setSearchParams({ category: String(cat.id) }); setSearchQuery(''); }}
          />
        ))}
      </Box>

      {loading ? (
        <Loading />
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
                page={currentPage + 1}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductsPage;
