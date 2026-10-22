export function Footer() {
  return (
    <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
      &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
    </footer>
  );
}

export default Footer;
