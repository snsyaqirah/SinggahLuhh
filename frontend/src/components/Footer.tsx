import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} JejakMasjid · by{" "}
          <a
            href="https://syaqi.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Meraqira
          </a>
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap justify-center sm:justify-end">
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <Link to="/changelog" className="hover:text-foreground transition-colors">Kemas Kini</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Dasar Privasi</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terma Perkhidmatan</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
