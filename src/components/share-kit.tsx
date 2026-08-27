"use client";

import { Mail, MessageCircle, Send } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";

export function ShareKit({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text: string;
}) {
  const message = `${text}\n\n${url}`;
  const encoded = encodeURIComponent(message);
  const links = [
    { href: `https://wa.me/?text=${encoded}`, label: "WhatsApp", icon: MessageCircle },
    {
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      label: "Telegram",
      icon: Send,
    },
    {
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
      label: "Email",
      icon: Mail,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton value={url} label="Copy my link" />
      {links.map((link) => (
        <Button key={link.label} asChild size="sm" variant="outline">
          <a href={link.href} target="_blank" rel="noreferrer">
            <link.icon className="h-4 w-4" />
            {link.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
