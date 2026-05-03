import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

type ReturnStatus = 'APPROVED' | 'REJECTED' | 'LABEL_ISSUED' | 'RECEIVED' | 'REFUNDED' | 'CLOSED';

interface ReturnStatusEmailProps {
  customerName: string;
  orderNumber: string;
  status: ReturnStatus;
  adminNote?: string;
  trackingUrl: string;
}

const STATUS_SUBJECT: Record<ReturnStatus, string> = {
  APPROVED: 'Your return request has been approved',
  REJECTED: 'Update on your return request',
  LABEL_ISSUED: 'Your return shipping label is ready',
  RECEIVED: 'We received your return',
  REFUNDED: 'Your refund has been processed',
  CLOSED: 'Your return request has been closed',
};

const STATUS_HEADLINE: Record<ReturnStatus, string> = {
  APPROVED: 'Return Approved',
  REJECTED: 'Return Request Update',
  LABEL_ISSUED: 'Return Label Issued',
  RECEIVED: 'Return Received',
  REFUNDED: 'Refund Processed',
  CLOSED: 'Return Closed',
};

const STATUS_MESSAGE: Record<ReturnStatus, string> = {
  APPROVED:
    'Great news — we have approved your return request. Our team will send you a prepaid shipping label shortly.',
  REJECTED:
    'After reviewing your return request, we were unable to approve it at this time. Please see the note below for more details.',
  LABEL_ISSUED:
    'Your prepaid return shipping label has been issued. Please package the item securely and drop it off at your nearest shipping location.',
  RECEIVED:
    'We have received your returned item and it is now under inspection. We will update you once the review is complete.',
  REFUNDED:
    'Your refund has been processed. Depending on your payment method, it may take 3–5 business days to appear on your statement.',
  CLOSED:
    'Your return request has been closed. If you have any questions, please contact our support team.',
};

const STATUS_COLOR: Record<ReturnStatus, string> = {
  APPROVED: '#3D8B4F',
  REJECTED: '#DC2626',
  LABEL_ISSUED: '#7C3AED',
  RECEIVED: '#0EA5E9',
  REFUNDED: '#3D8B4F',
  CLOSED: '#6B7280',
};

export function ReturnStatusEmail({
  customerName,
  orderNumber,
  status,
  adminNote,
  trackingUrl,
}: ReturnStatusEmailProps) {
  const headline = STATUS_HEADLINE[status];
  const message = STATUS_MESSAGE[status];
  const color = STATUS_COLOR[status];

  return (
    <Html>
      <Head />
      <Preview>
        {STATUS_SUBJECT[status]} — Order #{orderNumber}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ ...heading, color }}>{headline}</Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            This is an update on your return request for order{' '}
            <strong>#{orderNumber}</strong>.
          </Text>
          <Text style={text}>{message}</Text>

          {adminNote && (
            <>
              <Hr style={hr} />
              <Section style={noteBox}>
                <Text style={noteLabel}>Note from our team:</Text>
                <Text style={noteText}>{adminNote}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Link style={button} href={trackingUrl}>
              View Order Details
            </Link>
          </Section>

          <Text style={text}>
            If you have any questions, don&apos;t hesitate to reach out to our support team.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Slicing Edge. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#C5CFC6',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const container = {
  margin: '40px auto',
  padding: '32px',
  maxWidth: '520px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const text = {
  color: '#1A1A1A',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const hr = { borderColor: '#D1D5DB', margin: '16px 0' };

const noteBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 16px',
};

const noteLabel = {
  color: '#374151',
  fontSize: '12px',
  fontWeight: '600' as const,
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const noteText = {
  color: '#4B5563',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };

const button = {
  backgroundColor: '#1A3A2A',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
};

const footer = {
  color: '#6B7280',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '32px 0 0',
};
