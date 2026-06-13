import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import type { Faq } from '../../types';

const defaultFaqs: Faq[] = [
  { id: -1, question: 'How fresh are the products when delivered?', answer: 'Every order is packed on demand from our climate-controlled storage and sealed in airtight, food-grade pouches. Most customers receive their order within 3–5 business days of dispatch.', displayOrder: 0 },
  { id: -2, question: 'How should I store this product?', answer: 'Keep the pack in a cool, dry place away from direct sunlight. Once opened, transfer the contents to an airtight container or reseal the pouch tightly to preserve crunch and flavor.', displayOrder: 1 },
  { id: -3, question: 'Are these dry fruits raw, roasted, or salted?', answer: 'Preparation varies by product. Refer to the Description section above for the exact processing details for this specific item.', displayOrder: 2 },
  { id: -4, question: 'Do you offer returns or refunds?', answer: 'Yes. If your order arrives damaged or you are not satisfied with the quality, contact us within 7 days of delivery and we will arrange a replacement or refund as per our return policy.', displayOrder: 3 },
  { id: -5, question: 'Is the packaging vegetarian and food-safe?', answer: 'Absolutely. All Kamyaabi products are 100% vegetarian and packed in FSSAI-compliant, food-grade materials that protect freshness without any added preservatives.', displayOrder: 4 },
];

interface ProductFaqTabProps {
  faqs: Faq[];
}

const ProductFaqTab: React.FC<ProductFaqTabProps> = ({ faqs }) => {
  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;
  return (
    <>
      {displayFaqs.map((item, idx) => (
        <Accordion
          key={item.id ?? idx}
          disableGutters
          square
          sx={{
            mb: 1.25,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 'none',
            '&::before': { display: 'none' },
            '&.Mui-expanded': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls={`faq-content-${idx}`}
            id={`faq-header-${idx}`}
            sx={{ px: 2, py: 0.5 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
};

export default ProductFaqTab;
