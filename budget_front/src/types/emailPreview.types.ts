export interface EmailAddress {
  name: string | null;
  email: string;
}

export interface EmailPreview {
  slug: string;
  label: string;
  description: string;
  subject: string | null;
  from: EmailAddress[];
  to: EmailAddress[];
}
