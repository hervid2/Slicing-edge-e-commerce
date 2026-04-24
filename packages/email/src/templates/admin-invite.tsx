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

interface AdminInviteEmailProps {
  email: string;
  setupUrl: string;
}

export function AdminInviteEmail({ email, setupUrl }: AdminInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to manage Slicing Edge as an admin</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Admin Invitation</Heading>
          <Text style={text}>Hi {email},</Text>
          <Text style={text}>
            You have been invited to join <strong>Slicing Edge</strong> as an administrator.
            Click the button below to set up your password and activate your account.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href={setupUrl}>
              Set Up My Account
            </Link>
          </Section>
          <Text style={text}>
            This invitation link will expire in 24 hours. If you were not expecting this
            invitation, you can safely ignore this email.
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
