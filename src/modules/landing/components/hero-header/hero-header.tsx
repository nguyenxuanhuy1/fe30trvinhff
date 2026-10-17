"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import backgroundImage from "../../../../../public/images/background.webp";
import { useAuth } from "@/modules/auth";
import {
  leftMenuItems,
  rightMenuItems,
} from "@/modules/landing/data/navigation";
import type { MenuItem } from "@/modules/landing/types";
import "./hero-header.scss";

type HeroHeaderVariant = "hero" | "compact";

interface HeroHeaderProps {
  variant?: HeroHeaderVariant;
  showBackButton?: boolean;
}

interface MenuItemProps {
  idPrefix: string;
  item: MenuItem;
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onOpen: () => void;
  onToggle: () => void;
  isMobile?: boolean;
}

interface MenuGroupProps {
  className: string;
  idPrefix: string;
  items: MenuItem[];
  pathname: string;
  openMenu: string | null;
  onClose: () => void;
  onNavigate: () => void;
  onOpen: (href: string) => void;
  onToggle: (href: string) => void;
  isMobile?: boolean;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/" || href.startsWith("/?")) {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isExternalMenuItem(item: MenuItem) {
  return item.isExternal === true || /^https?:\/\//i.test(item.href);
}

function isMenuItemActive(item: MenuItem, pathname: string) {
  if (isExternalMenuItem(item)) {
    return false;
  }

  if (item.isActive === true) {
    return pathname === item.href;
  }

  return isPathActive(pathname, item.href);
}

