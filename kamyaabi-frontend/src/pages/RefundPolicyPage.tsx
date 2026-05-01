import React from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link as MuiLink,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { config } from '../config';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const RefundPolicyPage: React.FC = () => {
  const supportEmailLink = (
    <MuiLink
      href={`mailto:${config.supportEmail}`}
      underline="hover"
      sx={{ color: 'primary.main', fontWeight: 600 }}
    >
      {config.supportEmail}
    </MuiLink>
  );

  const sections: FaqSection[] = [
    {
      title: 'Section 1 — General Refund Policy',
      items: [
        {
          q: 'What is your return and refund policy?',
          a: 'We accept returns within 7 days of delivery for most products. Items must be unused, in original packaging, and accompanied by proof of purchase.',
        },
        {
          q: 'Which items are not eligible for return?',
          a: 'Perishable goods, personalized/custom items, intimate or sanitary goods, digital downloads, and items marked as "Final Sale" are not eligible for return or refund.',
        },
        {
          q: 'How long does it take to process a refund?',
          a: 'Once we receive and inspect your return, refunds are processed within 5–7 business days. The amount will be credited to your original payment method.',
        },
      ],
    },
    {
      title: 'Section 2 — Return Process',
      items: [
        {
          q: 'How do I initiate a return?',
          a: (
            <>
              Contact our support team at {supportEmailLink} with your order number and reason for return. We will share a return authorization and shipping instructions within 24–48 hours.
            </>
          ),
        },
        {
          q: 'Do I have to pay for return shipping?',
          a: 'If the return is due to a defective product or our error, we will cover return shipping. For other reasons, return shipping costs are borne by the customer.',
        },
        {
          q: 'Can I exchange a product instead of getting a refund?',
          a: 'Yes, exchanges are available for the same item in a different size/color, subject to availability. Contact support to initiate an exchange.',
        },
      ],
    },
    {
      title: 'Section 3 — Order Issues',
      items: [
        {
          q: 'What if I received a damaged or defective product?',
          a: 'Please contact us within 48 hours of delivery with photos of the damage. We will arrange a replacement or full refund at no extra cost.',
        },
        {
          q: 'What if I received the wrong item?',
          a: 'We sincerely apologize for the error. Contact support with your order number and a photo of the item received. We will ship the correct item and arrange a return pickup.',
        },
        {
          q: "My order hasn't arrived. What should I do?",
          a: 'If your order is past the estimated delivery date, please check the tracking link in your confirmation email. If the issue persists, contact our support team and we will investigate immediately.',
        },
      ],
    },
    {
      title: 'Section 4 — Refund Status',
      items: [
        {
          q: 'How do I check my refund status?',
          a: 'You will receive an email confirmation once your refund is initiated. You can also contact our support team with your return reference number for a status update.',
        },
        {
          q: 'Can I cancel my order after placing it?',
          a: 'Orders can be cancelled within 12 hours of placement. After that, the order may have already been dispatched and will need to go through the return process.',
        },
      ],
    },
  ];

  return (
    <Box>
      {}
      <Box sx={{ bgcolor: '#f0ede6', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            Customer Support
          </Typography>
          <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mt: 1 }}>
            Refund Policy
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mt: 2, maxWidth: 600, mx: 'auto' }}>
            Everything you need to know about returns and refunds.
          </Typography>
        </Container>
      </Box>

      {}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#fff' }}>
        <Container maxWidth="md">
          {sections.map((section, sIdx) => (
            <Box key={sIdx} sx={{ mb: { xs: 5, md: 6 } }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                {section.title}
              </Typography>
              <Box>
                {section.items.map((item, iIdx) => {
                  const panelId = `refund-faq-${sIdx}-${iIdx}`;
                  return (
                    <Accordion
                      key={panelId}
                      disableGutters
                      square={false}
                      sx={{
                        mb: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: '8px !important',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        '&:before': { display: 'none' },
                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                        aria-controls={`${panelId}-content`}
                        id={`${panelId}-header`}
                        sx={{
                          px: { xs: 2, md: 3 },
                          py: 1,
                          '& .MuiAccordionSummary-content': { my: 1.5 },
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: '#1A1A1A', lineHeight: 1.5 }}
                        >
                          {item.q}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 2.5, pt: 0 }}>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                          {item.a}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Container>
      </Box>
    </Box>
  );
};

export default RefundPolicyPage;
