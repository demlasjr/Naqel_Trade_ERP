export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit?: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface VendorFilters {
  search: string;
  status: "active" | "inactive" | "all";
}
