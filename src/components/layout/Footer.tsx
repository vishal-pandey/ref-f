"use client";

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} ReferralNetwork. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Built with Next.js and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
