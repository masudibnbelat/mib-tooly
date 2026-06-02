import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-(--color-bg) boxShadow w-full p-6 md:p-9 bottom-0 border-t border-(--color-active-border) mt-20">
      <p className="text-[0.8rem] sm:text-[0.9rem] text-(--color-gray) text-center">
        &copy; 2026 Developed by
        <Link href="https://masudibnbelat.vercel.app"> M i B.</Link>
      </p>
    </footer>
  );
};

export default Footer;
