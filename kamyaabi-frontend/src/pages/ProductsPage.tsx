/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves search, sort, category/tag URL params, pagination, public settings page size, and product API dispatch behavior.
 * - Visual-only redesign of headings, filter surfaces, and responsive product presentation.
 */
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
  Divider,
} from '@mui/material';
import { Search, LocalOffer } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import {
  fetchProducts,
  fetchProductsByCategory,
  fetchProductsByTag,
  searchProducts,
  fetchCategories,
} from '../features/product/productSlice';
import ProductCard from '../components/common/ProductCard';
import ProductCardSkeleton from '../components/common/ProductCardSkeleton';
import PageTransition from '../components/common/PageTransition';
import { ProductSort } from '../api/productApi';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { productTagApi } from '../api/productTagApi';
import { ProductTag } from '../types';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

const VALID_SORT = new Set<ProductSort>(SORT_OPTIONS.map((o) => o.value));

const isValidSort = (raw: string | null): raw is ProductSort =>
  raw != null && VALID_SORT.has(raw as ProductSort);

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, totalPages, totalElements, currentPage, pageSize, loading } =
    useAppSelector((state) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const publicSettings = usePublicSettings();
  const productsPerPage: number | undefined = (() => {
    const raw = publicSettings?.products_per_page;
    if (raw == null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();

  const sortParam = searchParams.get('sort');
  const sort: ProductSort = isValidSort(sortParam) ? sortParam : 'newest';
  const categoryId = searchParams.get('category');
  const tagSlug = searchParams.get('tag');
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
    productTagApi.getAll()
      .then((res) => setProductTags(res.data.data))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery) {
      dispatch(searchProducts({ keyword: searchQuery, page: zeroBasedPage, size: productsPerPage, sort }));
    } else if (tagSlug) {
      dispatch(fetchProductsByTag({ tagSlug, page: zeroBasedPage, size: productsPerPage, sort }));
    } else if (categoryId) {
      dispatch(
        fetchProductsByCategory({
          categoryId: Number(categoryId),
          page: zeroBasedPage,
          size: productsPerPage,
          sort,
        }),
      );
    } else {
      dispatch(fetchProducts({ page: zeroBasedPage, size: productsPerPage, sort }));
    }
  }, [dispatch, categoryId, tagSlug, sort, searchQuery, zeroBasedPage, productsPerPage]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    updateParams({ page: page === 1 ? null : String(page) });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (next: ProductSort) => {
    updateParams({ sort: next === 'newest' ? null : next, page: null });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({});
      dispatch(searchProducts({ keyword: searchQuery.trim(), page: 0, size: productsPerPage, sort }));
    }
  };

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  return (
    <PageTransition>
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography variant="h3" sx={{ mb: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: { xs: '1.6rem', md: '2rem' } }}>
        {selectedCategory ? selectedCategory.name : 'All Products'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {selectedCategory ? selectedCategory.description : 'Browse our premium dry fruits collection'}
      </Typography>

      {}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1.5, sm: 2 },
          mb: 4,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ flex: '1 1 220px', minWidth: 0 }}
        >
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

        <FormControl
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 200 },
            flex: { xs: '1 1 100%', sm: '0 0 auto' },
          }}
        >
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sort}
            label="Sort By"
            onChange={(e) => handleSortChange(e.target.value as ProductSort)}
          >
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          variant={!categoryId && !tagSlug ? 'filled' : 'outlined'}
          color={!categoryId && !tagSlug ? 'primary' : 'default'}
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

      {productTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <LocalOffer sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
          {productTags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              size="small"
              variant={tagSlug === tag.slug ? 'filled' : 'outlined'}
              color={tagSlug === tag.slug ? 'secondary' : 'default'}
              onClick={() => {
                if (tagSlug === tag.slug) {
                  updateParams({ tag: null, page: null });
                } else {
                  updateParams({ tag: tag.slug, category: null, page: null });
                  setSearchQuery('');
                }
              }}
            />
          ))}
        </Box>
      )}

      {loading ? (
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
