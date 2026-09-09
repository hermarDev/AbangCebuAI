"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Heart,
  HelpCircle,
  Menu,
  PlusCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface FinderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAccount: () => void;
}

export function FinderDrawer({
  open,
  onOpenChange,
  onOpenAccount,
}: FinderDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="menu-button !w-11 !h-11 !min-w-11 !min-h-11"
          aria-label="Open menu"
        >
          <Menu size={22} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="drawer-dialog" showCloseButton>
        <DialogHeader>
          <div className="drawer-brand">
            <Image
              src="/icons/main_Logo.png"
              alt="AbangCebu"
              width={140}
              height={41}
              priority
              className="drawer-logo"
            />
          </div>
          <DialogTitle className="sr-only">AbangCebu Menu</DialogTitle>
          <DialogDescription className="sr-only">
            Find verified boarding houses and rooms for rent in Cebu.
          </DialogDescription>
        </DialogHeader>

        <nav className="drawer-nav" aria-label="Main menu">
          <div className="drawer-nav-section-title">EXPLORE</div>
          <Link
            href="/"
            className="drawer-nav-item is-active"
            onClick={() => onOpenChange(false)}
          >
            <Compass size={18} aria-hidden="true" />
            <span>Find rentals</span>
          </Link>
          <button
            type="button"
            className="drawer-nav-item"
            onClick={() => {
              onOpenChange(false);
              onOpenAccount();
            }}
          >
            <Heart size={18} aria-hidden="true" />
            <span>Saved rentals</span>
          </button>

          <div className="drawer-nav-divider" role="separator" />
          <div className="drawer-nav-section-title">FOR LANDLORDS</div>
          <button
            type="button"
            className="drawer-nav-item"
            onClick={() => {
              onOpenChange(false);
              onOpenAccount();
            }}
          >
            <PlusCircle size={18} aria-hidden="true" />
            <span>List your property</span>
          </button>

          <div className="drawer-nav-divider" role="separator" />
          <div className="drawer-nav-section-title">SUPPORT</div>
          <Link
            href="/"
            className="drawer-nav-item"
            onClick={() => onOpenChange(false)}
          >
            <HelpCircle size={18} aria-hidden="true" />
            <span>Help & FAQs</span>
          </Link>
        </nav>

        <div className="drawer-footer">
          <div className="drawer-guest-card">
            <div className="drawer-guest-info">
              <div className="drawer-guest-avatar">
                <User size={18} aria-hidden="true" />
              </div>
              <div className="drawer-guest-text">
                <span className="drawer-guest-name">Guest account</span>
              </div>
            </div>
            <button
              type="button"
              className="drawer-signin-btn"
              onClick={() => {
                onOpenChange(false);
                onOpenAccount();
              }}
            >
              Sign in / Create account
            </button>
          </div>
          <p className="drawer-note">
            Free for renters and landlords in Cebu.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
