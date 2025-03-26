import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ResendContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed: boolean;
  created_at: string;
}

export async function addToAudience(email: string): Promise<void> {
  try {
    await resend.contacts.create({
      email,
      audience_id: process.env.RESEND_AUDIENCE_ID || '',
      first_name: email.split('@')[0], // Use part before @ as first name
      unsubscribed: false,
    });
  } catch (error) {
    console.error('Failed to add contact to Resend audience:', error);
    throw error;
  }
}

export async function removeFromAudience(email: string): Promise<void> {
  try {
    // First, get the contact to check if they exist
    const contacts = await resend.contacts.list({
      audience_id: process.env.RESEND_AUDIENCE_ID || '',
    });

    const contact = (contacts.data as unknown as ResendContact[])?.find(c => c.email === email);

    if (contact) {
      // Update the contact to mark as unsubscribed
      await resend.contacts.update({
        id: contact.id,
        audience_id: process.env.RESEND_AUDIENCE_ID || '',
        unsubscribed: true,
      });
    }
  } catch (error) {
    console.error('Failed to remove contact from Resend audience:', error);
    throw error;
  }
} 