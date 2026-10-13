import type { MenuItem } from "@/modules/landing/types";

const leftMenuItems: MenuItem[] = [
  {
    label: "TRANG CHỦ",
    href: "/?landing=true",
    isActive: true,
  },
  {
    label: "TIN TỨC",
    href: "/tin-tuc",
  },
];

const rightMenuItems: MenuItem[] = [
  {
    label: "FANPAGE",
    href: "/fanpage",
  },
  {
    label: "HỖ TRỢ",
    href: "https://www.facebook.com/profile.php?id=61595040895107",
    isExternal: true,
  },
];

export { leftMenuItems, rightMenuItems };

