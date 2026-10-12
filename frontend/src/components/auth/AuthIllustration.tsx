'use client';

import React from 'react';
import Image from 'next/image';

export default function AuthIllustration() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto flex items-center justify-center p-2 select-none">
      <div className="relative w-full flex items-center justify-center">
        {/* Ilustración médica oficial con proporciones armónicas */}
        <Image
          src="/auth-illustration.jpg"
          alt="MediSync - Sistema de Gestión Médica Integral"
          width={1024}
          height={764}
          priority
          className="w-full h-auto max-h-[460px] object-contain drop-shadow-sm rounded-2xl transition duration-300"
        />
      </div>
    </div>
  );
}
