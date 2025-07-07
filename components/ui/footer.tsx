import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-left text-gray-500 px-6 max-w-[680px] mx-auto">
      <p className="!text-base">
        Made with 💙 by{" "}
        <Link
          href="https://kyraezikeuzor.com"
          className="text-blue-400 underline !text-base"
        >
          Kyra
        </Link>
      </p>
    </footer>
  );
}
