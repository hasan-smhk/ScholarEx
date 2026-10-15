import { ReactNode } from 'react';
import Navbar from './Navbar';

const Layout = ({ children }: { children: ReactNode }) => (
  <>
    <Navbar />
    <main className="page-container">{children}</main>
  </>
);
export default Layout;
