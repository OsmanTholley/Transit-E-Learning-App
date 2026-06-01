export type AppRole = "student" | "lecturer" | "admin";

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type NavCategory = {
  label: string;
  items: NavItem[];
};

export type AdminNavigation = {
  dashboard: NavItem;
  categories: NavCategory[];
};

export type Stat = {
  label: string;
  value: string;
  trend?: string;
};

export type TableData = {
  columns: string[];
  rows: string[][];
};

export type SectionContent = {
  title: string;
  subtitle: string;
  stats?: Stat[];
  table?: TableData;
  bullets?: string[];
};
