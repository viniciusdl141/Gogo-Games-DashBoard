"use client";

import React, { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
};

export default ToastProvider;