function MenuItemLink({
  idPrefix,
  item,
  pathname,
  isOpen,
  onClose,
  onNavigate,
  onOpen,
  onToggle,
  isMobile = false,
}: MenuItemProps) {
  const isActive = isMenuItemActive(item, pathname);
  const hasChildren = Boolean(item.children?.length);
  const dropdownId = `${idPrefix}-dropdown-${item.href.replace(/\//g, "-")}`;
  const itemClassName = [
    "hero-header__menu-item",
    isActive ? "hero-header__menu-item--active" : "",
    isOpen ? "hero-header__menu-item--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!hasChildren) {
    if (isExternalMenuItem(item)) {
      return (
        <div className={itemClassName}>
          <a
            className="hero-header__menu-link"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
          >
            {item.label}
          </a>
        </div>
      );
    }

    return (
      <div className={itemClassName}>
        <Link
          className="hero-header__menu-link"
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={itemClassName}
      onMouseEnter={isMobile ? undefined : onOpen}
      onMouseLeave={isMobile ? undefined : onClose}
    >
      <button
        className="hero-header__menu-link hero-header__menu-link--toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        onClick={onToggle}
        onFocus={(event) => {
          // Mobile: khi chạm, focus bắn ra trước click nên nếu mở ở focus
          // thì onClick sẽ đóng ngay lại. Chỉ mở khi điều hướng bằng bàn phím.
          if (!isMobile || event.currentTarget.matches(":focus-visible")) {
            onOpen();
          }
        }}
      >
        <span>{item.label}</span>
        <span className="hero-header__chevron" aria-hidden="true" />
      </button>
      <div
        className={`hero-header__dropdown${isOpen ? " hero-header__dropdown--open" : ""}`}
        id={dropdownId}
        role="menu"
      >
        {item.children?.map((child) => (
          <Link
            className={`hero-header__dropdown-link${
              isMenuItemActive(child, pathname)
                ? " hero-header__dropdown-link--active"
                : ""
            }`}
            href={child.href}
            key={child.href}
            role="menuitem"
            onClick={onNavigate}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MenuGroup({
  className,
  idPrefix,
  items,
  pathname,
  openMenu,
  onClose,
  onNavigate,
  onOpen,
  onToggle,
  isMobile = false,
}: MenuGroupProps) {
  return (
    <div className={className}>
      {items.map((item) => (
        <MenuItemLink
          idPrefix={idPrefix}
          item={item}
          key={item.href}
          pathname={pathname}
          isOpen={openMenu === item.href}
          onClose={onClose}
          onNavigate={onNavigate}
          onOpen={() => onOpen(item.href)}
          onToggle={() => onToggle(item.href)}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

function HeroHeader({ variant = "hero", showBackButton }: HeroHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isCompact = variant === "compact";
  const shouldShowBack = showBackButton !== undefined ? showBackButton : isCompact;

  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Đóng dropdown khi click ra ngoài hoặc bấm phím Escape
  useEffect(() => {
    if (!isMobileMenuOpen && !openMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Khi mobile menu đang mở: đóng lại nếu click ra ngoài menu và không click vào nút toggle
      if (isMobileMenuOpen) {
        const isClickInsideMobileMenu = mobileMenuRef.current?.contains(target);
        const isClickOnToggle = toggleButtonRef.current?.contains(target);

        if (!isClickInsideMobileMenu && !isClickOnToggle) {
          setIsMobileMenuOpen(false);
          setOpenMenu(null);
          return;
        }
      }

      // Khi desktop menu dropdown đang mở: đóng lại nếu click ra ngoài thanh điều hướng
      if (openMenu && navRef.current && !navRef.current.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, openMenu]);

  // Tự động đóng dropdown khi chuyển tuyến đường
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  const handleBack = () => {
    const isInternalReferrer = document.referrer.startsWith(
      window.location.origin,
    );

    if (isInternalReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  const closeMenu = () => setOpenMenu(null);
  const closeAllMenus = () => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  };
  const toggleMenu = (href: string) => {
    setOpenMenu((currentMenu) => (currentMenu === href ? null : href));
  };

  const commonMenuProps = {
    pathname,
    openMenu,
    onClose: closeMenu,
    onNavigate: closeAllMenus,
    onOpen: setOpenMenu,
    onToggle: toggleMenu,
  };

  return (
    <header
      className={`hero-header${isCompact ? " hero-header--compact" : ""}${
        // Menu mobile xổ phủ xuống gần hết header, giữ nút chơi ngay sẽ đè lên menu
        isMobileMenuOpen ? " hero-header--menu-open" : ""
      }`}
    >
      {!isCompact && (
        <div className="hero-header__media" aria-hidden="true">
          <Image
            className="hero-header__background"
            src={backgroundImage}
            alt=""
            width={2048}
            height={768}
            preload
            sizes="1920px"
            quality={90}
          />
          <div className="hero-header__overlay" />
          <div className="hero-header__fade" />
        </div>
      )}

      <nav ref={navRef} className="hero-header__nav" aria-label="Điều hướng chính">
        <div className="hero-header__nav-inner">
          {shouldShowBack && (
            <button
              className="hero-header__back"
              type="button"
              onClick={handleBack}
            >
              <span className="hero-header__back-icon" aria-hidden="true" />
              <span className="hero-header__back-label">Quay lại</span>
            </button>
          )}

          <MenuGroup
            {...commonMenuProps}
            className="hero-header__menu hero-header__menu-left"
            idPrefix="desktop-left"
            items={leftMenuItems}
          />

          <Link className="hero-header__logo" href="/" aria-label="Trang chủ">
            <Image
              src="/images/logo.png"
              alt="Whisker - Cổng Trò Chơi Giáo Dục STEAM"
              width={220}
              height={81}
              sizes="220px"
            />
          </Link>

          <div
            className="hero-header__menu hero-header__menu-right"
            id="desktop-right"
          >
            <MenuGroup
              {...commonMenuProps}
              className="hero-header__menu-group"
              idPrefix="desktop-right"
              items={rightMenuItems}
            />
          </div>

          <button
            ref={toggleButtonRef}
            className="hero-header__menu-toggle"
            type="button"
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="hero-header-mobile-menu"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <div
          ref={mobileMenuRef}
          className={`hero-header__mobile-menu${
            isMobileMenuOpen ? " hero-header__mobile-menu--open" : ""
          }`}
          id="hero-header-mobile-menu"
        >
          <div className="hero-header__mobile-menu-inner">
            <MenuGroup
              {...commonMenuProps}
              className="hero-header__menu hero-header__menu-left"
              idPrefix="mobile-left"
              isMobile
              items={leftMenuItems}
            />
            <div
              className="hero-header__menu hero-header__menu-right"
              id="mobile-right"
            >
              <MenuGroup
                {...commonMenuProps}
                className="hero-header__menu-group"
                idPrefix="mobile-right"
                isMobile
                items={rightMenuItems}
              />
            </div>
          </div>
        </div>
      </nav>

      {!isCompact && (
        <section
          className="hero-header__banner"
          aria-labelledby="hero-header-title"
        >
          <button
            className="hero-header__play-button"
            type="button"
            onClick={() => {
              if (isAuthenticated || user) {
                router.push("/lessons");
              } else {
                router.push("/login?next=/lessons");
              }
            }}
          >
            <span>Chơi ngay</span>
          </button>
          <h1 className="hero-header__visually-hidden" id="hero-header-title">
            Whisker - Cổng Trò Chơi Giáo Dục STEAM &amp; Thí Nghiệm 3D Tương Tác
          </h1>
        </section>
      )}
    </header>
  );
}

export { HeroHeader };
export type { HeroHeaderProps, HeroHeaderVariant };
