export interface DemoRow {
  id: string;
  contactId: string | null;
  title: string;
  slug: string;
  template: string;
  published: boolean;
  views: number;
  updatedAt: string | number | null;
  contactName: string | null;
  contactCompany: string | null;
}
