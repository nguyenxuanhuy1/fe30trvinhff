export interface MenuItem {
  label: string;
  href: string;
  isActive?: boolean;
  isExternal?: boolean;
  children?: MenuItem[];
}
