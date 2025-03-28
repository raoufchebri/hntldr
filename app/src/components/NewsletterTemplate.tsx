import * as React from 'react';
import {
  Body,
  Button,
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

interface Article {
  title: string;
  description: string;
  points: number;
  comments: number;
}

interface NewsletterTemplateProps {
  previewText?: string;
  articles?: Article[];
}

export const NewsletterTemplate: React.FC<Readonly<NewsletterTemplateProps>> = ({
  previewText = "Today's top stories from Hacker News, summarized for you",
  articles = [
    {
      title: "OpenAI's Latest Breakthrough in Language Models",
      description: "A new approach to training language models that reduces computational costs by 90%",
      points: 1250,
      comments: 432,
    },
    {
      title: "The Rise of Rust in System Programming",
      description: "Why more companies are adopting Rust for performance-critical applications",
      points: 987,
      comments: 345,
    },
    {
      title: "PostgreSQL 16 New Features",
      description: "Exploring the latest features and improvements in PostgreSQL 16",
      points: 876,
      comments: 234,
    },
  ],
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={header}>HNTLDR</Heading>
          <Text style={subtitle}>
            Hacker News Too Long; Didn&apos;t Read - Audio Summaries
          </Text>

          {/* Latest Episode Button */}
          <Section style={buttonContainer}>
            <Button
              href={`${baseUrl}/latest`}
              style={playButton}
            >
              ▶ LISTEN TO LATEST EPISODE
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Top Stories */}
          <Heading as="h2" style={sectionTitle}>
            Today&apos;s Top Stories
          </Heading>

          {articles.map((article, index) => (
            <Section key={index} style={articleSection}>
              <Link style={articleTitle} href={`${baseUrl}/latest`}>
                {article.title}
              </Link>
              <Text style={articleDescription}>
                {article.description}
              </Text>
              <Text style={articleMeta}>
                {article.points} points • {article.comments} comments
              </Text>
            </Section>
          ))}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you subscribed to HNTLDR updates.
            </Text>
            <Link
              href={`${baseUrl}/unsubscribe?id={{unsubscribeId}}`}
              style={unsubscribeLink}
            >
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
};

const header = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  textAlign: 'center' as const,
  color: '#000',
  margin: '32px 0 4px',
};

const subtitle = {
  fontSize: '16px',
  textAlign: 'center' as const,
  color: '#666666',
  margin: '0 0 32px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const playButton = {
  backgroundColor: '#f97316',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const divider = {
  borderTop: '1px dashed #cccccc',
  margin: '32px 0',
};

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#000',
  margin: '24px 0 16px',
  padding: '0 24px',
};

const articleSection = {
  padding: '0 24px',
  margin: '0 0 24px',
};

const articleTitle = {
  color: '#000',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  marginBottom: '8px',
  display: 'block',
};

const articleDescription = {
  color: '#444444',
  fontSize: '16px',
  margin: '8px 0',
  lineHeight: '1.5',
};

const articleMeta = {
  color: '#666666',
  fontSize: '14px',
  margin: '8px 0 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '0 24px',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  margin: '8px 0',
};

const unsubscribeLink = {
  color: '#666666',
  textDecoration: 'underline',
  fontSize: '14px',
};

export default NewsletterTemplate; 