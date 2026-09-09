import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="message-page">
      <Link href="/" aria-label="AbangCebu home">
        <Image
          src="/icons/main_Logo.png"
          alt="AbangCebu"
          width={150}
          height={44}
          priority
          style={{ width: "auto", height: "40px", marginBottom: "12px" }}
        />
      </Link>
      <p className="eyebrow">ABANGCEBU / 404</p>
      <h1>This place isn’t on our map.</h1>
      <p>The page may have moved, or the link may be incomplete.</p>
      <Link href="/">Back to exploring Cebu →</Link>
    </main>
  );
}
