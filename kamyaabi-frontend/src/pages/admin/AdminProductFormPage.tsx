import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Skeleton } from '@mui/material';

import { useProductForm } from '../../hooks/useProductForm';
import AdminFormShell from '../../components/admin/layout/AdminFormShell';
import InlineConfirmBar from '../../components/admin/InlineConfirmBar';
import ProductBasicFields from '../../components/admin/product-form/ProductBasicFields';
import ProductImagesField from '../../components/admin/product-form/ProductImagesField';
import ProductInventoryFields from '../../components/admin/product-form/ProductInventoryFields';
import ProductSeoAccordion from '../../components/admin/product-form/ProductSeoAccordion';

const LIST_PATH = '/admin/products';

const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editingProductId = id ? Number(id) : null;
  const navigate = useNavigate();

  const {
    loading,
    loadError,
    saving,
    uploadProgress,
    productForm,
    productErrors,
    updateForm,
    categories,
    allProductTags,
    selectedTagIds,
    setSelectedTagIds,
    images,
    handleSaveProduct,
  } = useProductForm(editingProductId);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="rounded" height={520} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <AdminFormShell
      title={editingProductId ? 'Edit Product' : 'Add Product'}
      subtitle={editingProductId ? 'Update product details, images, tags and SEO metadata.' : 'Create a new product with images, pricing, tags and SEO metadata.'}
      onSubmit={handleSaveProduct}
      onCancel={() => navigate(LIST_PATH)}
      saving={saving}
      submitLabel={editingProductId ? 'Save changes' : 'Create product'}
    >
      {loadError && (
        <InlineConfirmBar
          open
          severity="error"
          title="Couldn't load product"
          message={loadError}
          confirmLabel="Retry"
          cancelLabel="Back to list"
          onConfirm={() => editingProductId && navigate(0)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ProductBasicFields form={productForm} errors={productErrors} updateForm={updateForm} />
        <ProductImagesField
          editingProductId={editingProductId}
          saving={saving}
          uploadProgress={uploadProgress}
          imagesError={productErrors.images}
          images={images}
        />
        <ProductInventoryFields
          form={productForm}
          errors={productErrors}
          updateForm={updateForm}
          categories={categories}
          allProductTags={allProductTags}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
        <ProductSeoAccordion form={productForm} updateForm={updateForm} />
      </Box>
    </AdminFormShell>
  );
};

export default AdminProductFormPage;
