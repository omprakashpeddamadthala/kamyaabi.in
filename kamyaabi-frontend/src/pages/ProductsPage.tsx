/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves search, sort, category/tag URL params, pagination, public settings page size, and product API dispatch behavior.
 * - Visual-only redesign of headings, filter surfaces, and responsive product presentation. Includes off-canvas filters for mobile.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Seo from '../components/common/Seo';
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
  Button,
  Drawer,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Search, LocalOffer, FilterList, Close } from '@mui/icons-material';
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

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'almonds': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551804/kamyaabi/assets/img/categorie/almonds.jpg',
  'anjeer': 'https://res.cloudinary.com/dsibez7to/image/upload/v1783216984/kamyaabi/assets/img/categorie/anjeer.jpg',
  'cashew': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551807/kamyaabi/assets/img/categorie/cashew.jpg',
  'dry dates': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551808/kamyaabi/assets/img/categorie/dry_dates.jpg',
  'kalmi dates': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551816/kamyaabi/assets/img/categorie/kalmi_dates.jpg',
  'walnuts': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551821/kamyaabi/assets/img/categorie/walnuts.jpg',
  'raisins': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551819/kamyaabi/assets/img/categorie/raisins.jpg',
  'pistachio': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551817/kamyaabi/assets/img/categorie/pistachio.jpg',
  'seeds': 'https://res.cloudinary.com/dsibez7to/image/upload/v1783216005/kamyaabi/assets/img/categorie/seeds.jpg',
};

