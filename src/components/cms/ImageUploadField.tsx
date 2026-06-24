'use client';

import { useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
};

export default function ImageUploadField({
  value,
  onChange,
  accept = 'image/*',
  placeholder = 'Image URL',
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { ok?: boolean; media?: { url: string } };
      if (data.ok && data.media?.url) onChange(data.media.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? 'Uploading…' : '↑ Upload'}
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-14 w-auto rounded-lg border border-slate-100 object-contain bg-slate-50"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}
