import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Slicing Edge password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset Your Password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to choose a new one.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={resetUrl}>
              Reset Password
            </Link>
          </Section>
          <Text style={text}>
            This link will expire in 1 hour. If you didn&apos;t request a
            password reset, you can safely ignore this email.
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
  maxWidth: '480px',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

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