const getCategoryImage = (catName: string, catImageUrl: string | null | undefined): string => {
  if (catImageUrl && catImageUrl.trim() !== '') {
    return catImageUrl;
  }
  const cleanName = catName.trim().toLowerCase();
  return CATEGORY_IMAGE_MAP[cleanName] || `https://picsum.photos/seed/${cleanName.replace(/\s+/g, '')}/150/150`;
};

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, totalPages, totalElements, currentPage, pageSize, loading } =
    useAppSelector((state) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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

  const resolvedCategoryId = useMemo(() => {
    if (!categoryId) return null;
    if (/^\d+$/.test(categoryId)) return Number(categoryId);
    const matched = categories.find((c) => c.slug === categoryId);
    if (matched) return matched.id;
    if (categories.length > 0) return -1;
    return null;
  }, [categoryId, categories]);
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
    } else if (resolvedCategoryId !== null) {
      dispatch(
        fetchProductsByCategory({
          categoryId: resolvedCategoryId,
          page: zeroBasedPage,
          size: productsPerPage,
          sort,
        }),
      );
    } else if (!categoryId) {
      dispatch(fetchProducts({ page: zeroBasedPage, size: productsPerPage, sort }));
    }
  }, [dispatch, resolvedCategoryId, categoryId, tagSlug, sort, searchQuery, zeroBasedPage, productsPerPage]);

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

  const selectedCategory = categories.find((c) => c.id === resolvedCategoryId);

  const FiltersContent = () => (
    <Box sx={{ p: { xs: 2, md: 0 } }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: { xs: 'block', md: 'none' } }}>
        Filters & Sort
      </Typography>
      
      <FormControl fullWidth size="small" sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-lg)' } }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sort}
          label="Sort By"
          onChange={(e) => {
            handleSortChange(e.target.value as ProductSort);
            if (isMobile) setIsFilterDrawerOpen(false);
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Categories
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.5, mb: 4 }}>
        <Box
          onClick={() => { setSearchParams({}); setSearchQuery(''); if(isMobile) setIsFilterDrawerOpen(false); }}
          sx={{
            cursor: 'pointer',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            border: (!categoryId && !tagSlug) ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
            boxShadow: (!categoryId && !tagSlug) ? '0 4px 12px rgba(29, 78, 216, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
        >
          <Box
            component="img"
            src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551803/kamyaabi/assets/img/categorie/all_products.jpg"
            alt="All Categories"
            sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
          />
          <Box sx={{ position: 'absolute', bottom: 0, width: '100%', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', textAlign: 'center', py: 0.5, backdropFilter: 'blur(4px)' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>
              All Products
            </Typography>
          </Box>
        </Box>

        {categories.filter((cat) => cat.parentId !== null && cat.parentId !== undefined).map((cat) => {
          const isSelected = categoryId === cat.slug || resolvedCategoryId === cat.id;
          return (
            <Box
              key={cat.id}
              onClick={() => {
                setSearchParams({ category: cat.slug });
                setSearchQuery('');
                if(isMobile) setIsFilterDrawerOpen(false);
              }}
              sx={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                border: isSelected ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Box
                component="img"
                src={getCategoryImage(cat.name, cat.imageUrl)}
                alt={cat.name}
                sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
              />
              <Box sx={{ position: 'absolute', bottom: 0, width: '100%', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', textAlign: 'center', py: 0.5, backdropFilter: 'blur(4px)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 0.5 }}>
                  {cat.name}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {productTags.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            {productTags.map((tag) => {
              const isSelected = tagSlug === tag.slug;
              return (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  variant={isSelected ? 'filled' : 'outlined'}
                  icon={<LocalOffer sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    bgcolor: isSelected ? 'var(--color-brand-secondary)' : 'transparent',
                    color: isSelected ? 'var(--color-surface-dark)' : 'inherit',
                    borderColor: isSelected ? 'transparent' : 'rgba(0,0,0,0.12)'
                  }}
                  onClick={() => {
                    if (isSelected) {
                      updateParams({ tag: null, page: null });
                    } else {
                      updateParams({ tag: tag.slug, category: null, page: null });
                      setSearchQuery('');
                    }
                    if(isMobile) setIsFilterDrawerOpen(false);
                  }}
                />
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <PageTransition>
      {/* GSC FIX: canonical points at /products so filtered/paginated query
          variants don't create duplicate URLs in the index. */}
      <Seo
        title="Shop Premium Dry Fruits & Nuts"
        description="Browse Kamyaabi's full range of premium dry fruits and nuts — almonds, cashews, pistachios, raisins and more. Freshly packed and delivered across India."
        canonicalPath="/products"
      />
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, bgcolor: 'var(--color-surface-bg)', minHeight: '80vh' }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
        <Box>
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {selectedCategory ? selectedCategory.name : 'All Products'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--color-text-muted)', mt: 0.5, fontWeight: 500 }}>
            {selectedCategory ? selectedCategory.description : 'Premium dry fruits, packed with care.'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          mt: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ flex: 1, minWidth: 200 }}
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
              sx: { borderRadius: 'var(--radius-full)', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }
            }}
          />
        </Box>
        
        {isMobile && (
          <Button 
            variant="outlined" 
            startIcon={<FilterList />} 
            onClick={() => setIsFilterDrawerOpen(true)}
            sx={{ borderRadius: 'var(--radius-full)', height: 40, fontWeight: 700, borderColor: 'rgba(0,0,0,0.1)' }}
          >
            Filters
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Box sx={{ position: 'sticky', top: 90 }}>
              <FiltersContent />
            </Box>
          </Grid>
        )}

        <Grid item xs={12} md={9}>
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: pageSize || 6 }).map((_, i) => (
                <Grid item xs={6} sm={4} key={i}>
                  <ProductCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 'var(--radius-2xl)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {searchQuery ? `No products found for "${searchQuery}".` : 'No products found.'}
              </Typography>
              {searchQuery && (
                <Typography variant="body2" sx={{ mt: 1, color: 'var(--color-text-secondary)' }}>
                  Try a different search term or browse our categories.
                </Typography>
              )}
            </Box>
          ) : (
            <>
              {totalElements > 0 && (
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Showing {currentPage * pageSize + 1}
                  –{Math.min(currentPage * pageSize + products.length, totalElements)} of {totalElements}
                  {' '}{totalElements === 1 ? 'product' : 'products'}
                </Typography>
              )}

              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={6} sm={4} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Pagination
                    count={totalPages}
                    page={Math.min(urlPage, totalPages)}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
      
      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 'var(--radius-2xl)',
            borderTopRightRadius: 'var(--radius-2xl)',
            maxHeight: '85vh',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Filters & Sort</Typography>
          <IconButton onClick={() => setIsFilterDrawerOpen(false)} edge="end">
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <FiltersContent />
      </Drawer>
      
    </Container>
    </PageTransition>
  );
};

export default ProductsPage;

