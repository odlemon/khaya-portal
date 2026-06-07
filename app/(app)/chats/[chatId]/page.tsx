'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ChatDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string | undefined;

  useEffect(() => {
    if (chatId) {
      router.replace(`/messages?chat=${chatId}`);
    } else {
      router.replace('/messages');
    }
  }, [router, chatId]);

  return null;
}
