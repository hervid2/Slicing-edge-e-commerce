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

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  trackingUrl: string;
}

export function OrderShippedEmail({
  customerName,
  orderNumber,
  trackingUrl,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Slicing Edge order #{orderNumber} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your Order Has Shipped</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Great news! Your order <strong>#{orderNumber}</strong> is on its way. You can track
            your shipment using the link below.
          </Text>

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Link style={button} href={trackingUrl}>
              Track Your Order
            </Link>
          </Section>

          <Text style={text}>
            If you have any questions about your shipment, please don&apos;t hesitate to contact
            us.
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
  color: '#1A3A2A',
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

const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };

const button = {
  backgroundColor: '#3D8B4F',
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
