import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  trackingUrl: string;
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  subtotal,
  shipping,
  tax,
  total,
  trackingUrl,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Slicing Edge order #{orderNumber} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Order Confirmed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for your order! We&apos;re preparing your items and will
            notify you when they ship.
          </Text>
          <Text style={orderNumberStyle}>Order #{orderNumber}</Text>

          <Hr style={hr} />

          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column style={itemName}>
                {item.name} x{item.quantity}
              </Column>
              <Column style={itemPrice}>{item.price}</Column>
            </Row>
          ))}

          <Hr style={hr} />

          <Row style={summaryRow}>
            <Column style={summaryLabel}>Subtotal</Column>
            <Column style={summaryValue}>{subtotal}</Column>
          </Row>
          <Row style={summaryRow}>
            <Column style={summaryLabel}>Shipping</Column>
            <Column style={summaryValue}>{shipping}</Column>
          </Row>
          <Row style={summaryRow}>
            <Column style={summaryLabel}>Tax</Column>
            <Column style={summaryValue}>{tax}</Column>
          </Row>
          <Row style={summaryRow}>
            <Column style={{ ...summaryLabel, fontWeight: '700' }}>Total</Column>
            <Column style={{ ...summaryValue, fontWeight: '700' }}>{total}</Column>
          </Row>

          <Section style={buttonContainer}>
            <Link style={button} href={trackingUrl}>
              Track Your Order
            </Link>
          </Section>

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

const orderNumberStyle = {
  color: '#3D8B4F',
  fontSize: '16px',
  fontWeight: '600' as const,
  textAlign: 'center' as const,
  margin: '0 0 16px',
};

const hr = { borderColor: '#D1D5DB', margin: '16px 0' };

const itemRow = { margin: '8px 0' };
const itemName = { color: '#1A1A1A', fontSize: '14px' };
const itemPrice = { color: '#1A1A1A', fontSize: '14px', textAlign: 'right' as const };

const summaryRow = { margin: '4px 0' };
const summaryLabel = { color: '#6B7280', fontSize: '14px' };
const summaryValue = { color: '#1A1A1A', fontSize: '14px', textAlign: 'right' as const };

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
