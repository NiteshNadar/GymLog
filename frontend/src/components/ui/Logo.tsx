import React from 'react';
import { cn } from '../../lib/utils';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <img
      src="https://images.dualite.app/b76d449f-ea54-49dd-9e86-15bb01cb49e7/Screenshot_2026-02-03_220724-6d11ff62-4eed-471b-aa23-86465d75623e.webp"
      alt="Gym Log Logo"
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
