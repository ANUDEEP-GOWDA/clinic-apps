'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type M = {
  id: number;
  filename: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
};

export default function MediaUploader({ media }: { media: M[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body: fd });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-4">
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="text-sm"
        />
        <p className="text-xs text-slate-500 mt-2">
          Files are stored in <code>/public/uploads/media</code> and referenced by URL.
        </p>
      </div>

      {media.length === 0 ? (
        <p className="text-sm text-slate-500">No media yet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((m) => (
            <li key={m.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="relative aspect-square bg-slate-50">
                {m.mimeType.startsWith('image/') ? (
                  <Image src={m.path} alt={m.filename} fill sizes="25vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    {m.filename}
                  </div>
                )}
              </div>
              <div className="p-2 text-xs">
                <div className="truncate">{m.filename}</div>
                <div className="text-slate-500">{Math.round(m.sizeBytes / 1024)} KB</div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(m.path);
                    setCopied(m.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  className="mt-1 text-[var(--color-primary)] hover:underline"
                >
                  {copied === m.id ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
