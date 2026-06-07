import { NextRequest, NextResponse } from 'next/server';

const BACKEND_ORIGIN = (
  process.env.BACKEND_URL || 'http://31.220.82.129:4002'
).replace(/\/+$/, '');

async function proxyToBackendSocket(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_ORIGIN}/socket.io${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection') return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const backendRes = await fetch(targetUrl, init);
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    responseHeaders.set(key, value);
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) {
  return proxyToBackendSocket(req);
}

export async function POST(req: NextRequest) {
  return proxyToBackendSocket(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxyToBackendSocket(req);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
