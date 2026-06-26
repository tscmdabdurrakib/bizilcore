import Image from "next/image";

type Props = {
  url?: string | null;
  name: string;
  className?: string;
};

export default function ShopLogo({ url, name, className = "w-full h-full object-cover" }: Props) {
  if (!url) return null;
  return (
    <Image
      src={url}
      alt={name}
      fill
      sizes="64px"
      className={className}
    />
  );
}
