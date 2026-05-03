import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ContactReplyEmailProps {
  customerName: string;
  originalSubject: string;
  originalMessage: string;
  replyText: string;
}

export function ContactReplyEmail({
  customerName,
  originalSubject,
  originalMessage,
  replyText,
}: ContactReplyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reply to your message: {originalSubject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>We&apos;ve replied to your message</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for reaching out to us. Here is our reply to your message:
          </Text>

          <Section style={replyBox}>
            <Text style={replyText_}>{replyText}</Text>
          </Section>

          <Text style={dividerLabel}>Your original message</Text>
          <Section style={originalBox}>
            <Text style={originalText}>{originalMessage}</Text>
          </Section>

          <Text style={text}>
            If you have any further questions, feel free to contact us again.
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

const replyBox = {
  backgroundColor: '#F0F7F2',
  borderLeft: '4px solid #3D8B4F',
  borderRadius: '4px',
  padding: '16px',
  margin: '0 0 24px',
};

const replyText_ = {
  color: '#1A1A1A',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const dividerLabel = {
  color: '#6B7280',
  fontSize: '11px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
};

const originalBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '4px',
  padding: '12px 16px',
  margin: '0 0 24px',
};

const originalText = {
  color: '#6B7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const footer = {
  color: '#6B7280',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '32px 0 0',
};
